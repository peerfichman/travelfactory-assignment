import { signToken, verifyToken } from '../src/infrastructure/jwt';
import { UserRole } from '../src/entities/User';

describe('JWT utilities', () => {
  const payload = {
    sub: 'user-1',
    email: 'alice@example.com',
    role: UserRole.REQUESTER,
    name: 'Alice',
  };

  it('signs and verifies a token', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('throws on tampered token', () => {
    const token = signToken(payload) + 'tampered';
    expect(() => verifyToken(token)).toThrow();
  });
});
