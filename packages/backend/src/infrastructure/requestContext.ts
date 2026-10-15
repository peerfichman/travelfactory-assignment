import { randomUUID } from 'crypto';
import { logger } from './logger';
import type { Logger } from 'pino';

export function createRequestId(): string {
  return randomUUID();
}

export function requestLogger(requestId: string): Logger {
  return logger.child({ requestId });
}
