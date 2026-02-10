import type { Express, Request, Response, NextFunction } from 'express';
import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, generateToken, generateAccessToken } from './jwt.js';
import { loginLimiter } from '../security/rate-limiter.js';
import { sanitizeDeviceName } from '../security/sanitize.js';
import { createLogger } from '../logger.js';

const logger = createLogger('auth');

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      deviceName?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.userId = payload.sub;
  req.deviceName = payload.device;
  next();
}

export function setupAuthRoutes(app: Express, db: Database.Database): void {
  // POST /api/auth/login — Exchange access token for JWT
  app.post('/api/auth/login', loginLimiter, (req: Request, res: Response) => {
    const { token, device_name } = req.body as { token?: string; device_name?: string };

    if (!token || !device_name) {
      res.status(400).json({ error: 'token and device_name are required' });
      return;
    }

    const safeDeviceName = sanitizeDeviceName(device_name);
    if (!safeDeviceName) {
      res.status(400).json({ error: 'Invalid device name' });
      return;
    }

    // Find a valid (non-revoked) auth token
    const rows = db
      .prepare('SELECT * FROM auth_tokens WHERE is_revoked = 0')
      .all() as Array<{ id: string; token_hash: string }>;

    const match = rows.find((row) => bcrypt.compareSync(token, row.token_hash));

    if (!match) {
      logger.warn({ device_name: safeDeviceName }, 'Login failed: invalid access token');
      res.status(401).json({ error: 'Invalid access token' });
      return;
    }

    // Update last_used
    db.prepare("UPDATE auth_tokens SET last_used = datetime('now'), device_name = ? WHERE id = ?")
      .run(safeDeviceName, match.id);

    // Log activity
    db.prepare("INSERT INTO activity_logs (session_id, event_type, details) VALUES (NULL, 'login', ?)")
      .run(JSON.stringify({ device: safeDeviceName }));

    const jwt = generateToken(match.id, safeDeviceName);

    logger.info({ device_name: safeDeviceName }, 'Login successful');
    res.json({ jwt, expires_in: '7d' });
  });

  // POST /api/auth/setup — First-time setup: create initial access token
  app.post('/api/auth/setup', loginLimiter, (_req: Request, res: Response) => {
    const existing = db.prepare('SELECT COUNT(*) as count FROM auth_tokens').get() as { count: number };

    if (existing.count > 0) {
      res.status(403).json({ error: 'Setup already completed. Use /api/auth/login.' });
      return;
    }

    const accessToken = generateAccessToken();
    const hash = bcrypt.hashSync(accessToken, 12);
    const id = uuidv4();

    db.prepare('INSERT INTO auth_tokens (id, token_hash, device_name) VALUES (?, ?, ?)')
      .run(id, hash, 'setup');

    db.prepare("INSERT INTO activity_logs (session_id, event_type, details) VALUES (NULL, 'setup', 'Initial token created')")
      .run();

    logger.info('Initial access token created');
    res.json({
      access_token: accessToken,
      message: 'Save this token securely. You will need it to log in from your devices.',
    });
  });

  // POST /api/auth/revoke — Revoke an access token
  app.post('/api/auth/revoke', authMiddleware, (req: Request, res: Response) => {
    const { token_id } = req.body as { token_id?: string };

    if (!token_id) {
      res.status(400).json({ error: 'token_id is required' });
      return;
    }

    const result = db
      .prepare("UPDATE auth_tokens SET is_revoked = 1 WHERE id = ?")
      .run(token_id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    logger.info({ tokenId: token_id }, 'Token revoked');
    res.json({ message: 'Token revoked' });
  });

  // GET /api/auth/devices — List authorized devices
  app.get('/api/auth/devices', authMiddleware, (_req: Request, res: Response) => {
    const devices = db
      .prepare('SELECT id, device_name, created_at, last_used, is_revoked FROM auth_tokens ORDER BY last_used DESC')
      .all();
    res.json(devices);
  });
}
