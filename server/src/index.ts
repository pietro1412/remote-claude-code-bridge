import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiLimiter } from './security/rate-limiter.js';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { initDatabase } from './db/sqlite.js';
import { detectTailscaleIp } from './security/tailscale.js';
import { setupAuthRoutes } from './auth/middleware.js';
import { setupApiRoutes } from './api/routes.js';
import { setupSocketHandlers } from './socket/handlers.js';
import { ensureJwtSecret } from './auth/jwt.js';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'rccb-shared/dist/types.js';

const logger = createLogger('server');

async function main() {
  // Ensure data directories exist
  fs.mkdirSync(path.dirname(config.db.path), { recursive: true });
  fs.mkdirSync(config.upload.dir, { recursive: true });

  // Initialize JWT secret if not set
  await ensureJwtSecret();

  // Initialize database
  const db = initDatabase();
  logger.info('Database initialized');

  // Detect Tailscale IP
  const bindHost = detectTailscaleIp();
  logger.info({ host: bindHost }, 'Bind host detected');

  // Express setup
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: config.isDev ? false : undefined,
  }));
  app.use(cors({
    origin: config.isDev ? '*' : undefined,
    credentials: true,
  }));
  app.use(express.json());

  // Global rate limiting
  app.use('/api', apiLimiter);

  // Routes
  setupAuthRoutes(app, db);
  setupApiRoutes(app, db);

  // HTTP Server
  const httpServer = createServer(app);

  // Socket.io
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: config.isDev ? '*' : undefined,
      credentials: true,
    },
    maxHttpBufferSize: config.upload.maxSizeMb * 1024 * 1024,
  });

  setupSocketHandlers(io, db);

  // Start server
  httpServer.listen(config.port, bindHost, () => {
    logger.info(`RCCB Server running on https://${bindHost}:${config.port}`);
    if (config.isDev) {
      logger.info(`Dev mode: also accessible on http://localhost:${config.port}`);
    }
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down...');
    io.close();
    httpServer.close();
    db.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
