import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

router.post('/subscribe', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, name } = subscribeSchema.parse(req.body);
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { name: name || undefined, isActive: true, unsubscribedAt: null },
      create: { email, name },
    });
    res.json({ message: 'Děkujeme za přihlášení k odběru novinek.' });
  } catch (err) { next(err); }
});

router.post('/unsubscribe', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = subscribeSchema.pick({ email: true }).parse(req.body);
    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
    res.json({ message: 'Odhlášení z odběru bylo úspěšné.' });
  } catch (err) { next(err); }
});

router.get('/', authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      orderBy: { subscribedAt: 'desc' },
    });
    res.json(subscribers);
  } catch (err) { next(err); }
});

export default router;
