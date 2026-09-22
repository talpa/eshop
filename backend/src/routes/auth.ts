import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import passport from 'passport';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { isGoogleOAuthEnabled, isFacebookOAuthEnabled, frontendUrl } from '../lib/passport';

const router = Router();

const generateToken = (user: { id: string; email: string; role: string }): string =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'jwt_secret',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );

const redirectOAuthError = (res: Response, detail = 'oauth') =>
  res.redirect(`${frontendUrl()}/login?error=${detail}`);

const requireOAuth = (enabled: boolean) => (_req: Request, res: Response, next: NextFunction): void => {
  if (enabled) { next(); return; }
  redirectOAuthError(res, 'oauth_config');
};

// POST /api/auth/register
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) { res.status(409).json({ message: 'Email je již registrován.' }); return; }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name, passwordHash },
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) { next(err); }
});

// POST /api/auth/login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) { res.status(401).json({ message: 'Nesprávný email nebo heslo.' }); return; }

    if (!user.passwordHash) {
      const provider = user.provider ?? 'OAuth';
      res.status(401).json({ message: `Tento účet je přihlášen přes ${provider}. Použijte tlačítko přihlášení přes ${provider}.` });
      return;
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) { res.status(401).json({ message: 'Nesprávný email nebo heslo.' }); return; }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  const u = req.user!;
  res.json({ id: u.id, email: u.email, name: u.name, role: u.role });
});

// Google OAuth
router.get('/google', requireOAuth(isGoogleOAuthEnabled),
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback', requireOAuth(isGoogleOAuthEnabled),
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { session: false }, (err: Error | null, user: { id: string; email: string; role: string } | false) => {
      if (err || !user) { redirectOAuthError(res); return; }
      res.redirect(`${frontendUrl()}/oauth-callback?token=${generateToken(user)}`);
    })(req, res, next);
  }
);

// Facebook OAuth
router.get('/facebook', requireOAuth(isFacebookOAuthEnabled),
  passport.authenticate('facebook', { scope: ['public_profile', 'email'], session: false })
);

router.get('/facebook/callback', requireOAuth(isFacebookOAuthEnabled),
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('facebook', { session: false }, (err: Error | null, user: { id: string; email: string; role: string } | false) => {
      if (err || !user) { redirectOAuthError(res); return; }
      res.redirect(`${frontendUrl()}/oauth-callback?token=${generateToken(user)}`);
    })(req, res, next);
  }
);

// Facebook data deletion (required for FB app review)
router.post('/facebook/data-deletion', (_req: Request, res: Response) => {
  res.json({ url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/facebook/data-deletion-status`, confirmation_code: 'ok' });
});
router.get('/facebook/data-deletion-status', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// POST /api/auth/admin/create-user — admin creates a user
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'CUSTOMER']).default('CUSTOMER'),
});

router.post('/admin/create-user', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = createUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) { res.status(409).json({ message: 'Email je již registrován.' }); return; }

    const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name, passwordHash, role: body.role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
});

export default router;
