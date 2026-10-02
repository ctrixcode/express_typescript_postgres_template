import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../constants';

/**
 * Simple input sanitization middleware
 * Removes potentially harmful content from request data
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // In Express 5, req.query is a getter-only property on Request.prototype.
  // Reassigning 'req.query = ...' throws 'TypeError: Cannot set property query which has only a getter'.
  // Therefore, we must mutate the existing query object's properties in place.
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      (req.query as Record<string, unknown>)[key] = sanitizeObject(
        (req.query as Record<string, unknown>)[key]
      );
    }
  }

  // Similarly, req.params in Express 5 must be mutated in place to preserve prototype bindings.
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitizeObject(req.params[key]) as string;
    }
  }

  next();
};

/**
 * Sanitize an object recursively
 */
const sanitizeObject = (obj: unknown): unknown => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitize a string value
 */
const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;

  return (
    str
      // Remove dangerous null bytes to prevent null byte injection
      .replace(/\0/g, '')
      .trim()
  );
};

/**
 * XSS Protection middleware
 */
export const xssProtection = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set modern security headers per OWASP guidelines (disable deprecated buggy XSS auditor)
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
};

/**
 * SQL Injection Protection (basic)
 */
export const sqlInjectionProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\b\s+['"]\w+['"]\s*=\s*['"]\w+['"])/gi,
    /(--|\/\*|\*\/|;)/g,
  ];

  const checkForSQLInjection = (obj: unknown): boolean => {
    if (typeof obj === 'string') {
      return sqlPatterns.some(pattern => pattern.test(obj));
    }

    if (Array.isArray(obj)) {
      return obj.some(item => checkForSQLInjection(item));
    }

    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(value => checkForSQLInjection(value));
    }

    return false;
  };

  if (
    checkForSQLInjection(req.body) ||
    checkForSQLInjection(req.query) ||
    checkForSQLInjection(req.params)
  ) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Potentially harmful content detected',
    });
  }

  next();
};

/**
 * Rate limiting for specific endpoints with memory leak protection
 */
export const createRateLimit = (
  windowMs: number = 15 * 60 * 1000,
  max: number = 100
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Prune expired entries to prevent memory exhaustion
    if (requests.size > 500) {
      for (const [key, val] of requests.entries()) {
        if (now > val.resetTime) {
          requests.delete(key);
        }
      }
    }

    const userRequests = requests.get(ip);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= max) {
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many requests, please try again later',
      });
    }

    userRequests.count++;
    next();
  };
};
