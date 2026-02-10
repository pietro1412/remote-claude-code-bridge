import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { createLogger } from '../logger.js';

const logger = createLogger('auth');

interface JwtPayload {
  sub: string;
  device: string;
  iat: number;
  exp: number;
}

export async function ensureJwtSecret(): Promise<void> {
  if (config.jwt.secret) return;

  const envPath = path.resolve(config.rootDir, '.env');

  // Generate a new secret
  const secret = crypto.randomBytes(64).toString('hex');

  // Write to .env
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  if (envContent.includes('JWT_SECRET=')) {
    envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${secret}`);
  } else {
    envContent += `\nJWT_SECRET=${secret}\n`;
  }

  fs.writeFileSync(envPath, envContent);

  // Update runtime config
  (config.jwt as { secret: string }).secret = secret;

  logger.info('JWT secret generated and saved to .env');
}

export function generateToken(userId: string, deviceName: string): string {
  return jwt.sign(
    { sub: userId, device: deviceName } satisfies Omit<JwtPayload, 'iat' | 'exp'>,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch {
    return null;
  }
}

export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
