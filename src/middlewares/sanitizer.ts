import { Request, Response, NextFunction } from 'express';

/**
 * Checks if a given value is a standard JSON-like plain object literal `{}`.
 *
 * Why this is crucial:
 * Standard `typeof obj === 'object'` matches instances of `Date`, `Buffer`, `RegExp`, etc.
 * If we ran `Object.entries(new Date())`, it would return an empty object `{}` and destroy the data.
 * This helper ensures only plain objects are traversed, leaving Dates and Buffers intact.
 */
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
 * Recursively strips null bytes (`\0`) from request payloads.
 *
 * Why we only strip null bytes:
 * 1. Null Byte Poisoning: In C-based libraries (file system APIs, native DB drivers),
 *    a null byte `\0` acts as a string terminator, which can truncate strings prematurely.
 * 2. Preserves Whitespace: We intentionally DO NOT call `.trim()` here. Calling trim globally
 *    alters passwords containing intentional leading/trailing spaces or code snippets.
 *    Any specific field trimming should be done via Zod schema definitions (`z.string().trim()`).
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

  // Preserve Dates, Buffers, numbers, booleans, and other complex instances as-is
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

  // In Express 5, `req.query` is a getter-only property on `Request.prototype`.
  // Direct reassignment (`req.query = ...`) throws a TypeError.
  // Therefore, we mutate the properties of the existing query object in-place.
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      (req.query as Record<string, unknown>)[key] = sanitizeValue(
        (req.query as Record<string, unknown>)[key]
      );
    }
  }

  // Similarly, `req.params` in Express 5 must be mutated in-place to preserve prototype bindings.
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
