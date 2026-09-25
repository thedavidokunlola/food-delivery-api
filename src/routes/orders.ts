// Order routes — list, get, create, update status, cancel

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { validateQuery, validateBody } from '../middleware/validate';
import {
  listOrdersQuerySchema,
  createOrderSchema,
  updateOrderStatusSchema,
} from '../validators/order.validator';
import {
  createNotFoundError,
  createValidationError,
  createInvalidStatusTransitionError,
  ApiError,
} from '../middleware/errorHandler';
import { CONFIG } from '../config';

const router = Router();

// GET /orders — list all orders with pagination, filtering, sorting
router.get(
  '/',
  validateQuery(listOrdersQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, offset, restaurantId, status, sort, order } = req.query as any;

      // Build dynamic where clause from query filters
      const where: any = {};
      if (restaurantId) where.restaurantId = restaurantId;
      if (status) where.status = status;

      const [data, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { [sort]: order },
          skip: offset,
          take: limit,
          include: {
            restaurant: {
              select: { id: true, name: true },
            },
            orderItems: {
              include: {
                menuItem: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        }),
        prisma.order.count({ where }),
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

// GET /orders/:id — get a single order with its order items
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: { id: true, name: true },
        },
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw createNotFoundError('Order');
    }

    res.json({ data: order });
  } catch (err) {
    next(err);
  }
});

// POST /orders — create a new order with server-calculated prices (all in kobo)
router.post(
  '/',
  validateBody(createOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, customerName, customerPhone, deliveryAddress, items } = req.body;

      // Verify the restaurant exists
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw createNotFoundError('Restaurant');
      }

      // Fetch all menu items and validate they belong to this restaurant
      const menuItemIds = items.map((item: any) => item.menuItemId);
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: { in: menuItemIds },
          restaurantId,
        },
      });

      // Check that all requested menu items were found
      if (menuItems.length !== menuItemIds.length) {
        const foundIds = new Set(menuItems.map((mi) => mi.id));
        const missingIds = menuItemIds.filter((id: string) => !foundIds.has(id));
        throw createValidationError(
          `Menu items not found or do not belong to this restaurant: ${missingIds.join(', ')}`
        );
      }

      // Check all items are available
      const unavailable = menuItems.filter((mi) => !mi.isAvailable);
      if (unavailable.length > 0) {
        throw createValidationError(
          `These menu items are currently unavailable: ${unavailable.map((mi) => mi.name).join(', ')}`
        );
      }

      // Build order items with server-calculated prices (kobo)
      const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]));
      const orderItemsData = items.map((item: any) => {
        const menuItem = menuItemMap.get(item.menuItemId)!;
        const unitPrice = menuItem.price; // kobo
        const subtotal = unitPrice * item.quantity; // kobo
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice, // kobo
          subtotal, // kobo
        };
      });

      // Calculate total — sum of all subtotals in kobo
      const totalAmount = orderItemsData.reduce(
        (sum: number, item: any) => sum + item.subtotal,
        0
      );

      // Create order with nested order items in a single transaction
      const order = await prisma.order.create({
        data: {
          restaurantId,
          customerName,
          customerPhone,
          deliveryAddress,
          totalAmount, // kobo
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          restaurant: {
            select: { id: true, name: true },
          },
          orderItems: {
            include: {
              menuItem: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      res.status(201).json({ data: order });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /orders/:id — update order status only, with transition validation
router.patch(
  '/:id',
  validateBody(updateOrderStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status: newStatus } = req.body;

      // Fetch current order to check existing status
      const existingOrder = await prisma.order.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        throw createNotFoundError('Order');
      }

      // Validate the status transition using CONFIG rules
      const allowedTransitions = CONFIG.validStatusTransitions[existingOrder.status] || [];
      if (!allowedTransitions.includes(newStatus)) {
        throw createInvalidStatusTransitionError(existingOrder.status, newStatus);
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: newStatus },
        include: {
          restaurant: {
            select: { id: true, name: true },
          },
          orderItems: {
            include: {
              menuItem: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      res.json({ data: updatedOrder });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /orders/:id — cancel an order (only if pending or confirmed)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw createNotFoundError('Order');
    }

    // Only pending or confirmed orders can be cancelled via DELETE
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new ApiError(
        400,
        'INVALID_STATUS_TRANSITION',
        `Cannot cancel order with status '${order.status}'. Only pending or confirmed orders can be cancelled.`
      );
    }

    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        restaurant: {
          select: { id: true, name: true },
        },
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    res.json({ data: cancelledOrder });
  } catch (err) {
    next(err);
  }
});

export default router;
