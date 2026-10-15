import bcrypt from 'bcryptjs';
import { CommonEvent, Response } from 'commoneventframework';
import { UserRepository } from '../repositories/UserRepository';
import { signToken } from '../infrastructure/jwt';

export const parseLoginInput = (event: CommonEvent) => {
  const body = typeof event.body === 'string' ? JSON.parse(event.body ?? '{}') : (event.body ?? {});
  const { email, password } = body as Record<string, string>;
  if (!email || !password) {
    return new Response(400, { error: 'email and password are required' });
  }
  return { email, password };
};

export const login = async (input: { email: string; password: string }) => {
  const user = await UserRepository.findByEmail(input.email);
  if (!user) return new Response(401, { error: 'Invalid credentials' });

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) return new Response(401, { error: 'Invalid credentials' });

  const token = signToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};
