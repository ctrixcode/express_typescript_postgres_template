import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '@/utils/jwt.util';
import { UnauthorizedError, ForbiddenError } from '@/helpers';
import { error as errorMessages } from '@/constants/messages';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using a JWT Bearer access token.
 * Attaches the verified token payload to req.user.
 */
export const authenticateToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
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

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return next(err);
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
 * If a valid Bearer token is provided, attaches req.user; otherwise continues as guest.
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
  } catch {
    // Guest access retains req.user as undefined
  }
  return next();
};
