// Zod schemas for restaurant query parameter validation

import { z } from 'zod';
import { CONFIG } from '../config';

// Validates query params for GET /api/v1/restaurants — clamps limit, validates sort fields
export const listRestaurantsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = val ? parseInt(val, 10) : CONFIG.pagination.defaultLimit;
      return Math.min(isNaN(num) ? CONFIG.pagination.defaultLimit : num, CONFIG.pagination.maxLimit);
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => {
      const num = val ? parseInt(val, 10) : 0;
      if (isNaN(num) || num < 0) throw new Error('Offset must be a non-negative integer');
      return num;
    })
    .refine((val) => val >= 0, { message: 'Offset must be a non-negative integer' }),
  cuisine: z.string().optional(),
  isOpen: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  minRating: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      const num = parseFloat(val);
      return isNaN(num) ? undefined : num;
    }),
  sort: z.enum(['name', 'rating', 'deliveryTime']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type ListRestaurantsQuery = z.infer<typeof listRestaurantsQuerySchema>;
