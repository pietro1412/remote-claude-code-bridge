import type { Server } from 'socket.io';
import type Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken } from '../auth/jwt.js';
import { ptyManager } from '../bridge/pty-manager.js';
import { SessionManager } from '../bridge/session.js';
import { parseOutputStatus, parseCost } from '../bridge/output-parser.js';
import {
  sanitizeInput,
  sanitizeSessionName,
  sanitizeCwd,
  sanitizeFilename,
  isValidBase64,
} from '../security/sanitize.js';
import { SocketRateLimiter } from '../security/rate-limiter.js';
import { config } from '../config.js';
import { createLogger } from '../logger.js';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from 'rccb-shared/dist/types.js';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const logger = createLogger('socket');

export function setupSocketHandlers(io: IO, db: Database.Database): void {
  const sessionManager = new SessionManager(db);
  const socketLimiter = new SocketRateLimiter(60, 60_000); // 60 msg/min

  // Periodic cleanup of rate limiter
  const cleanupInterval = setInterval(() => socketLimiter.cleanup(), 60_000);

  // Cleanup orphan sessions on start
  sessionManager.cleanupOrphanSessions();

  // Auth middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      next(new Error('Invalid or expired token'));
      return;
    }

    socket.data.userId = payload.sub;
    socket.data.deviceName = payload.device;
    next();
  });

  // PTY output forwarding
  ptyManager.on('output', (sessionId: string, data: string) => {
    io.emit('cc:output', {
      sessionId,
      content: data,
      timestamp: new Date().toISOString(),
    });

    const status = parseOutputStatus(data);
    if (status) {
      io.emit('cc:status', { sessionId, status });
    }

    const cost = parseCost(data);
    if (cost !== null) {
      sessionManager.updateCost(sessionId, cost);
      io.emit('cc:cost', { sessionId, cost });
    }

    sessionManager.updateActivity(sessionId);
  });

  // PTY exit handling
  ptyManager.on('exit', (sessionId: string) => {
    const session = sessionManager.getSession(sessionId);
    if (session) {
      sessionManager.killSession(sessionId);
      io.emit('session:updated', { ...session, status: 'terminated' });
    }
  });

  io.on('connection', (socket) => {
    logger.info({ device: socket.data.deviceName, id: socket.id }, 'Client connected');

    // Send session list on connect + buffered output for active sessions
    const activeSessions = sessionManager.getActiveSessions();
    socket.emit('session:list', activeSessions);

    // Send buffered output for each active session
    for (const session of activeSessions) {
      const buffered = ptyManager.getBufferedOutput(session.id);
      if (buffered) {
        socket.emit('cc:output', {
          sessionId: session.id,
          content: buffered,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Rate limit wrapper
    function rateLimited(handler: () => void): void {
      if (!socketLimiter.isAllowed(socket.id)) {
        socket.emit('cc:error', { message: 'Rate limit exceeded. Slow down.' });
        logger.warn({ socketId: socket.id }, 'Socket rate limit exceeded');
        return;
      }
      handler();
    }

    // ===== Session management =====

    socket.on('session:create', (data) => {
      rateLimited(() => {
        try {
          const name = sanitizeSessionName(data.name);
          const cwd = sanitizeCwd(data.cwd);

          if (!name || !cwd) {
            socket.emit('cc:error', { message: 'Invalid session name or directory' });
            return;
          }

          // Verify directory exists
          if (!fs.existsSync(cwd)) {
            socket.emit('cc:error', { message: `Directory does not exist: ${cwd}` });
            return;
          }

          const session = sessionManager.createSession(name, cwd);
          logger.info({ sessionId: session.id, name, cwd, device: socket.data.deviceName }, 'Session created');
          io.emit('session:created', session);
          io.emit('session:list', sessionManager.getActiveSessions());
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to create session';
          socket.emit('cc:error', { message });
          logger.error(err, 'Failed to create session');
        }
      });
    });

    socket.on('session:kill', (data) => {
      rateLimited(() => {
        try {
          sessionManager.killSession(data.sessionId);
          logger.info({ sessionId: data.sessionId, device: socket.data.deviceName }, 'Session killed');
          io.emit('session:list', sessionManager.getActiveSessions());
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to kill session';
          socket.emit('cc:error', { message });
        }
      });
    });

    socket.on('session:list', () => {
      rateLimited(() => {
        socket.emit('session:list', sessionManager.getActiveSessions());
      });
    });

    // ===== Claude Code interaction =====

    socket.on('cc:input', (data) => {
      rateLimited(() => {
        try {
          const sanitized = sanitizeInput(data.text);
          if (!sanitized) return;
          ptyManager.writeToSession(data.sessionId, sanitized + '\r');
          sessionManager.updateActivity(data.sessionId);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to send input';
          socket.emit('cc:error', { message });
        }
      });
    });

    socket.on('cc:approve', (data) => {
      rateLimited(() => {
        try {
          ptyManager.writeToSession(data.sessionId, 'y\r');
          sessionManager.updateActivity(data.sessionId);
          logger.info({ sessionId: data.sessionId }, 'Action approved');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to approve';
          socket.emit('cc:error', { message });
        }
      });
    });

    socket.on('cc:reject', (data) => {
      rateLimited(() => {
        try {
          ptyManager.writeToSession(data.sessionId, 'n\r');
          sessionManager.updateActivity(data.sessionId);
          logger.info({ sessionId: data.sessionId }, 'Action rejected');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to reject';
          socket.emit('cc:error', { message });
        }
      });
    });

    socket.on('cc:interrupt', (data) => {
      rateLimited(() => {
        try {
          ptyManager.interruptSession(data.sessionId);
          logger.info({ sessionId: data.sessionId }, 'Session interrupted (Ctrl+C)');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to interrupt';
          socket.emit('cc:error', { message });
        }
      });
    });

    socket.on('cc:photo', (data) => {
      rateLimited(() => {
        try {
          const maxPhotoBytes = config.upload.maxSizeMb * 1024 * 1024;

          if (!isValidBase64(data.base64, maxPhotoBytes)) {
            socket.emit('cc:error', { message: 'Invalid or oversized photo' });
            return;
          }

          const buffer = Buffer.from(data.base64, 'base64');
          const safeName = sanitizeFilename(data.filename);
          const filename = `${uuidv4()}-${safeName}`;
          const filePath = path.join(config.upload.dir, filename);

          fs.writeFileSync(filePath, buffer);

          // Send path to Claude Code session as input
          const inputMessage = `[Photo uploaded: ${filePath}]`;
          ptyManager.writeToSession(data.sessionId, inputMessage + '\r');

          logger.info({ sessionId: data.sessionId, filename, size: buffer.length }, 'Photo uploaded via socket');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to upload photo';
          socket.emit('cc:error', { message });
        }
      });
    });

    socket.on('disconnect', () => {
      socketLimiter.remove(socket.id);
      logger.info({ device: socket.data.deviceName, id: socket.id }, 'Client disconnected');
    });
  });

  // Cleanup on server shutdown
  io.engine?.on('close', () => {
    clearInterval(cleanupInterval);
  });
}
