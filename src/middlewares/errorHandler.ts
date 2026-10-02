import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';
import { ApiError, NotFoundError, sendErrorResponse } from '../helpers';
import { error as errorMessages } from '../constants/messages';
import { appConfig } from '../config';

// 404 handler - using a specific error class
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(new NotFoundError(`Route not found: ${req.originalUrl}`));
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let error = err;

  // Defensive check: If 'instanceof ApiError' is false (e.g. error thrown across different module
  // boundaries or execution contexts), check if the error object carries an HTTP statusCode.
  // This prevents valid operational errors (400, 401, 403, 404) from being mistakenly converted to 500.
  if (!(error instanceof ApiError)) {
    const errorWithStatus = error as unknown as {
      statusCode?: number;
      isOperational?: boolean;
    };
    if (typeof errorWithStatus.statusCode === 'number') {
      error = new ApiError(
        error.message || errorMessages.INTERNAL_SERVER_ERROR,
        errorWithStatus.statusCode,
        errorWithStatus.isOperational ?? true,
        error.stack
      );
    } else {
      logger.error('UNHANDLED_ERROR', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
      error = new ApiError(
        errorMessages.INTERNAL_SERVER_ERROR,
        500,
        false // This is not an operational error
      );
    }
  }

  const { statusCode, message, isOperational, stack } = error as ApiError;

  // For non-operational errors in production, we don't want to leak details.
  if (!isOperational && appConfig.APP.NODE_ENV === 'production') {
    sendErrorResponse(res, 500, errorMessages.INTERNAL_SERVER_ERROR);
    return;
  }

  // Log operational errors for monitoring
  if (isOperational) {
    logger.warn('OPERATIONAL_ERROR', {
      message: message,
      path: req.path,
      method: req.method,
    });
  }

  // Include stack trace in development for easier debugging
  const errorStack =
    appConfig.APP.NODE_ENV === 'development' ? stack : undefined;

  sendErrorResponse(res, statusCode, message, undefined, undefined, errorStack);
};
