import { eq, and } from 'drizzle-orm';
import { db } from '@/database';
import { users, SafeUser } from '@/database/models/user.model';
import { authSessionTokens } from '@/database/models/auth-session-token.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken,
} from '@/utils/jwt.util';
import { hashPassword, verifyPassword } from '@/utils/password.util';
import { ConflictError, UnauthorizedError, ForbiddenError } from '@/helpers';
import { RegisterInput, LoginInput } from './auth.schema';

/**
 * Converts a database user record into a SafeUser by stripping the hashed password.
 */
const toSafeUser = (user: typeof users.$inferSelect): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
};

/**
 * Registers a new user account:
 * 1. Checks for duplicate email collisions.
 * 2. Hashes the password using scrypt with a random salt (via password.util.ts).
 * 3. Persists the user in PostgreSQL.
 * 4. Issues an initial short-lived access token and a tracked refresh token.
 */
export const register = async (
  input: RegisterInput,
  userAgent: string
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> => {
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser) {
    throw new ConflictError('A user with this email address already exists.');
  }

  const hashedPassword = await hashPassword(input.password);

  const [newUser] = await db
    .insert(users)
    .values({
      email: input.email,
      password: hashedPassword,
      name: input.name || null,
      role: 'user',
      isActive: true,
      isEmailVerified: false,
    })
    .returning();

  const safeUser = toSafeUser(newUser);

  const tokenPayload = {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const { refreshToken } = await generateRefreshToken(tokenPayload, userAgent);

  return { user: safeUser, accessToken, refreshToken };
};

/**
 * Authenticates user credentials:
 * 1. Finds user by email in PostgreSQL.
 * 2. Validates account active status.
 * 3. Compares plaintext password against scrypt derived key in constant time (prevents timing attacks).
 * 4. Updates `lastLoginAt` and issues a new pair of access and refresh tokens.
 */
export const login = async (
  input: LoginInput,
  userAgent: string
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ForbiddenError(
      'Your account has been deactivated. Please contact support.'
    );
  }

  const isPasswordValid = await verifyPassword(input.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  // Update last login timestamp asynchronously
  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  const safeUser = toSafeUser(user);

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const { refreshToken } = await generateRefreshToken(tokenPayload, userAgent);

  return { user: safeUser, accessToken, refreshToken };
};

/**
 * Implements Refresh Token Rotation (RTR):
 * 1. Cryptographically verifies JWT signature and expiration.
 * 2. Checks DB session record to confirm the token has not been revoked or already used.
 * 3. Immediately invalidates the consumed refresh token (`isUsed = true`) to prevent replay attacks.
 * 4. Issues a brand-new access token and a brand-new refresh token.
 */
export const refresh = async (
  refreshToken: string,
  userAgent: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const payload = verifyRefreshToken(refreshToken);

  if (!payload.jti) {
    throw new UnauthorizedError('Invalid refresh token.');
  }

  // Look up stored session token in DB for replay detection & revocation check
  const [session] = await db
    .select()
    .from(authSessionTokens)
    .where(eq(authSessionTokens.jti, payload.jti))
    .limit(1);

  if (!session || session.isUsed || session.expiresAt < new Date()) {
    throw new UnauthorizedError(
      'Refresh token is invalid, expired, or has already been used.'
    );
  }

  // Invalidate current refresh token (Refresh Token Rotation)
  await db
    .update(authSessionTokens)
    .set({ isUsed: true, updatedAt: new Date() })
    .where(eq(authSessionTokens.id, session.id));

  // Verify user is still active
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || !user.isActive) {
    throw new ForbiddenError('User account not found or deactivated.');
  }

  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const { refreshToken: newRefreshToken } = await generateRefreshToken(
    tokenPayload,
    userAgent
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logs out a session by revoking the refresh token:
 * Decodes token to locate its unique JTI and marks `isUsed = true` in PostgreSQL.
 */
export const logout = async (refreshToken?: string): Promise<boolean> => {
  if (!refreshToken) return true;

  try {
    const decoded = decodeToken(refreshToken);
    if (decoded?.jti) {
      await db
        .update(authSessionTokens)
        .set({ isUsed: true, updatedAt: new Date() })
        .where(
          and(
            eq(authSessionTokens.jti, decoded.jti),
            eq(authSessionTokens.isUsed, false)
          )
        );
    }
  } catch {
    // Ignore errors during logout
  }

  return true;
};
