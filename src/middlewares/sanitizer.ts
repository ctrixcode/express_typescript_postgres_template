import { Request, Response, NextFunction } from 'express';

const isPlainObject = (obj: unknown): obj is Record<string, unknown> => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj) &&
    Object.prototype.toString.call(obj) === '[object Object]' &&
    (obj.constructor === Object || obj.constructor === undefined)
  );
};

/**
 * Strips dangerous null bytes without altering intended whitespace or non-plain objects.
 */
const sanitizeValue = (val: unknown): unknown => {
  if (typeof val === 'string') {
    return val.replace(/\0/g, '');
  }

  if (Array.isArray(val)) {
    return val.map(item => sanitizeValue(item));
  }

  if (isPlainObject(val)) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(val)) {
      sanitized[key] = sanitizeValue(value);
    }
    return sanitized;
  }

  // Preserve Dates, Buffers, and other complex instances as-is
  return val;
};

/**
 * Input sanitization middleware:
 * Removes null byte injection vectors while preserving data types and passwords intact.
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      (req.query as Record<string, unknown>)[key] = sanitizeValue(
        (req.query as Record<string, unknown>)[key]
      );
    }
  }

  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitizeValue(req.params[key]) as string;
    }
  }

  next();
};

/**
 * Security header enforcement (complements Helmet)
 */
export const xssProtection = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};
