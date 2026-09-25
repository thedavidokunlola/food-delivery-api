// Express app setup — assembles middleware, routes, and error handler

import express from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import restaurantRoutes from './routes/restaurants';
import menuItemRoutes from './routes/menuItems';
import orderRoutes from './routes/orders';

const app = express();

// Global middleware — CORS for consumer apps, JSON parsing, rate limiting
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// API version prefix from CONFIG
const prefix = `/api/${CONFIG.api.version}`;

// Mount resource routes under versioned prefix
app.use(`${prefix}/restaurants`, restaurantRoutes);
app.use(`${prefix}/menu-items`, menuItemRoutes);
app.use(`${prefix}/orders`, orderRoutes);

// Health check endpoint — does not count toward rate limiting
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: CONFIG.api.version });
});

// Root endpoint — API info
app.get('/', (_req, res) => {
  res.json({
    name: 'Lagos Food Delivery Market API',
    version: CONFIG.api.version,
    endpoints: {
      restaurants: `${prefix}/restaurants`,
      menuItems: `${prefix}/menu-items`,
      orders: `${prefix}/orders`,
      health: '/health',
    },
  });
});

// Global error handler — must be registered last
app.use(errorHandler);

export default app;
