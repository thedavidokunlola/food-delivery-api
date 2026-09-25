// Zod schemas for order validation — request body and query parameters

import { z } from 'zod';
import { CONFIG } from '../config';

// Validates query params for GET /api/v1/orders
export const listOrdersQuerySchema = z.object({
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
  status: z.enum(CONFIG.orderStatuses).optional(),
  sort: z.enum(['createdAt', 'totalAmount']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Validates POST /api/v1/orders body — Nigerian phone format, min lengths, items array
export const createOrderSchema = z.object({
  restaurantId: z.string().min(1, 'restaurantId is required'),
  customerName: z.string().min(2, 'customerName must be at least 2 characters'),
  customerPhone: z
    .string()
    .regex(
      /^(\+234|0)(7[0-9]|8[0-9]|9[0-9])[0-9]{8}$/,
      'customerPhone must be a valid Nigerian phone number (e.g., 08031234567 or +2348031234567)'
    ),
  deliveryAddress: z.string().min(10, 'deliveryAddress must be at least 10 characters'),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1, 'menuItemId is required'),
        quantity: z.number().int().min(1, 'quantity must be at least 1'),
      })
    )
    .min(1, 'At least one item is required'),
});

// Validates PATCH /api/v1/orders/:id body — only status field, must be valid status
export const updateOrderStatusSchema = z.object({
  status: z.enum(CONFIG.orderStatuses),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
