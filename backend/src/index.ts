import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import passport from 'passport';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import militaryUnitRoutes from './routes/military-units';
import newsletterRoutes from './routes/newsletter';
import uploadRoutes from './routes/upload';
import activityRoutes from './routes/activities';
import unitUpdatesRoutes from './routes/unit-updates';
import profileRoutes from './routes/profile';
import adminUsersRoutes from './routes/admin-users';
import { prisma } from './lib/prisma';
import { startPaymentReconciler } from './jobs/paymentReconciler';

import './lib/passport';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    if (!requestOrigin) { callback(null, true); return; }
    if (allowedOrigins.includes(requestOrigin)) { callback(null, true); return; }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(passport.initialize());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/sitemap.xml', async (_req, res) => {
  try {
    const [products, units] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.militaryUnit.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
    const base = (process.env.FRONTEND_URL || 'https://darek.fondceskestopy.eu').split(',')[0].trim().replace(/\/$/, '');
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const today = fmt(new Date());
    const urls = [
      `  <url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
      `  <url><loc>${base}/donate</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
      ...units.map(u => `  <url><loc>${base}/jednotky/${u.slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority><lastmod>${fmt(u.updatedAt)}</lastmod></url>`),
      ...products.map(p => `  <url><loc>${base}/products/${p.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${fmt(p.updatedAt)}</lastmod></url>`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch {
    res.status(500).send('Error generating sitemap');
  }
});
app.get('/api/config', (_req, res) => res.json({
  accountNumber: process.env.SHOP_BANK_ACCOUNT || '',
  iban: process.env.SHOP_IBAN || '',
  packetaApiKey: process.env.PACKETA_API_KEY || '',
}));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/military-units', militaryUnitRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/military-units/:unitId/updates', unitUpdatesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin/users', adminUsersRoutes);

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  startPaymentReconciler(prisma);
});

export default app;
