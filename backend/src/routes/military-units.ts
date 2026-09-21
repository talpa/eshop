import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

const unitSchema = z.object({
  name: z.string().min(2),
  nameEn: z.string().optional().nullable(),
  nameUk: z.string().optional().nullable(),
  nameDe: z.string().optional().nullable(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug může obsahovat jen malá písmena, číslice a pomlčky'),
  description: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  descriptionUk: z.string().optional().nullable(),
  descriptionDe: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const units = await prisma.militaryUnit.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { activity: { select: { id: true, code: true, name: true } } },
    });
    res.json(units);
  } catch (err) { next(err); }
});

router.get('/admin', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const units = await prisma.militaryUnit.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { orders: true } },
        activity: { select: { id: true, code: true, name: true } },
      },
    });
    res.json(units);
  } catch (err) { next(err); }
});

router.get('/stats', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const PAID_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

    const units = await prisma.militaryUnit.findMany({ orderBy: { name: 'asc' } });

    const stats = await Promise.all(units.map(async (unit) => {
      const [received, used] = await Promise.all([
        prisma.order.aggregate({
          where: { militaryUnitId: unit.id, status: { in: [...PAID_STATUSES] } },
          _sum: { donationAmount: true },
          _count: { id: true },
        }),
        prisma.order.aggregate({
          where: { militaryUnitId: unit.id, fundsUsed: true },
          _sum: { donationAmount: true },
          _count: { id: true },
        }),
      ]);

      return {
        id: unit.id,
        name: unit.name,
        slug: unit.slug,
        isActive: unit.isActive,
        orderCount: received._count.id,
        totalReceived: Number(received._sum.donationAmount ?? 0),
        totalUsed: Number(used._sum.donationAmount ?? 0),
      };
    }));

    res.json(stats);
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = unitSchema.parse(req.body);
    const unit = await prisma.militaryUnit.create({ data: body });
    res.status(201).json(unit);
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = unitSchema.partial().parse(req.body);
    const unit = await prisma.militaryUnit.update({ where: { id: req.params.id }, data: body });
    res.json(unit);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.militaryUnit.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
