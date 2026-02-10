import type { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { authMiddleware } from '../auth/middleware.js';
import { isValidImageMime, sanitizeFilename } from '../security/sanitize.js';
import { uploadLimiter } from '../security/rate-limiter.js';
import { createLogger } from '../logger.js';

const logger = createLogger('upload');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = sanitizeFilename(path.basename(file.originalname, ext));
    cb(null, `${uuidv4()}-${safeName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSizeMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!isValidImageMime(file.mimetype)) {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

export function setupUploadRoute(app: Express): void {
  app.post(
    '/api/upload',
    authMiddleware,
    uploadLimiter,
    upload.single('photo'),
    (req: Request, res: Response) => {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      logger.info({ filename: req.file.filename, size: req.file.size }, 'File uploaded');

      res.json({
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
      });
    },
  );
}
