import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { optionalAuth, authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateVariableSymbol, generateQrPayload } from '../lib/fio';
import { sendEmail } from '../lib/email';
import { buildDonationConfirmationEmail } from '../lib/donationEmail';
import { buildOrderCreatedEmail } from '../lib/orderCreatedEmail';
import { generateDonationPdf } from '../lib/donationPdf';

const router = Router();

const orderRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.ORDER_RATE_LIMIT || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Příliš mnoho pokusů. Zkuste to znovu za hodinu.' },
  skip: (req) => !!(req as AuthRequest).user,
});

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  street: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  zip: z.string().min(3).optional(),
  country: z.string().default('CZ'),
  deliveryType: z.enum(['HOME', 'PACKETA']).default('HOME'),
  packetaPointId: z.string().optional(),
  packetaPointName: z.string().optional(),
  note: z.string().optional(),
  militaryUnitId: z.string().optional(),
  activityId: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  donationAmount: z.number().positive(),
  subscribeNewsletter: z.boolean().optional(),
  _hp: z.string().default(''),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).optional().default([]),
});

router.post('/', optionalAuth, orderRateLimit, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createOrderSchema.parse(req.body);

    if (body._hp) {
      res.status(201).json({ id: 'ok' });
      return;
    }

    const hasItems = body.items.length > 0;

    const products = hasItems
      ? await prisma.product.findMany({
          where: { id: { in: body.items.map(i => i.productId) }, isActive: true },
        })
      : [];

    if (hasItems && products.length !== body.items.length) {
      res.status(400).json({ message: 'Jeden nebo více produktů není dostupných.' });
      return;
    }

    const minTotal = products.length > 0
      ? body.items.reduce((sum, item) => {
          const product = products.find(p => p.id === item.productId)!;
          return sum + Number(product.priceCzk) * item.quantity;
        }, 0)
      : 0;

    if (body.donationAmount < minTotal - 0.01) {
      res.status(400).json({ message: `Minimální dar je ${minTotal.toFixed(2)} Kč.` });
      return;
    }

    let unit: { id: string; name: string; activityId: string | null; activity: { code: string; name: string } | null } | null = null;
    if (body.militaryUnitId) {
      unit = await prisma.militaryUnit.findFirst({
        where: { id: body.militaryUnitId, isActive: true },
        include: { activity: { select: { code: true, name: true } } },
      });
      if (!unit) {
        res.status(400).json({ message: 'Vybraná vojenská jednotka neexistuje.' });
        return;
      }
    }

    let activityCode: string | null = null;
    let activityName: string | null = null;

    if (body.activityId) {
      const activity = await prisma.activity.findFirst({ where: { id: body.activityId, isActive: true } });
      if (activity) { activityCode = activity.code; activityName = activity.name; }
    } else if (unit?.activity) {
      activityCode = unit.activity.code;
      activityName = unit.activity.name;
    }

    const variableSymbol = generateVariableSymbol();
    const paymentNote = activityCode
      ? `${activityCode} ${activityName || ''}`.trim().slice(0, 60)
      : `Dar ${variableSymbol}`;

    const iban = process.env.SHOP_IBAN || '';
    const qrPayload = iban
      ? generateQrPayload(iban, body.donationAmount, variableSymbol, paymentNote)
      : '';

    const order = await prisma.$transaction(async (tx) => {
      const shippingAddress = body.deliveryType === 'PACKETA'
        ? `Zásilkovna: ${body.packetaPointName || body.packetaPointId || '—'}`
        : [body.street, body.city, body.zip, body.country].filter(Boolean).join(', ');

      const newOrder = await tx.order.create({
        data: {
          userId: req.user?.id || null,
          militaryUnitId: body.militaryUnitId || null,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          shippingAddress,
          street: body.street,
          city: body.city,
          zip: body.zip,
          country: body.country,
          deliveryType: body.deliveryType,
          packetaPointId: body.packetaPointId,
          packetaPointName: body.packetaPointName,
          note: body.note,
          isAnonymous: body.isAnonymous || false,
          activityCode,
          activityName,
          paymentNote,
          totalCzk: minTotal,
          donationAmount: body.donationAmount,
          variableSymbol,
          items: {
            create: body.items.map(item => {
              const product = products.find(p => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPriceCzk: product.priceCzk,
                productName: product.name,
              };
            }),
          },
          payment: {
            create: {
              amountCzk: body.donationAmount,
              qrPayload,
            },
          },
        },
        include: { items: true, payment: true, militaryUnit: true },
      });

      if (hasItems) {
        for (const item of body.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return newOrder;
    });

    if (body.subscribeNewsletter) {
      await prisma.newsletterSubscriber.upsert({
        where: { email: body.customerEmail },
        update: { name: body.customerName, isActive: true, unsubscribedAt: null },
        create: { email: body.customerEmail, name: body.customerName },
      }).catch(() => {});
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
    const email = buildOrderCreatedEmail({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      variableSymbol: order.variableSymbol,
      donationAmount: Number(order.donationAmount),
      totalCzk: Number(order.totalCzk),
      unitName: order.militaryUnit?.name,
      accountNumber: process.env.SHOP_BANK_ACCOUNT || '',
      iban: process.env.SHOP_IBAN || '',
      orderUrl: `${frontendUrl}/orders/${order.id}`,
      items: order.items.map(i => ({ productName: i.productName, quantity: i.quantity })),
    });
    sendEmail(email).catch(err => console.error('[email] Order created email failed:', err));

    res.status(201).json(order);
  } catch (err) { next(err); }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';
    const orders = await prisma.order.findMany({
      where: isAdmin ? {} : { userId: req.user!.id },
      include: {
        items: true,
        payment: { select: { status: true, paidAt: true } },
        militaryUnit: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

router.get('/my', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.json([]); return; }
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: true,
        payment: { select: { status: true, paidAt: true } },
        militaryUnit: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(isAdmin || !req.user ? {} : { userId: req.user.id }),
      },
      include: {
        items: { include: { product: { select: { id: true, slug: true, images: true } } } },
        payment: true,
        militaryUnit: true,
      },
    });
    if (!order) { res.status(404).json({ message: 'Objednávka nenalezena.' }); return; }
    if (!isAdmin && req.user && order.userId && order.userId !== req.user.id) {
      res.status(403).json({ message: 'Přístup odepřen.' }); return;
    }
    res.json(order);
  } catch (err) { next(err); }
});

router.get('/:id/confirmation', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(isAdmin || !req.user ? {} : { userId: req.user.id }),
      },
      include: { items: true, militaryUnit: true },
    });
    if (!order) { res.status(404).json({ message: 'Objednávka nenalezena.' }); return; }
    if (order.status !== 'PAID') { res.status(400).json({ message: 'Objednávka zatím není zaplacena.' }); return; }

    const email = buildDonationConfirmationEmail(order as Parameters<typeof buildDonationConfirmationEmail>[0]);
    res.json(email);
  } catch (err) { next(err); }
});

router.get('/:id/confirmation/pdf', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(isAdmin || !req.user ? {} : { userId: req.user.id }),
      },
      include: { items: true, militaryUnit: true },
    });
    if (!order) { res.status(404).json({ message: 'Objednávka nenalezena.' }); return; }
    if (order.status !== 'PAID') { res.status(400).json({ message: 'Dar zatím nebyl přijat.' }); return; }
    if (!isAdmin && req.user && order.userId && order.userId !== req.user.id) {
      res.status(403).json({ message: 'Přístup odepřen.' }); return;
    }

    generateDonationPdf(order as Parameters<typeof generateDonationPdf>[0], res);
  } catch (err) { next(err); }
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(order);
  } catch (err) { next(err); }
});

router.patch('/:id/funds-used', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fundsUsed } = z.object({ fundsUsed: z.boolean() }).parse(req.body);
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { fundsUsed },
    });
    res.json(order);
  } catch (err) { next(err); }
});

router.post('/:id/resend-confirmation', authenticate, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user!.role === 'ADMIN';
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(isAdmin ? {} : { userId: req.user!.id }),
      },
      include: { items: true, militaryUnit: true },
    });
    if (!order) { res.status(404).json({ message: 'Objednávka nenalezena.' }); return; }
    if (order.status !== 'PAID') { res.status(400).json({ message: 'Objednávka zatím není zaplacena.' }); return; }

    const emailData = buildDonationConfirmationEmail(order as Parameters<typeof buildDonationConfirmationEmail>[0]);
    await sendEmail({ to: order.customerEmail, ...emailData });
    await prisma.order.update({ where: { id: order.id }, data: { confirmationSentAt: new Date() } });
    res.json({ message: 'Potvrzení bylo odesláno.' });
  } catch (err) { next(err); }
});

export default router;
