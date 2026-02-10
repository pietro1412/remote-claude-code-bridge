import path from 'node:path';

// Control characters except tab, newline, carriage return
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

const MAX_INPUT_LENGTH = 10000;
const MAX_SESSION_NAME_LENGTH = 100;
const MAX_DEVICE_NAME_LENGTH = 100;

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, MAX_INPUT_LENGTH).replace(CONTROL_CHARS, '');
}

export function sanitizeSessionName(name: string): string {
  if (typeof name !== 'string') return '';
  return name
    .slice(0, MAX_SESSION_NAME_LENGTH)
    .replace(CONTROL_CHARS, '')
    .replace(/[<>"'&]/g, '') // XSS prevention
    .trim();
}

export function sanitizeDeviceName(name: string): string {
  if (typeof name !== 'string') return '';
  return name
    .slice(0, MAX_DEVICE_NAME_LENGTH)
    .replace(CONTROL_CHARS, '')
    .replace(/[<>"'&]/g, '')
    .trim();
}

export function sanitizeCwd(cwd: string): string {
  if (typeof cwd !== 'string') return '';

  // Normalize and resolve to prevent path traversal
  const normalized = path.normalize(cwd).replace(/\.\./g, '');

  // Block null bytes
  if (normalized.includes('\0')) return '';

  return normalized;
}

// Validate that a path doesn't escape a base directory
export function isPathSafe(filePath: string, baseDir: string): boolean {
  const resolved = path.resolve(baseDir, filePath);
  return resolved.startsWith(path.resolve(baseDir));
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export function isValidImageMime(mime: string): boolean {
  return ALLOWED_MIME_TYPES.has(mime);
}

export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return 'file';
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\./, '_') // No hidden files
    .slice(0, 255) || 'file';
}

// Validate base64 string
export function isValidBase64(str: string, maxSizeBytes: number): boolean {
  if (typeof str !== 'string') return false;
  // Base64 length check (each char = 6 bits, so 4 chars = 3 bytes)
  if ((str.length * 3) / 4 > maxSizeBytes) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
}
