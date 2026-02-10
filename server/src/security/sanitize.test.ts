import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  sanitizeSessionName,
  sanitizeDeviceName,
  sanitizeCwd,
  sanitizeFilename,
  isValidImageMime,
  isValidBase64,
  isPathSafe,
} from './sanitize.js';

describe('sanitizeInput', () => {
  it('should return empty string for non-string input', () => {
    expect(sanitizeInput(null as any)).toBe('');
    expect(sanitizeInput(undefined as any)).toBe('');
    expect(sanitizeInput(123 as any)).toBe('');
  });

  it('should strip control characters', () => {
    expect(sanitizeInput('hello\x00world')).toBe('helloworld');
    expect(sanitizeInput('test\x07bell')).toBe('testbell');
  });

  it('should preserve tabs, newlines, carriage returns', () => {
    expect(sanitizeInput('hello\tworld')).toBe('hello\tworld');
    expect(sanitizeInput('hello\nworld')).toBe('hello\nworld');
    expect(sanitizeInput('hello\rworld')).toBe('hello\rworld');
  });

  it('should truncate to max length', () => {
    const longInput = 'a'.repeat(20000);
    expect(sanitizeInput(longInput).length).toBe(10000);
  });

  it('should pass through normal text', () => {
    expect(sanitizeInput('npm install express')).toBe('npm install express');
    expect(sanitizeInput('echo "hello world"')).toBe('echo "hello world"');
  });
});

describe('sanitizeSessionName', () => {
  it('should remove XSS characters', () => {
    expect(sanitizeSessionName('test<script>alert(1)</script>')).toBe('testscriptalert(1)/script');
  });

  it('should truncate to 100 chars', () => {
    const longName = 'a'.repeat(200);
    expect(sanitizeSessionName(longName).length).toBe(100);
  });

  it('should trim whitespace', () => {
    expect(sanitizeSessionName('  hello  ')).toBe('hello');
  });
});

describe('sanitizeDeviceName', () => {
  it('should remove dangerous chars', () => {
    expect(sanitizeDeviceName('iPhone <Pietro>')).toBe('iPhone Pietro');
  });
});

describe('sanitizeCwd', () => {
  it('should remove path traversal', () => {
    const result = sanitizeCwd('/home/user/../../../etc/passwd');
    expect(result).not.toContain('..');
  });

  it('should reject null bytes', () => {
    expect(sanitizeCwd('/home/user\0/test')).toBe('');
  });

  it('should handle normal paths', () => {
    const result = sanitizeCwd('/home/user/project');
    expect(result).toContain('home');
    expect(result).toContain('project');
  });
});

describe('sanitizeFilename', () => {
  it('should replace special characters', () => {
    expect(sanitizeFilename('test file (1).jpg')).toBe('test_file__1_.jpg');
  });

  it('should prevent hidden files', () => {
    expect(sanitizeFilename('.htaccess')).toBe('_htaccess');
  });

  it('should prevent double dots', () => {
    expect(sanitizeFilename('test..jpg')).toBe('test.jpg');
  });

  it('should return fallback for empty input', () => {
    expect(sanitizeFilename('')).toBe('file');
  });
});

describe('isValidImageMime', () => {
  it('should accept valid image types', () => {
    expect(isValidImageMime('image/jpeg')).toBe(true);
    expect(isValidImageMime('image/png')).toBe(true);
    expect(isValidImageMime('image/gif')).toBe(true);
    expect(isValidImageMime('image/webp')).toBe(true);
  });

  it('should reject non-image types', () => {
    expect(isValidImageMime('text/html')).toBe(false);
    expect(isValidImageMime('application/javascript')).toBe(false);
    expect(isValidImageMime('image/svg+xml')).toBe(false); // Removed for XSS safety
  });
});

describe('isValidBase64', () => {
  it('should validate proper base64', () => {
    expect(isValidBase64('aGVsbG8=', 1000)).toBe(true);
    expect(isValidBase64('dGVzdA==', 1000)).toBe(true);
  });

  it('should reject invalid base64', () => {
    expect(isValidBase64('not-base64!!!', 1000)).toBe(false);
  });

  it('should reject oversized data', () => {
    const bigBase64 = 'a'.repeat(2000000); // ~1.5MB
    expect(isValidBase64(bigBase64, 1000)).toBe(false);
  });

  it('should reject non-string input', () => {
    expect(isValidBase64(123 as any, 1000)).toBe(false);
  });
});

describe('isPathSafe', () => {
  it('should allow paths within base directory', () => {
    expect(isPathSafe('uploads/photo.jpg', '/home/user/rccb')).toBe(true);
  });

  it('should reject path traversal attempts', () => {
    expect(isPathSafe('../../etc/passwd', '/home/user/rccb')).toBe(false);
  });
});
