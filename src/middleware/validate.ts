// Reusable validation middleware — takes a Zod schema and validates body or query params

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Validates the request body against the provided Zod schema (422 on failure)
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = (err as any).issues || (err as any).errors || [];
        const fieldErrors = issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message,
        }));
        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body validation failed',
            details: fieldErrors,
          },
        });
        return;
      }
      next(err);
    }
  };
}

// Validates query parameters against the provided Zod schema (400 on failure)
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = (err as any).issues || (err as any).errors || [];
        const fieldErrors = issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message,
        }));
        res.status(400).json({
          error: {
            code: 'INVALID_PARAMS',
            message: 'Invalid query parameters',
            details: fieldErrors,
          },
        });
        return;
      }
      next(err);
    }
  };
}
