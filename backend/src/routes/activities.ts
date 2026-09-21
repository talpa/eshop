import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

const activitySchema = z.object({
  code: z.string().min(1).regex(/^\d+$/, 'Kód musí být číslo'),
  name: z.string().min(2),
  nameEn: z.string().optional().nullable(),
  nameUk: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activities = await prisma.activity.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
    res.json(activities);
  } catch (err) { next(err); }
});

router.get('/admin', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { militaryUnits: true } } },
    });
    res.json(activities);
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = activitySchema.parse(req.body);
    const activity = await prisma.activity.create({ data: body });
    res.status(201).json(activity);
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = activitySchema.partial().parse(req.body);
    const activity = await prisma.activity.update({ where: { id: req.params.id }, data: body });
    res.json(activity);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.activity.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
