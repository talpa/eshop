import { Request, Response, NextFunction } from 'express';
import { FioRateLimitedError } from '../lib/fio';

export const errorHandler = (
  err: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof FioRateLimitedError) {
    res.status(429).json({
      message: `Platební brána je dočasně nedostupná. Zkuste to za ${Math.ceil(err.retryAfterMs / 1000)} sekund.`,
    });
    return;
  }

  console.error('[Error]', err.message, err.stack);

  if (err.code === 'P2002') {
    res.status(409).json({ message: 'Záznam s těmito údaji již existuje.' });
    return;
  }
  if (err.code === 'P2025') {
    res.status(404).json({ message: 'Záznam nebyl nalezen.' });
    return;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: statusCode === 500 ? 'Interní chyba serveru.' : err.message,
  });
};

export class AppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = 'AppError';
  }
}
