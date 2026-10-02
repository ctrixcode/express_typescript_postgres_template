import { HTTP_STATUS } from '../constants';

class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    stack = ''
  ) {
    super(message);

    // Explicitly restore prototype chain for derived Error classes.
    // In TypeScript (ES5/CommonJS targets), extending built-in Error resets the prototype
    // to Error.prototype, breaking 'instanceof ApiError' and 'instanceof Subclass' checks.
    // new.target.prototype ensures the actual subclass prototype (e.g. UnauthorizedError) is linked.
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too Many Requests') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, false);
  }
}

export default ApiError;
