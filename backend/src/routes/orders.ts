import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateVariableSymbol, generateQrPayload } from '../lib/fio';

const router = Router();

const createOrderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  shippingAddress: z.string().min(5),
  note: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1),
});

router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createOrderSchema.parse(req.body);

    const products = await prisma.product.findMany({
      where: { id: { in: body.items.map(i => i.productId) }, isActive: true },
    });

    if (products.length !== body.items.length) {
      res.status(400).json({ message: 'Jeden nebo více produktů není dostupných.' });
      return;
    }

    for (const item of body.items) {
      const product = products.find(p => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        res.status(400).json({ message: `Nedostatečný sklad pro produkt: ${product.name}` });
        return;
      }
    }

    const totalCzk = body.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)!;
      return sum + Number(product.priceCzk) * item.quantity;
    }, 0);

    const variableSymbol = generateVariableSymbol();
    const iban = process.env.SHOP_IBAN || '';
    const qrPayload = iban
      ? generateQrPayload(iban, totalCzk, variableSymbol, `Objednavka ${variableSymbol}`)
      : '';

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user!.id,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          shippingAddress: body.shippingAddress,
          note: body.note,
          totalCzk,
          variableSymbol,
          items: {
            create: body.items.map(item => {
              const product = products.find(p => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCzk: product.priceCzk,
                productName: product.name,
              };
            }),
          },
          payment: {
            create: {
              amountCzk: totalCzk,
              qrPayload,
            },
          },
        },
        include: { items: true, payment: true },
      });

      for (const item of body.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    res.status(201).json(order);
  } catch (err) { next(err); }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';
    const orders = await prisma.order.findMany({
      where: isAdmin ? {} : { userId: req.user!.id },
      include: { items: true, payment: { select: { status: true, paidAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(isAdmin ? {} : { userId: req.user!.id }),
      },
      include: {
        items: { include: { product: { select: { id: true, slug: true, images: true } } } },
        payment: true,
      },
    });
    if (!order) { res.status(404).json({ message: 'Objednávka nenalezena.' }); return; }
    res.json(order);
  } catch (err) { next(err); }
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

router.patch('/:id/status', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(order);
  } catch (err) { next(err); }
});

export default router;
