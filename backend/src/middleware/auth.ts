import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: User | false) => {
    if (err) { next(err); return; }
    if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }
    req.user = user;
    next();
  })(req, res, next);
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (_err: Error | null, user: User | false) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};
