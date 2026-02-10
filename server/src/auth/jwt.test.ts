import { describe, it, expect, beforeAll } from 'vitest';
import { generateToken, verifyToken, generateAccessToken } from './jwt.js';
import { config } from '../config.js';

describe('JWT', () => {
  beforeAll(() => {
    // Set a test secret
    (config.jwt as { secret: string }).secret = 'test-secret-for-unit-testing-only';
  });

  describe('generateToken / verifyToken', () => {
    it('should generate and verify a valid token', () => {
      const token = generateToken('user-123', 'iPhone Test');
      const payload = verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe('user-123');
      expect(payload!.device).toBe('iPhone Test');
    });

    it('should reject an invalid token', () => {
      expect(verifyToken('invalid-token')).toBeNull();
      expect(verifyToken('')).toBeNull();
    });

    it('should reject a tampered token', () => {
      const token = generateToken('user-123', 'Test');
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(verifyToken(tampered)).toBeNull();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a 64-char hex string', () => {
      const token = generateAccessToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set(Array.from({ length: 10 }, () => generateAccessToken()));
      expect(tokens.size).toBe(10);
    });
  });
});
