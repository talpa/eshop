import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: true, _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (err) { next(err); }
});

router.get('/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        products: { where: { isActive: true }, orderBy: { name: 'asc' } },
        children: true,
      },
    });
    if (!category) { res.status(404).json({ message: 'Kategorie nenalezena.' }); return; }
    res.json(category);
  } catch (err) { next(err); }
});

const categorySchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().optional().nullable(),
  nameUk: z.string().optional().nullable(),
  nameDe: z.string().optional().nullable(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  descriptionUk: z.string().optional().nullable(),
  descriptionDe: z.string().optional().nullable(),
  parentId: z.string().optional(),
});

router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data: body });
    res.status(201).json(category);
  } catch (err) { next(err); }
});

router.patch('/reorder', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = z.array(z.object({ id: z.string(), sortOrder: z.number().int() })).parse(req.body);
    await prisma.$transaction(items.map(({ id, sortOrder }) =>
      prisma.category.update({ where: { id }, data: { sortOrder } })
    ));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({ where: { id: req.params.id }, data: body });
    res.json(category);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
