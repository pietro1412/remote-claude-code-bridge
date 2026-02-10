import { describe, it, expect } from 'vitest';
import { SocketRateLimiter } from './rate-limiter.js';

describe('SocketRateLimiter', () => {
  it('should allow messages within limit', () => {
    const limiter = new SocketRateLimiter(5, 60_000);

    for (let i = 0; i < 5; i++) {
      expect(limiter.isAllowed('socket1')).toBe(true);
    }
  });

  it('should block messages exceeding limit', () => {
    const limiter = new SocketRateLimiter(3, 60_000);

    expect(limiter.isAllowed('socket1')).toBe(true);
    expect(limiter.isAllowed('socket1')).toBe(true);
    expect(limiter.isAllowed('socket1')).toBe(true);
    expect(limiter.isAllowed('socket1')).toBe(false);
    expect(limiter.isAllowed('socket1')).toBe(false);
  });

  it('should track different sockets independently', () => {
    const limiter = new SocketRateLimiter(2, 60_000);

    expect(limiter.isAllowed('socket1')).toBe(true);
    expect(limiter.isAllowed('socket1')).toBe(true);
    expect(limiter.isAllowed('socket1')).toBe(false);

    // Different socket should still be allowed
    expect(limiter.isAllowed('socket2')).toBe(true);
    expect(limiter.isAllowed('socket2')).toBe(true);
  });

  it('should remove socket tracking', () => {
    const limiter = new SocketRateLimiter(2, 60_000);

    expect(limiter.isAllowed('socket1')).toBe(true);
    expect(limiter.isAllowed('socket1')).toBe(true);
    expect(limiter.isAllowed('socket1')).toBe(false);

    limiter.remove('socket1');

    // After removal, should be allowed again
    expect(limiter.isAllowed('socket1')).toBe(true);
  });

  it('should reset after window expires', () => {
    const limiter = new SocketRateLimiter(2, 1); // 1ms window

    expect(limiter.isAllowed('socket1')).toBe(true);
    expect(limiter.isAllowed('socket1')).toBe(true);

    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(limiter.isAllowed('socket1')).toBe(true);
        resolve();
      }, 10);
    });
  });

  it('should cleanup expired entries', () => {
    const limiter = new SocketRateLimiter(2, 1); // 1ms window

    limiter.isAllowed('socket1');
    limiter.isAllowed('socket2');

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        limiter.cleanup();
        // After cleanup, counters should be removed
        expect(limiter.isAllowed('socket1')).toBe(true);
        resolve();
      }, 10);
    });
  });
});
