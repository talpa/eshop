import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '25', search } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const where = search
      ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true, email: true, name: true, phone: true, preferredLanguage: true, role: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total, page: parseInt(page), limit: take });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, name: true, phone: true, preferredLanguage: true, role: true, createdAt: true,
        addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, status: true, totalCzk: true, donationAmount: true, variableSymbol: true,
            createdAt: true, customerName: true,
            militaryUnit: { select: { name: true, slug: true } },
          },
        },
      },
    });
    if (!user) { res.status(404).json({ message: 'Uživatel nenalezen.' }); return; }
    res.json(user);
  } catch (err) { next(err); }
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  preferredLanguage: z.enum(['cs', 'en', 'uk', 'de']).optional().nullable(),
  role: z.enum(['ADMIN', 'CUSTOMER']).optional(),
});

router.patch('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = updateSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, phone: true, preferredLanguage: true, role: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

const addressSchema = z.object({
  label: z.string().optional().nullable(),
  street: z.string().min(1),
  city: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().default('CZ'),
  isDefault: z.boolean().optional(),
});

router.post('/:id/addresses', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = addressSchema.parse(req.body);
    if (data.isDefault) {
      await prisma.userAddress.updateMany({ where: { userId: req.params.id }, data: { isDefault: false } });
    }
    const address = await prisma.userAddress.create({ data: { ...data, userId: req.params.id } });
    res.status(201).json(address);
  } catch (err) { next(err); }
});

router.patch('/:id/addresses/:addrId', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = addressSchema.partial().parse(req.body);
    if (data.isDefault) {
      await prisma.userAddress.updateMany({ where: { userId: req.params.id }, data: { isDefault: false } });
    }
    const address = await prisma.userAddress.update({ where: { id: req.params.addrId }, data });
    res.json(address);
  } catch (err) { next(err); }
});

router.delete('/:id/addresses/:addrId', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.userAddress.delete({ where: { id: req.params.addrId } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
