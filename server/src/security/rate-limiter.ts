import { rateLimit } from 'express-rate-limit';

// Login: 5 attempts per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload: 10 per minute
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many uploads. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 100 per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Socket.io rate limiter — tracks messages per socket
export class SocketRateLimiter {
  private counters = new Map<string, { count: number; resetAt: number }>();
  private readonly maxPerWindow: number;
  private readonly windowMs: number;

  constructor(maxPerWindow = 60, windowMs = 60_000) {
    this.maxPerWindow = maxPerWindow;
    this.windowMs = windowMs;
  }

  isAllowed(socketId: string): boolean {
    const now = Date.now();
    const entry = this.counters.get(socketId);

    if (!entry || now > entry.resetAt) {
      this.counters.set(socketId, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    entry.count++;
    return entry.count <= this.maxPerWindow;
  }

  remove(socketId: string): void {
    this.counters.delete(socketId);
  }

  // Periodic cleanup of expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [id, entry] of this.counters) {
      if (now > entry.resetAt) this.counters.delete(id);
    }
  }
}
