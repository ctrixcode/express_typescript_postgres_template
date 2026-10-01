import { Request, Response, NextFunction } from 'express';
import type { ParsedQs } from 'qs';

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

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query) as ParsedQs;
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params) as Record<string, string>;
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
    return res.status(400).json({
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
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
      });
    }

    userRequests.count++;
    next();
  };
};
