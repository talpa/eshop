import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, phone: true, preferredLanguage: true, role: true, createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    res.json(users);
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

export default router;
