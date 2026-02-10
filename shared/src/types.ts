// ===== Session =====

export type SessionStatus = 'active' | 'paused' | 'terminated';

export interface SessionRecord {
  id: string;
  name: string;
  cwd: string;
  pid: number;
  status: SessionStatus;
  created_at: string;
  last_activity: string;
  total_cost: number;
}

// ===== Auth =====

export interface AuthToken {
  id: string;
  token_hash: string;
  device_name: string;
  created_at: string;
  last_used: string;
  is_revoked: boolean;
}

export interface LoginRequest {
  token: string;
  device_name: string;
}

export interface LoginResponse {
  jwt: string;
  expires_at: string;
}

// ===== Claude Code Status =====

export type ClaudeCodeStatus = 'waiting_input' | 'thinking' | 'executing' | 'approval_needed' | 'idle';

// ===== Socket Events =====

export interface ServerToClientEvents {
  'cc:output': (data: { sessionId: string; content: string; timestamp: string }) => void;
  'cc:status': (data: { sessionId: string; status: ClaudeCodeStatus }) => void;
  'cc:cost': (data: { sessionId: string; cost: number }) => void;
  'cc:error': (data: { message: string }) => void;
  'session:list': (sessions: SessionRecord[]) => void;
  'session:created': (session: SessionRecord) => void;
  'session:updated': (session: SessionRecord) => void;
}

export interface ClientToServerEvents {
  'cc:input': (data: { sessionId: string; text: string }) => void;
  'cc:photo': (data: { sessionId: string; filename: string; base64: string }) => void;
  'cc:approve': (data: { sessionId: string }) => void;
  'cc:reject': (data: { sessionId: string }) => void;
  'cc:interrupt': (data: { sessionId: string }) => void;
  'session:create': (data: { name: string; cwd: string }) => void;
  'session:resume': (data: { sessionId: string }) => void;
  'session:kill': (data: { sessionId: string }) => void;
  'session:list': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  deviceName: string;
}

// ===== API =====

export interface HealthResponse {
  status: 'ok';
  version: string;
  uptime: number;
  sessions: number;
}
