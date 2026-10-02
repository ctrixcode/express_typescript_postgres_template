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
    super(message, 400);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export default ApiError;
