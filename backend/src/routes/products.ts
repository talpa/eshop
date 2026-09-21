import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categorySlug, search, page = '1', limit = '20', unitSlug } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
      ...(unitSlug && { militaryUnits: { some: { slug: unitSlug } } }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, nameEn: true, nameUk: true, slug: true } },
          militaryUnits: { where: { isActive: true }, select: { id: true, name: true, nameEn: true, nameUk: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: { select: { id: true, name: true, nameEn: true, nameUk: true, slug: true } },
        militaryUnits: { where: { isActive: true }, select: { id: true, name: true, nameEn: true, nameUk: true, slug: true, description: true, descriptionEn: true, descriptionUk: true } },
      },
    });
    if (!product || !product.isActive) { res.status(404).json({ message: 'Produkt nenalezen.' }); return; }
    res.json(product);
  } catch (err) { next(err); }
});

const productSchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().nullable().optional(),
  nameUk: z.string().nullable().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  descriptionEn: z.string().nullable().optional(),
  descriptionUk: z.string().nullable().optional(),
  priceCzk: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  categoryId: z.string().optional(),
  militaryUnitIds: z.array(z.string()).optional(),
});

router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { militaryUnitIds, ...body } = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        ...body,
        ...(militaryUnitIds?.length && {
          militaryUnits: { connect: militaryUnitIds.map(id => ({ id })) },
        }),
      },
      include: { militaryUnits: { select: { id: true, name: true } } },
    });
    res.status(201).json(product);
  } catch (err) { next(err); }
});

router.patch('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { militaryUnitIds, ...body } = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...body,
        ...(militaryUnitIds !== undefined && {
          militaryUnits: { set: militaryUnitIds.map(id => ({ id })) },
        }),
      },
      include: { militaryUnits: { select: { id: true, name: true } } },
    });
    res.json(product);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
