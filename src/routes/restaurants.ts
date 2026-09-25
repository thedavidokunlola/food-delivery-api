// Restaurant routes — list, get by id, get menu for a restaurant

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { validateQuery } from '../middleware/validate';
import { listRestaurantsQuerySchema } from '../validators/restaurant.validator';
import { listRestaurantMenuQuerySchema } from '../validators/menuItem.validator';
import { createNotFoundError } from '../middleware/errorHandler';

const router = Router();

// GET /restaurants — list all with pagination, filtering, sorting
router.get(
  '/',
  validateQuery(listRestaurantsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, offset, cuisine, isOpen, minRating, sort, order } = req.query as any;

      // Build dynamic where clause from query filters
      const where: any = {};
      if (cuisine) where.cuisine = cuisine;
      if (isOpen !== undefined) where.isOpen = isOpen;
      if (minRating !== undefined) where.rating = { gte: minRating };

      const [data, total] = await Promise.all([
        prisma.restaurant.findMany({
          where,
          orderBy: { [sort]: order },
          skip: offset,
          take: limit,
        }),
        prisma.restaurant.count({ where }),
      ]);

      res.json({
        data,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /restaurants/:id — get a single restaurant by id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw createNotFoundError('Restaurant');
    }

    res.json({ data: restaurant });
  } catch (err) {
    next(err);
  }
});

// GET /restaurants/:id/menu — get all menu items for a restaurant with filtering
router.get(
  '/:id/menu',
  validateQuery(listRestaurantMenuQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      // First verify the restaurant exists
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
      });

      if (!restaurant) {
        throw createNotFoundError('Restaurant');
      }

      const { category, isAvailable, sort, order, limit, offset } = req.query as any;

      // Build where clause scoped to this restaurant
      const where: any = { restaurantId: id };
      if (category) where.category = category;
      if (isAvailable !== undefined) where.isAvailable = isAvailable;

      const [data, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          orderBy: { [sort]: order },
          skip: offset,
          take: limit,
        }),
        prisma.menuItem.count({ where }),
      ]);

      res.json({
        data,
        meta: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
