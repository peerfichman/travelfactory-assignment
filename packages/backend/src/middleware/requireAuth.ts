import { verifyToken, JwtPayload } from '../infrastructure/jwt';
import { UserRole } from '../entities/User';

export interface AuthContext {
  user: JwtPayload;
}

export function extractAuth(headers: Record<string, string> | undefined): JwtPayload {
  const authHeader = headers?.authorization ?? headers?.Authorization ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    throw { statusCode: 401, message: 'Missing or invalid Authorization header' };
  }
  const token = authHeader.slice(7);
  try {
    return verifyToken(token);
  } catch {
    throw { statusCode: 401, message: 'Invalid or expired token' };
  }
}

export function requireRole(user: JwtPayload, role: UserRole): void {
  if (user.role !== role) {
    throw { statusCode: 403, message: `Access denied: requires role ${role}` };
  }
}
