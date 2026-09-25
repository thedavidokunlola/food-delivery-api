// Global error handler middleware — catches all thrown errors and returns the standard error envelope

import { Request, Response, NextFunction } from 'express';

// Custom API error class with structured code and status
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Factory helpers for common error types
export const createNotFoundError = (resource: string): ApiError =>
  new ApiError(404, 'NOT_FOUND', `${resource} not found`);

export const createValidationError = (message: string): ApiError =>
  new ApiError(422, 'VALIDATION_ERROR', message);

export const createInvalidParamsError = (message: string): ApiError =>
  new ApiError(400, 'INVALID_PARAMS', message);

export const createInvalidStatusTransitionError = (from: string, to: string): ApiError =>
  new ApiError(400, 'INVALID_STATUS_TRANSITION', `Cannot transition from '${from}' to '${to}'`);

// Express error handler — must have 4 parameters to be recognized as error middleware
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${err.message}`, err instanceof ApiError ? '' : err.stack);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Never expose stack traces in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message;

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
}
