import { config as dotenvConfig } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenvConfig();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');

export const config = {
  port: parseInt(process.env.PORT || '3443', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: '7d',
  },

  tailscale: {
    hostname: process.env.TAILSCALE_HOSTNAME || '',
    certDir: path.resolve(ROOT_DIR, process.env.TAILSCALE_CERT_DIR || './certs'),
  },

  db: {
    path: path.resolve(ROOT_DIR, process.env.DB_PATH || './data/rccb.db'),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  upload: {
    maxSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10),
    dir: path.resolve(ROOT_DIR, process.env.UPLOAD_DIR || './uploads'),
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  rootDir: ROOT_DIR,
} as const;
