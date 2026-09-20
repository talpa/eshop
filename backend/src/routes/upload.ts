import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Povoleny jsou pouze obrázky (jpg, png, webp, gif).'));
    }
  },
});

router.post(
  '/image',
  authenticate,
  requireAdmin,
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.file) { res.status(400).json({ message: 'Žádný soubor.' }); return; }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (err) { next(err); }
  }
);

export default router;
