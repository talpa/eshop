import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { sendEmail } from '../lib/email';
import { buildUnitUpdateEmail } from '../lib/unitUpdateEmail';

const router = Router({ mergeParams: true });

const updateSchema = z.object({
  title: z.string().min(1),
  titleEn: z.string().optional().nullable(),
  titleUk: z.string().optional().nullable(),
  titleDe: z.string().optional().nullable(),
  content: z.string().min(1),
  contentEn: z.string().optional().nullable(),
  contentUk: z.string().optional().nullable(),
  contentDe: z.string().optional().nullable(),
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
    const body = updateSchema.parse(req.body);
    const { unitId } = req.params;

    const unit = await prisma.militaryUnit.findUnique({ where: { id: unitId } });
    if (!unit) { res.status(404).json({ message: 'Jednotka nenalezena.' }); return; }

    const donorRows = await prisma.order.findMany({
      where: {
        militaryUnitId: unitId,
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        isAnonymous: false,
      },
      select: { customerEmail: true },
      distinct: ['customerEmail'],
    });

    const emails = donorRows.map(o => o.customerEmail);

    const update = await prisma.unitUpdate.create({ data: { militaryUnitId: unitId, ...body, recipientCount: emails.length } });

    if (emails.length > 0) {
      const shopUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://eshop.fondceskestopy.eu';

      // Fetch preferred language for each recipient
      const users = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { email: true, preferredLanguage: true },
      });
      const langByEmail = new Map(users.map(u => [u.email, u.preferredLanguage ?? 'cs']));

      setImmediate(async () => {
        for (const to of emails) {
          const lang = langByEmail.get(to) ?? 'cs';
          const { subject, html, text } = buildUnitUpdateEmail({
            unitName: unit.name,
            ...body,
            shopUrl,
            lang,
          });
          try { await sendEmail({ to, subject, html, text }); }
          catch (err) { console.error('[unit-update] email failed to', to, err); }
        }
      });
    }

    res.status(201).json(update);
  } catch (err) { next(err); }
});

router.patch('/:updateId', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = updateSchema.partial().parse(req.body);
    const update = await prisma.unitUpdate.update({
      where: { id: req.params.updateId },
      data: body,
    });
    res.json(update);
  } catch (err) { next(err); }
});

router.delete('/:updateId', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.unitUpdate.delete({ where: { id: req.params.updateId } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
