import { login, parseLoginInput } from '../../src/handlers/auth';
import { UserRepository } from '../../src/repositories/UserRepository';
import { UserRole } from '../../src/entities/User';
import { Response } from 'commoneventframework';
import bcrypt from 'bcryptjs';

jest.mock('../../src/repositories/UserRepository', () => ({
  UserRepository: { findByEmail: jest.fn() },
}));

jest.mock('../../src/infrastructure/requestContext', () => ({
  createRequestId: () => 'test-req-id',
  requestLogger: () => ({ info: jest.fn(), warn: jest.fn() }),
}));

const mockUser = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  role: UserRole.REQUESTER,
  password: '',
};

const repo = UserRepository as jest.Mocked<typeof UserRepository>;

const validInput = {
  email: 'alice@example.com',
  password: 'password123',
  _requestId: 'test-req-id',
  _startMs: Date.now(),
};

describe('parseLoginInput', () => {
  const makeEvent = (body: object) => ({
    body: JSON.stringify(body),
    headers: {},
    method: 'POST',
    path: '/auth/login',
    queryStringParameters: {},
    pathParameters: {},
    version: '1.0',
  });

  it('returns 400 when email is missing', () => {
    const result = parseLoginInput(makeEvent({ password: 'abc' }) as never);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).statusCode).toBe(400);
  });

  it('returns 400 when password is missing', () => {
    const result = parseLoginInput(makeEvent({ email: 'a@b.com' }) as never);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).statusCode).toBe(400);
  });

  it('returns parsed input when both fields present', () => {
    const result = parseLoginInput(
      makeEvent({ email: 'alice@example.com', password: 'pass' }) as never,
    );
    expect(result).toMatchObject({ email: 'alice@example.com', password: 'pass' });
  });
});

describe('login handler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns token and user on valid credentials', async () => {
    mockUser.password = await bcrypt.hash('password123', 1);
    repo.findByEmail.mockResolvedValueOnce(mockUser as never);

    const result = await login(validInput);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).statusCode).toBe(200);
    const body = JSON.parse((result as Response).body);
    expect(body).toHaveProperty('token');
    expect(body.user).toMatchObject({
      id: 'user-1',
      email: 'alice@example.com',
      role: UserRole.REQUESTER,
    });
  });

  it('returns 401 when user not found', async () => {
    repo.findByEmail.mockResolvedValueOnce(null);

    const result = await login(validInput);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).statusCode).toBe(401);
  });

  it('returns 401 when password does not match', async () => {
    mockUser.password = await bcrypt.hash('differentpassword', 1);
    repo.findByEmail.mockResolvedValueOnce(mockUser as never);

    const result = await login(validInput);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).statusCode).toBe(401);
  });
});
