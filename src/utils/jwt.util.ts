import jwt, { SignOptions } from 'jsonwebtoken';
// Use native crypto.randomUUID() instead of the external 'uuid' package to avoid
// Jest CommonJS vs ESM module loader conflicts ('Must use import to load ES Module').
import { randomUUID } from 'crypto';
import { db } from '@/database';
import { authSessionTokens } from '@/database/models/auth-session-token.model';
import { UnauthorizedError } from '@/helpers';
import { error as errorMessages } from '@/constants/messages';
import { logger } from './logger.util';
import { appConfig } from '@/config';

export interface TokenPayload {
  userId: string;
  email?: string;
  role?: string;
  typ?: 'access' | 'refresh';
  jti?: string;
}

/**
 * Generates an access token.
 * Pinned to HS256 and signed with dedicated ACCESS_TOKEN_SECRET.
 * @param payload The data to include in the token.
 * @returns The generated access token string.
 */
export const generateAccessToken = (
  payload: Omit<TokenPayload, 'typ'>
): string => {
  const options: SignOptions = {
    expiresIn: appConfig.JWT.ACCESS_TOKEN_TIME as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  return jwt.sign(
    { ...payload, typ: 'access' },
    appConfig.JWT.ACCESS_TOKEN_SECRET,
    options
  );
};

/**
 * Generates a refresh token and securely persists session metadata to the database.
 * Pinned to HS256 and signed with dedicated REFRESH_TOKEN_SECRET.
 * @param payload The data to include in the token.
 * @param userAgent The user agent of the client.
 * @returns An object containing the refresh token string and its JTI.
 */
export const generateRefreshToken = async (
  payload: Omit<TokenPayload, 'typ'>,
  userAgent: string
): Promise<{ refreshToken: string; jti: string }> => {
  const jti = randomUUID();
  const options: SignOptions = {
    expiresIn: appConfig.JWT.REFRESH_TOKEN_TIME as SignOptions['expiresIn'],
    jwtid: jti,
    algorithm: 'HS256',
  };
  const refreshToken = jwt.sign(
    { ...payload, typ: 'refresh' },
    appConfig.JWT.REFRESH_TOKEN_SECRET,
    options
  );

  // Calculate expiration date for database storage
  let expiresInSeconds: number;
  if (typeof appConfig.JWT.REFRESH_TOKEN_TIME === 'string') {
    const value = parseInt(appConfig.JWT.REFRESH_TOKEN_TIME.slice(0, -1), 10);
    const unit = appConfig.JWT.REFRESH_TOKEN_TIME.slice(-1);
    switch (unit) {
      case 's':
        expiresInSeconds = value;
        break;
      case 'm':
        expiresInSeconds = value * 60;
        break;
      case 'h':
        expiresInSeconds = value * 60 * 60;
        break;
      case 'd':
        expiresInSeconds = value * 24 * 60 * 60;
        break;
      default:
        expiresInSeconds = 7 * 24 * 60 * 60; // Default to 7 days
    }
  } else {
    expiresInSeconds = appConfig.JWT.REFRESH_TOKEN_TIME;
  }

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  // Await saving refresh token metadata to database to ensure atomic session creation
  try {
    await db.insert(authSessionTokens).values({
      userId: payload.userId,
      jti: jti,
      expiresAt: expiresAt,
      isUsed: false,
      userAgent: userAgent || 'unknown',
    });
  } catch (err) {
    logger.error('Failed to persist refresh token session to database:', err);
    throw new Error('Authentication session creation failed.');
  }

  return { refreshToken, jti };
};

/**
 * Verifies an access token.
 * Validates HS256 algorithm and checks token type.
 * @param token The JWT access token string to verify.
 * @returns The decoded payload if the token is valid.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const payload = jwt.verify(token, appConfig.JWT.ACCESS_TOKEN_SECRET, {
      algorithms: ['HS256'],
    }) as TokenPayload;

    if (payload.typ && payload.typ !== 'access') {
      throw new UnauthorizedError('Invalid token type: expected access token.');
    }

    return payload;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError(errorMessages.AUTH.EXPIRED_TOKEN);
    }
    throw new UnauthorizedError(errorMessages.AUTH.INVALID_TOKEN);
  }
};

/**
 * Verifies a refresh token.
 * Validates HS256 algorithm, dedicated REFRESH_TOKEN_SECRET, and refresh token type.
 * @param token The JWT refresh token string to verify.
 * @returns The decoded payload if the token is valid.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const payload = jwt.verify(token, appConfig.JWT.REFRESH_TOKEN_SECRET, {
      algorithms: ['HS256'],
    }) as TokenPayload;

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedError(
        'Invalid token type: expected refresh token.'
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError(errorMessages.AUTH.EXPIRED_TOKEN);
    }
    throw new UnauthorizedError(errorMessages.AUTH.INVALID_TOKEN);
  }
};

/**
 * Decodes a JWT token without verifying its signature.
 * @param token The JWT token string to decode.
 * @returns The decoded payload or null if decoding fails.
 */
export const decodeToken = (token: string): TokenPayload | null => {
  return jwt.decode(token) as TokenPayload | null;
};
