import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  preferredLanguage: z.enum(['cs', 'en', 'uk', 'de']).optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
});

const addressSchema = z.object({
  label: z.string().optional().nullable(),
  street: z.string().min(1),
  city: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().default('CZ'),
  isDefault: z.boolean().optional(),
});

router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, name: true, phone: true, preferredLanguage: true, bankAccountNumber: true, role: true, createdAt: true,
        addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
      },
    });
    res.json(user);
  } catch (err) { next(err); }
});

router.patch('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = profileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: { id: true, email: true, name: true, phone: true, preferredLanguage: true, bankAccountNumber: true, role: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

router.get('/addresses', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const addresses = await prisma.userAddress.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    res.json(addresses);
  } catch (err) { next(err); }
});

router.post('/addresses', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = addressSchema.parse(req.body);
    if (data.isDefault) {
      await prisma.userAddress.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    }
    const address = await prisma.userAddress.create({ data: { ...data, userId: req.user!.id } });
    res.status(201).json(address);
  } catch (err) { next(err); }
});

router.patch('/addresses/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = addressSchema.partial().parse(req.body);
    const existing = await prisma.userAddress.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) { res.status(404).json({ message: 'Adresa nenalezena.' }); return; }
    if (data.isDefault) {
      await prisma.userAddress.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
    }
    const address = await prisma.userAddress.update({ where: { id: req.params.id }, data });
    res.json(address);
  } catch (err) { next(err); }
});

router.delete('/addresses/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.userAddress.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!existing) { res.status(404).json({ message: 'Adresa nenalezena.' }); return; }
    await prisma.userAddress.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
