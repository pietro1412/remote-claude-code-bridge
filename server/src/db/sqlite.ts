import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { createLogger } from '../logger.js';
import { runMigrations } from './schema.js';

const logger = createLogger('database');

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (db) return db;

  // Ensure directory exists
  fs.mkdirSync(path.dirname(config.db.path), { recursive: true });

  db = new Database(config.db.path);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  logger.info({ path: config.db.path }, 'Database ready');

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}
