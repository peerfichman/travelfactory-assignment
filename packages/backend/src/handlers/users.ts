import { Response } from 'commoneventframework';
import type { CommonEvent } from '../types/cef';
import { UserRepository } from '../repositories/UserRepository';
import { extractAuth, requireRole } from '../middleware/requireAuth';
import { UserRole } from '../entities/User';
import { createRequestId, requestLogger } from '../infrastructure/requestContext';

export const parseListUsersInput = (event: CommonEvent) => {
  try {
    const user = extractAuth(event.headers as Record<string, string>);
    requireRole(user, UserRole.VALIDATOR);
    return { user, _requestId: createRequestId(), _startMs: Date.now() };
  } catch (err) {
    return new Response((err as { statusCode: number }).statusCode ?? 401, {
      error: (err as Error).message,
    });
  }
};

export const listUsers = async (input: {
  user: ReturnType<typeof extractAuth>;
  _requestId: string;
  _startMs: number;
}) => {
  const log = requestLogger(input._requestId);
  log.info({ method: 'GET', path: '/users' }, 'HTTP request received');

  const users = await UserRepository.find({
    where: { role: UserRole.REQUESTER },
    select: ['id', 'name', 'email'],
    order: { name: 'ASC' },
  });

  log.info(
    { status: 200, count: users.length, durationMs: Date.now() - input._startMs },
    'HTTP response',
  );
  return new Response(200, users);
};
