import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { fetchFioTransactions, FioRateLimitedError } from '../lib/fio';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:orderId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.orderId,
        ...(isAdmin ? {} : { userId: req.user!.id }),
      },
      include: { payment: true },
    });
    if (!order?.payment) { res.status(404).json({ message: 'Platba nenalezena.' }); return; }
    res.json(order.payment);
  } catch (err) { next(err); }
});

router.post('/:orderId/check', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.orderId,
        ...(isAdmin ? {} : { userId: req.user!.id }),
      },
      include: { payment: true },
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

    const match = transactions.find(
      t => t.variableSymbol === order.variableSymbol && t.amount >= Number(order.payment!.amountCzk)
    );

    if (match) {
      const updated = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
          where: { orderId: order.id },
          data: { status: 'PAID', fioTransactionId: match.transactionId, paidAt: new Date() },
        });
        await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
        return payment;
      });
      res.json({ paid: true, payment: updated });
    } else {
      res.json({ paid: false, payment: order.payment });
    }
  } catch (err) { next(err); }
});

export default router;
