import type { Express, Request, Response } from 'express';
import type Database from 'better-sqlite3';
import os from 'node:os';
import { authMiddleware } from '../auth/middleware.js';
import { setupUploadRoute } from './upload.js';
import { ptyManager } from '../bridge/pty-manager.js';
import type { SessionRecord } from 'rccb-shared/dist/types.js';

const startTime = Date.now();

export function setupApiRoutes(app: Express, db: Database.Database): void {
  // Health check (public)
  app.get('/api/health', (_req: Request, res: Response) => {
    const activeSessions = db
      .prepare("SELECT COUNT(*) as count FROM sessions WHERE status = 'active'")
      .get() as { count: number };

    const totalSessions = db
      .prepare('SELECT COUNT(*) as count FROM sessions')
      .get() as { count: number };

    const mem = process.memoryUsage();

    res.json({
      status: 'ok',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      sessions: {
        active: activeSessions.count,
        total: totalSessions.count,
        pty_alive: ptyManager.getAllSessions().size,
      },
      memory: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      system: {
        platform: process.platform,
        node_version: process.version,
        cpus: os.cpus().length,
        load_avg: os.loadavg(),
        free_mem_mb: Math.round(os.freemem() / 1024 / 1024),
      },
    });
  });

  // Protected routes
  app.get('/api/sessions', authMiddleware, (_req: Request, res: Response) => {
    const sessions = db
      .prepare("SELECT * FROM sessions WHERE status != 'terminated' ORDER BY last_activity DESC")
      .all() as SessionRecord[];
    res.json(sessions);
  });

  app.get('/api/sessions/:id', authMiddleware, (req: Request, res: Response) => {
    const session = db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .get(req.params.id) as SessionRecord | undefined;

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  });

  // Activity logs
  app.get('/api/logs', authMiddleware, (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const logs = db
      .prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?')
      .all(limit);
    res.json(logs);
  });

  // Upload route
  setupUploadRoute(app);
}
