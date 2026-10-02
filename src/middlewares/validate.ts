import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils';
import { appConfig } from '../config'; // Import appConfig

export const validate =
  (schema: z.Schema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as {
        body?: typeof req.body;
        query?: typeof req.query;
        params?: typeof req.params;
      };
      if (parsed.body !== undefined) req.body = parsed.body;

      // In Express 5, req.query has only a getter on Request.prototype.
      // Reassigning 'req.query = ...' causes a TypeError.
      // Instead, we clear existing keys and assign parsed/coerced values in place.
      if (parsed.query !== undefined && req.query) {
        for (const key of Object.keys(req.query)) {
          delete (req.query as Record<string, unknown>)[key];
        }
        Object.assign(req.query, parsed.query);
      }

      // Mutate req.params in place to preserve Express 5 route parameter bindings.
      if (parsed.params !== undefined && req.params) {
        for (const key of Object.keys(req.params)) {
          delete (req.params as Record<string, unknown>)[key];
        }
        Object.assign(req.params, parsed.params);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(issue => ({
          message: `${issue.path.join('.')} is ${issue.message.toLowerCase()}`,
        }));
        // Only log Zod errors if not in test environment
        if (appConfig.APP.NODE_ENV !== 'test') {
          logger.error('Zod validation error', { errors: errorMessages });
        }
        return res.status(400).json({ success: false, errors: errorMessages });
      }
      logger.error('Internal server error in validation middleware', { error });
      return res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
  };
