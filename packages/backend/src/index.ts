import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { AppDataSource } from './infrastructure/database';
import { bootstrap } from './infrastructure/bootstrap';
import { logger } from './infrastructure/logger';

// CEF imports — must come after env is loaded
import {
  loadEnv,
  buildCommonEvent,
  getRouteConfig,
  resolveHandlerRef,
  startDevServer,
} from 'commoneventframework';
import { Response } from 'commoneventframework';

const ROOT_YAML = path.join(__dirname, 'root.yaml');

// Register commands and event handlers
bootstrap();

const envReady = loadEnv();

// CEF-compatible Lambda handler
export const handler = async (event: unknown, _context?: unknown): Promise<unknown> => {
  await envReady;

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    logger.info('Database connected');
  }

  const commonEvent = await buildCommonEvent(event, ROOT_YAML);
  const routeConfig = getRouteConfig(commonEvent);

  if (!routeConfig) {
    return new Response(404, { error: 'Route not found' });
  }

  const handlerRef = routeConfig.handler;
  if (!handlerRef) return new Response(500, { error: 'Handler not configured' });

  const handlerFn = resolveHandlerRef(handlerRef);
  if (!handlerFn) return new Response(500, { error: `Handler not found: ${handlerRef}` });

  const parserRef = routeConfig.inputParser;
  let input: unknown = {};
  if (parserRef) {
    const parserFn = resolveHandlerRef(parserRef);
    if (parserFn) {
      input = await parserFn(commonEvent);
      // If parser returned a Response, return it directly (validation error)
      if (input instanceof Response) return input;
    }
  }

  return handlerFn(input, commonEvent);
};

// When run with --local flag, start the CEF dev HTTP server on port 8888
if (require.main === module) {
  (async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connected');
    }
    if (process.argv.includes('--local')) {
      startDevServer(handler);
      logger.info({ port: process.env.PORT ?? 8888 }, 'Backend ready (local mode)');
    } else {
      logger.info('Handler exported for Lambda');
    }
  })().catch((err) => {
    logger.error(err, 'Failed to start');
    process.exit(1);
  });
}
