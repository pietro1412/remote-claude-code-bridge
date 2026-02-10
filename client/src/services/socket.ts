import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/events.js';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) throw new Error('Socket not initialized. Call connectSocket first.');
  return socket;
}

export function connectSocket(jwt: string): TypedSocket {
  if (socket?.connected) return socket;

  const url = import.meta.env.DEV ? 'http://localhost:3443' : window.location.origin;

  socket = io(url, {
    auth: { token: jwt },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    transports: ['websocket', 'polling'],
  }) as TypedSocket;

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
