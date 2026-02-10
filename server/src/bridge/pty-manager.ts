import * as pty from 'node-pty';
import { EventEmitter } from 'node:events';
import { createLogger } from '../logger.js';

const logger = createLogger('pty-manager');

export interface PtySession {
  id: string;
  pty: pty.IPty;
  cwd: string;
  outputBuffer: string[];
}

export class PtyManager extends EventEmitter {
  private sessions = new Map<string, PtySession>();
  private readonly maxBufferLines = 1000;

  createSession(sessionId: string, cwd: string): PtySession {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash';
    const args = process.platform === 'win32' ? ['/c', 'claude'] : ['-c', 'claude'];

    const ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1',
      },
    });

    const session: PtySession = {
      id: sessionId,
      pty: ptyProcess,
      cwd,
      outputBuffer: [],
    };

    ptyProcess.onData((data: string) => {
      // Buffer output
      session.outputBuffer.push(data);
      if (session.outputBuffer.length > this.maxBufferLines) {
        session.outputBuffer.splice(0, session.outputBuffer.length - this.maxBufferLines);
      }

      this.emit('output', sessionId, data);
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      logger.info({ sessionId, exitCode, signal }, 'PTY process exited');
      this.emit('exit', sessionId, exitCode, signal);
      this.sessions.delete(sessionId);
    });

    this.sessions.set(sessionId, session);
    logger.info({ sessionId, cwd, pid: ptyProcess.pid }, 'PTY session created');

    return session;
  }

  writeToSession(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    session.pty.write(data);
  }

  resizeSession(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.pty.resize(cols, rows);
  }

  killSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.pty.kill();
    this.sessions.delete(sessionId);
    logger.info({ sessionId }, 'PTY session killed');
  }

  interruptSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    // Send Ctrl+C (ETX character)
    session.pty.write('\x03');
  }

  getSession(sessionId: string): PtySession | undefined {
    return this.sessions.get(sessionId);
  }

  getBufferedOutput(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';
    return session.outputBuffer.join('');
  }

  getAllSessions(): Map<string, PtySession> {
    return this.sessions;
  }

  getPid(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session?.pty.pid ?? 0;
  }

  cleanupAll(): void {
    for (const [id] of this.sessions) {
      this.killSession(id);
    }
  }
}

// Singleton
export const ptyManager = new PtyManager();
