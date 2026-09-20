import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { fetchFioTransactions, FioRateLimitedError } from '../lib/fio';
import { optionalAuth, authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendEmail } from '../lib/email';
import { buildDonationConfirmationEmail } from '../lib/donationEmail';

const router = Router();

const normaliseVs = (vs: string | undefined): string =>
  vs !== undefined && vs !== '' ? parseInt(vs, 10).toString() : '';

router.get('/:orderId', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.orderId,
        ...(isAdmin || !req.user ? {} : { userId: req.user.id }),
      },
      include: { payment: true },
    });
    if (!order?.payment) { res.status(404).json({ message: 'Platba nenalezena.' }); return; }
    res.json(order.payment);
  } catch (err) { next(err); }
});

router.post('/:orderId/check', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.orderId,
        ...(isAdmin || !req.user ? {} : { userId: req.user.id }),
      },
      include: { payment: true, items: true, militaryUnit: true },
    });

    if (!order?.payment) { res.status(404).json({ message: 'Objednávka nenalezena.' }); return; }
    if (order.payment.status === 'PAID') {
      res.json({ paid: true, payment: order.payment });
      return;
    }

    const toDate = new Date();
    const fromDate = new Date(order.createdAt);
    fromDate.setDate(fromDate.getDate() - 1);

    let transactions;
    try {
      transactions = await fetchFioTransactions(fromDate, toDate, { force: true });
    } catch (err) {
      if (err instanceof FioRateLimitedError) {
        res.status(429).json({ message: `Zkuste to za ${Math.ceil(err.retryAfterMs / 1000)} sekund.` });
        return;
      }
      throw err;
    }

    const minAmount = Number(order.donationAmount);
    const match = transactions.find(
      t => normaliseVs(t.variableSymbol) === normaliseVs(order.variableSymbol) && t.amount >= minAmount - 0.01
    );

    if (match) {
      const updated = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { orderId: order.id },
          data: {
            status: 'PAID',
            fioTransactionId: match.transactionId,
            paidAt: match.date ? new Date(match.date) : new Date(),
            amountCzk: match.amount,
          },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID', donationAmount: match.amount },
        });
        return payment;
      });

      const emailData = buildDonationConfirmationEmail({
        ...order,
        donationAmount: match.amount as unknown as typeof order.donationAmount,
      });
      try {
        await sendEmail({ to: order.customerEmail, ...emailData });
        await prisma.order.update({ where: { id: order.id }, data: { confirmationSentAt: new Date() } });
      } catch (emailErr) {
        console.error('[payments/check] Failed to send confirmation email:', emailErr);
      }

      res.json({ paid: true, payment: updated });
    } else {
      res.json({ paid: false, payment: order.payment });
    }
  } catch (err) { next(err); }
});

router.get('/admin/report', authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'PAID' },
      include: {
        militaryUnit: { select: { id: true, name: true } },
        payment: { select: { amountCzk: true, paidAt: true, fioTransactionId: true } },
        items: { select: { productName: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

export default router;
