import jwt from 'jsonwebtoken';
import { UserRole } from '../entities/User';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const expiresIn = process.env.JWT_EXPIRES_IN ?? '8h';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
