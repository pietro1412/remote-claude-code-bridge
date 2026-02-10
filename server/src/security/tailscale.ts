import os from 'node:os';
import { config } from '../config.js';
import { createLogger } from '../logger.js';

const logger = createLogger('tailscale');

export function detectTailscaleIp(): string {
  if (config.isDev) {
    logger.info('Dev mode: binding to 0.0.0.0');
    return '0.0.0.0';
  }

  const interfaces = os.networkInterfaces();

  // Look for Tailscale interface (tailscale0 on Linux, utun on macOS)
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;

    const isTailscale =
      name.startsWith('tailscale') ||
      name.startsWith('Tailscale') ||
      // On macOS, Tailscale uses utun interfaces
      (name.startsWith('utun') && addrs.some((a) => a.address.startsWith('100.')));

    if (isTailscale) {
      const ipv4 = addrs.find((a) => a.family === 'IPv4');
      if (ipv4) {
        logger.info({ interface: name, ip: ipv4.address }, 'Tailscale IP detected');
        return ipv4.address;
      }
    }
  }

  // Fallback: search for any 100.x.x.x address (Tailscale CGNAT range)
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const tailscaleAddr = addrs.find(
      (a) => a.family === 'IPv4' && a.address.startsWith('100.'),
    );
    if (tailscaleAddr) {
      logger.info(
        { interface: name, ip: tailscaleAddr.address },
        'Tailscale IP found via CGNAT range',
      );
      return tailscaleAddr.address;
    }
  }

  logger.warn('No Tailscale interface found, binding to localhost');
  return '127.0.0.1';
}
