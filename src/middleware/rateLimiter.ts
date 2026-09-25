// Rate limiter middleware — uses CONFIG values, returns the standard error envelope on 429

import rateLimit from 'express-rate-limit';
import { CONFIG } from '../config';

// Apply rate limiting to all routes using values from CONFIG
export const rateLimiter = rateLimit({
  windowMs: CONFIG.rateLimit.windowMs,
  max: CONFIG.rateLimit.max,
  legacyHeaders: false,
  standardHeaders: 'draft-7',
  // Custom handler to return the standard error envelope with retryAfter
  handler: (_req, res) => {
    const retryAfterSeconds = Math.ceil(CONFIG.rateLimit.windowMs / 1000);
    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Retry after ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      },
    });
  },
});
