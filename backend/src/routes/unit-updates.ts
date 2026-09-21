import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { sendEmail } from '../lib/email';
import { buildUnitUpdateEmail } from '../lib/unitUpdateEmail';

const router = Router({ mergeParams: true });

const updateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = await prisma.unitUpdate.findMany({
      where: { militaryUnitId: req.params.unitId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(updates);
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content } = updateSchema.parse(req.body);
    const { unitId } = req.params;

    const unit = await prisma.militaryUnit.findUnique({ where: { id: unitId } });
    if (!unit) { res.status(404).json({ message: 'Jednotka nenalezena.' }); return; }

    const donorEmails = await prisma.order.findMany({
      where: {
        militaryUnitId: unitId,
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        isAnonymous: false,
      },
      select: { customerEmail: true },
      distinct: ['customerEmail'],
    });

    const emails = donorEmails.map(o => o.customerEmail);

    const update = await prisma.unitUpdate.create({
      data: { militaryUnitId: unitId, title, content, recipientCount: emails.length },
    });

    if (emails.length > 0) {
      const shopUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://eshop.fondceskestopy.eu';
      const { subject, html, text } = buildUnitUpdateEmail({ unitName: unit.name, title, content, shopUrl });

      setImmediate(async () => {
        for (const to of emails) {
          try { await sendEmail({ to, subject, html, text }); }
          catch (err) { console.error('[unit-update] email failed to', to, err); }
        }
      });
    }

    res.status(201).json(update);
  } catch (err) { next(err); }
});

export default router;
