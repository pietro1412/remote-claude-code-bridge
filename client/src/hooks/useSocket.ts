import { useState, useEffect, useCallback, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket.js';
import type { SessionRecord, ClaudeCodeStatus } from '../types/events.js';

interface UseSocketReturn {
  connected: boolean;
  sessions: SessionRecord[];
  activeStatus: ClaudeCodeStatus | null;
  sendInput: (sessionId: string, text: string) => void;
  approve: (sessionId: string) => void;
  reject: (sessionId: string) => void;
  interrupt: (sessionId: string) => void;
  createSession: (name: string, cwd: string) => void;
  killSession: (sessionId: string) => void;
  sendPhoto: (sessionId: string, filename: string, base64: string) => void;
  onOutput: (cb: (sessionId: string, content: string) => void) => void;
}

export function useSocket(jwt: string | null): UseSocketReturn {
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeStatus, setActiveStatus] = useState<ClaudeCodeStatus | null>(null);
  const outputCallbackRef = useRef<((sessionId: string, content: string) => void) | null>(null);

  useEffect(() => {
    if (!jwt) return;

    const socket = connectSocket(jwt);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('session:list', (list) => setSessions(list));
    socket.on('session:created', () => socket.emit('session:list'));
    socket.on('session:updated', () => socket.emit('session:list'));

    socket.on('cc:status', (data) => setActiveStatus(data.status));
    socket.on('cc:output', (data) => {
      outputCallbackRef.current?.(data.sessionId, data.content);
    });

    socket.on('cc:error', (data) => {
      console.error('[RCCB Error]', data.message);
    });

    return () => {
      disconnectSocket();
    };
  }, [jwt]);

  const sendInput = useCallback((sessionId: string, text: string) => {
    getSocket().emit('cc:input', { sessionId, text });
  }, []);

  const approve = useCallback((sessionId: string) => {
    getSocket().emit('cc:approve', { sessionId });
  }, []);

  const reject = useCallback((sessionId: string) => {
    getSocket().emit('cc:reject', { sessionId });
  }, []);

  const interrupt = useCallback((sessionId: string) => {
    getSocket().emit('cc:interrupt', { sessionId });
  }, []);

  const createSession = useCallback((name: string, cwd: string) => {
    getSocket().emit('session:create', { name, cwd });
  }, []);

  const killSession = useCallback((sessionId: string) => {
    getSocket().emit('session:kill', { sessionId });
  }, []);

  const sendPhoto = useCallback((sessionId: string, filename: string, base64: string) => {
    getSocket().emit('cc:photo', { sessionId, filename, base64 });
  }, []);

  const onOutput = useCallback((cb: (sessionId: string, content: string) => void) => {
    outputCallbackRef.current = cb;
  }, []);

  return {
    connected,
    sessions,
    activeStatus,
    sendInput,
    approve,
    reject,
    interrupt,
    createSession,
    killSession,
    sendPhoto,
    onOutput,
  };
}
