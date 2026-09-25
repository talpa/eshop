import { PrismaClient } from '@prisma/client';
import { fetchFioTransactions, FioRateLimitedError } from '../lib/fio';
import { sendEmail } from '../lib/email';
import { buildDonationConfirmationEmail } from '../lib/donationEmail';

const normaliseVs = (vs: string | undefined): string =>
  vs !== undefined && vs !== '' ? parseInt(vs, 10).toString() : '';

const extractOrderNumberFromMessage = (msg: string | undefined): string => {
  if (!msg) return '';
  const m = msg.match(/^(\d+)\s*-/);
  return m ? parseInt(m[1], 10).toString() : '';
};

export const startPaymentReconciler = (prisma: PrismaClient): void => {
  const enabled = (process.env.PAYMENT_RECONCILER_ENABLED || 'true').toLowerCase() !== 'false';
  const intervalMs = Number(process.env.PAYMENT_RECONCILER_INTERVAL_MS || 120_000);

  if (!enabled) return;

  let inProgress = false;

  const run = async () => {
    if (inProgress) return;
    inProgress = true;

    try {
      const pendingOrders = await prisma.order.findMany({
        where: { status: 'PENDING' },
        include: { payment: true, items: true, militaryUnit: true },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });

      if (pendingOrders.length === 0) return;

      const oldest = new Date(Math.min(...pendingOrders.map(o => o.createdAt.getTime())));
      oldest.setDate(oldest.getDate() - 2);
      const toDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const transactions = await fetchFioTransactions(oldest, toDate);
      if (transactions.length === 0) return;

      for (const order of pendingOrders) {
        if (!order.payment) continue;

        const orderVs = normaliseVs(order.variableSymbol);
        const minAmount = Number(order.donationAmount);

        const match = transactions.find(t => {
          if (t.amount < minAmount - 0.01) return false;
          // Primary: match by order number in payment message (new format: "1456 - product names")
          const msgNumber = extractOrderNumberFromMessage(t.message);
          if (msgNumber && msgNumber === orderVs) return true;
          // Fallback: match by variable symbol (legacy orders)
          return normaliseVs(t.variableSymbol) === orderVs;
        });

        if (!match) continue;

        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { orderId: order.id },
            data: {
              status: 'PAID',
              fioTransactionId: match.transactionId || undefined,
              paidAt: match.date ? new Date(match.date) : new Date(),
              amountCzk: match.amount,
            },
          });
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'PAID', donationAmount: match.amount },
          });
        });

        const emailData = buildDonationConfirmationEmail({ ...order, donationAmount: match.amount as unknown as typeof order.donationAmount });
        try {
          await sendEmail({ to: order.customerEmail, ...emailData });
          await prisma.order.update({
            where: { id: order.id },
            data: { confirmationSentAt: new Date() },
          });
        } catch (emailErr) {
          console.error('[reconciler] Failed to send confirmation email for order', order.id, emailErr);
        }

        console.log(`[reconciler] Order ${order.variableSymbol} marked as PAID (amount: ${match.amount} CZK)`);
      }
    } catch (err) {
      if (err instanceof FioRateLimitedError) {
        console.warn('[reconciler] Fio rate limit — skipping cycle, retry next run.');
      } else {
        console.error('[reconciler] Error:', err);
      }
    } finally {
      inProgress = false;
    }
  };

  void run();
  setInterval(() => { void run(); }, intervalMs);
};
