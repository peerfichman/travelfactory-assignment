import { extractAuth, requireRole } from '../../src/middleware/requireAuth';
import { signToken } from '../../src/infrastructure/jwt';
import { UserRole } from '../../src/entities/User';

function catchThrown(fn: () => unknown): unknown {
  try {
    fn();
    return null;
  } catch (e) {
    return e;
  }
}

const validPayload = {
  sub: 'user-1',
  email: 'alice@example.com',
  role: UserRole.REQUESTER,
  name: 'Alice',
};

describe('extractAuth', () => {
  it('throws 401 when Authorization header is missing', () => {
    expect(catchThrown(() => extractAuth({}))).toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when header does not start with Bearer', () => {
    expect(catchThrown(() => extractAuth({ authorization: 'Basic abc123' }))).toMatchObject({
      statusCode: 401,
    });
  });

  it('throws 401 when token is invalid', () => {
    expect(
      catchThrown(() => extractAuth({ authorization: 'Bearer notavalidtoken' })),
    ).toMatchObject({ statusCode: 401 });
  });

  it('returns decoded payload for a valid token', () => {
    const token = signToken(validPayload);
    const result = extractAuth({ authorization: `Bearer ${token}` });

    expect(result.sub).toBe(validPayload.sub);
    expect(result.email).toBe(validPayload.email);
    expect(result.role).toBe(UserRole.REQUESTER);
  });

  it('accepts Authorization header with capital A', () => {
    const token = signToken(validPayload);
    const result = extractAuth({ Authorization: `Bearer ${token}` });
    expect(result.sub).toBe(validPayload.sub);
  });
});

describe('requireRole', () => {
  const user = { ...validPayload };

  it('does not throw when role matches', () => {
    expect(() => requireRole(user, UserRole.REQUESTER)).not.toThrow();
  });

  it('throws 403 when role does not match', () => {
    expect(catchThrown(() => requireRole(user, UserRole.VALIDATOR))).toMatchObject({
      statusCode: 403,
    });
  });
});
