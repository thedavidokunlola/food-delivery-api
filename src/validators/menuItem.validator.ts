// Zod schemas for menu item query parameter validation

import { z } from 'zod';
import { CONFIG } from '../config';

// Validates query params for GET /api/v1/menu-items — supports price range filtering in kobo
export const listMenuItemsQuerySchema = z.object({
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
  restaurantId: z.string().optional(),
  category: z.string().optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      const num = parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }),
  isAvailable: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sort: z.enum(['name', 'price']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Validates query params for GET /api/v1/restaurants/:id/menu
export const listRestaurantMenuQuerySchema = z.object({
  category: z.string().optional(),
  isAvailable: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sort: z.enum(['name', 'price']).optional().default('name'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
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
});

export type ListMenuItemsQuery = z.infer<typeof listMenuItemsQuerySchema>;
export type ListRestaurantMenuQuery = z.infer<typeof listRestaurantMenuQuerySchema>;
