// Menu item routes — list all across restaurants, get by id

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { validateQuery } from '../middleware/validate';
import { listMenuItemsQuerySchema } from '../validators/menuItem.validator';
import { createNotFoundError } from '../middleware/errorHandler';

const router = Router();

// GET /menu-items — list all menu items with pagination, filtering, sorting
router.get(
  '/',
  validateQuery(listMenuItemsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, offset, restaurantId, category, minPrice, maxPrice, isAvailable, sort, order } =
        req.query as any;

      // Build dynamic where clause with optional price range filter (kobo)
      const where: any = {};
      if (restaurantId) where.restaurantId = restaurantId;
      if (category) where.category = category;
      if (isAvailable !== undefined) where.isAvailable = isAvailable;

      // Price range filtering — all values in kobo
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      const [data, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          orderBy: { [sort]: order },
          skip: offset,
          take: limit,
          include: {
            restaurant: {
              select: { id: true, name: true, cuisine: true },
            },
          },
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

// GET /menu-items/:id — get a single menu item by id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: { id: true, name: true, cuisine: true },
        },
      },
    });

    if (!menuItem) {
      throw createNotFoundError('Menu item');
    }

    res.json({ data: menuItem });
  } catch (err) {
    next(err);
  }
});

export default router;
