import pino from 'pino';
import { config } from './config.js';

const transport = config.isDev
  ? pino.transport({ target: 'pino-pretty', options: { colorize: true } })
  : undefined;

const rootLogger = pino({ level: config.log.level }, transport);

export function createLogger(name: string) {
  return rootLogger.child({ module: name });
}
