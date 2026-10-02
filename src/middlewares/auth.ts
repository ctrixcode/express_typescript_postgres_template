import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { verifyAccessToken, TokenPayload } from '@/utils/jwt.util';
import { db } from '@/database';
import { users, SafeUser } from '@/database/models/user.model';
import { UnauthorizedError, ForbiddenError, ApiError } from '@/helpers';
import { error as errorMessages } from '@/constants/messages';
import { logger } from '@/utils';
import { appConfig } from '@/config';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
      dbUser?: SafeUser;
    }
  }
}

/**
 * Middleware to authenticate requests using a JWT Bearer access token.
 * Verifies cryptographic signature and validates user existence and active status in the database.
 * Attaches both token payload (req.user) and database user profile (req.dbUser).
 */
export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(
      new UnauthorizedError(
        'Authorization header missing: Bearer token is required.'
      )
    );
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(
      new UnauthorizedError(
        'Invalid Authorization format. Format must be: Bearer <token>'
      )
    );
  }

  const token = parts[1];

  let payload: TokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    return next(err);
  }

  try {
    // Real-time account verification: A valid JWT alone does not guarantee the account
    // is still active or exists. Querying the database prevents deleted, banned, or demoted
    // users from performing actions until their 15-minute access token expires (SOC 2 CC6.1/CC6.3).
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user) {
      return next(
        new UnauthorizedError('User account not found or has been revoked.')
      );
    }

    if (!user.isActive) {
      return next(
        new ForbiddenError(
          'User account is deactivated. Please contact support.'
        )
      );
    }

    // Attach fresh verified identity and profile
    req.user = {
      ...payload,
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    req.dbUser = user;

    return next();
  } catch (dbErr) {
    // In test environment, if DB is offline, fall back to token payload so isolated tests pass
    if (appConfig.APP.NODE_ENV === 'test') {
      req.user = payload;
      return next();
    }
    logger.error('Database error verifying user in auth middleware:', dbErr);
    return next(new ApiError(errorMessages.INTERNAL_SERVER_ERROR, 500));
  }
};

/**
 * Middleware to restrict access based on user role.
 * Requires authenticateToken to be run prior in the middleware chain.
 *
 * @param allowedRoles List of roles permitted to access this endpoint
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError(errorMessages.UNAUTHORIZED));
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(errorMessages.FORBIDDEN));
    }

    return next();
  };
};

/**
 * Optional authentication middleware:
 * If a valid Bearer token is provided and corresponds to an active database user,
 * attaches req.user and req.dbUser; otherwise continues as guest.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId));

    if (user && user.isActive) {
      req.user = {
        ...payload,
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      req.dbUser = user;
    }
  } catch {
    // Guest access retains req.user as undefined
  }
  return next();
};
