import bcrypt from 'bcryptjs';
import { Response } from 'commoneventframework';
import type { CommonEvent } from '../types/cef';
import { UserRepository } from '../repositories/UserRepository';
import { signToken } from '../infrastructure/jwt';
import { createRequestId, requestLogger } from '../infrastructure/requestContext';

export const parseLoginInput = (event: CommonEvent) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body ?? '{}') : (event.body ?? {});
  const { email, password } = body as Record<string, string>;
  if (!email || !password) {
    return new Response(400, { error: 'email and password are required' });
  }
  return { email, password, _requestId: createRequestId(), _startMs: Date.now() };
};

export const login = async (input: {
  email: string;
  password: string;
  _requestId: string;
  _startMs: number;
}) => {
  const log = requestLogger(input._requestId);
  log.info({ method: 'POST', path: '/auth/login' }, 'HTTP request received');

  const user = await UserRepository.findByEmail(input.email);
  if (!user) {
    log.info({ status: 401, durationMs: Date.now() - input._startMs }, 'HTTP response');
    return new Response(401, { error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    log.info({ status: 401, durationMs: Date.now() - input._startMs }, 'HTTP response');
    return new Response(401, { error: 'Invalid credentials' });
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
  log.info(
    { status: 200, userId: user.id, role: user.role, durationMs: Date.now() - input._startMs },
    'HTTP response',
  );
  return new Response(200, {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};
