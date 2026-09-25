// Central configuration file — all changeable values live here, never hardcoded in handlers

import 'dotenv/config';

export const CONFIG = {
  api: {
    version: 'v1',
    port: process.env.PORT || 3000,
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  rateLimit: {
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP. Please try again in a minute.',
  },
  seed: {
    restaurantCount: 50,
    menuItemsPerRestaurant: 10,
    orderCount: 200,
  },
  orderStatuses: [
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ] as const,
  // Valid forward status transitions — prevents illegal state changes
  validStatusTransitions: {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: [],
  } as Record<string, string[]>,
  menuCategories: ['Starters', 'Mains', 'Drinks', 'Desserts', 'Sides'] as const,
  cuisineTypes: [
    'Nigerian',
    'Shawarma',
    'Pizza',
    'Chinese',
    'Continental',
    'Fast Food',
    'Seafood',
    'Grills',
    'Pastries',
    'Healthy',
  ] as const,
};
