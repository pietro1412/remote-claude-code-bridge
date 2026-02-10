import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { ptyManager } from './pty-manager.js';
import { createLogger } from '../logger.js';
import type { SessionRecord } from 'rccb-shared/dist/types.js';

const logger = createLogger('session');

export class SessionManager {
  constructor(private db: Database.Database) {}

  createSession(name: string, cwd: string): SessionRecord {
    const id = uuidv4();

    // Spawn PTY
    ptyManager.createSession(id, cwd);
    const pid = ptyManager.getPid(id);

    // Save to DB
    this.db
      .prepare(
        `INSERT INTO sessions (id, name, cwd, pid, status) VALUES (?, ?, ?, ?, 'active')`,
      )
      .run(id, name, cwd, pid);

    const session = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRecord;

    logger.info({ sessionId: id, name, cwd, pid }, 'Session created');
    return session;
  }

  killSession(sessionId: string): void {
    ptyManager.killSession(sessionId);
    this.db
      .prepare("UPDATE sessions SET status = 'terminated', last_activity = datetime('now') WHERE id = ?")
      .run(sessionId);
    logger.info({ sessionId }, 'Session killed');
  }

  updateActivity(sessionId: string): void {
    this.db
      .prepare("UPDATE sessions SET last_activity = datetime('now') WHERE id = ?")
      .run(sessionId);
  }

  updateCost(sessionId: string, cost: number): void {
    this.db
      .prepare("UPDATE sessions SET total_cost = ?, last_activity = datetime('now') WHERE id = ?")
      .run(cost, sessionId);
  }

  getSession(sessionId: string): SessionRecord | undefined {
    return this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as
      | SessionRecord
      | undefined;
  }

  getActiveSessions(): SessionRecord[] {
    return this.db
      .prepare("SELECT * FROM sessions WHERE status != 'terminated' ORDER BY last_activity DESC")
      .all() as SessionRecord[];
  }

  cleanupOrphanSessions(): void {
    const activeSessions = this.db
      .prepare("SELECT * FROM sessions WHERE status = 'active'")
      .all() as SessionRecord[];

    for (const session of activeSessions) {
      if (!ptyManager.getSession(session.id)) {
        this.db
          .prepare("UPDATE sessions SET status = 'terminated' WHERE id = ?")
          .run(session.id);
        logger.warn({ sessionId: session.id }, 'Cleaned up orphan session');
      }
    }
  }
}
