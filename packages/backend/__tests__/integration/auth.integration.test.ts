import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { handler } from '../../src/index';
import { AppDataSource } from '../../src/infrastructure/database';
import { TestDataSource, initTestDb, clearTestDb, closeTestDb } from '../setup/testDataSource';
import { User, UserRole } from '../../src/entities/User';
import { buildEvent, parseResponse } from '../helpers/eventBuilder';

describe('POST /auth/login', () => {
  beforeAll(async () => {
    await initTestDb();
    const hashed = await bcrypt.hash('password123', 10);
    await TestDataSource.getRepository(User).save(
      TestDataSource.getRepository(User).create({
        name: 'Alice Martin',
        email: 'alice@example.com',
        password: hashed,
        role: UserRole.REQUESTER,
      }),
    );
  });

  afterAll(async () => {
    await clearTestDb();
    await closeTestDb();
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it('returns 200 with token on valid credentials', async () => {
    const result = await handler(
      buildEvent({
        method: 'POST',
        path: '/auth/login',
        body: { email: 'alice@example.com', password: 'password123' },
      }),
    );
    const { statusCode, body } = parseResponse(result);
    expect(statusCode).toBe(200);
    expect(body).toHaveProperty('token');
    expect((body as { user: { role: string } }).user.role).toBe(UserRole.REQUESTER);
  });

  it('returns 401 on wrong password', async () => {
    const result = await handler(
      buildEvent({
        method: 'POST',
        path: '/auth/login',
        body: { email: 'alice@example.com', password: 'wrongpass' },
      }),
    );
    expect(parseResponse(result).statusCode).toBe(401);
  });

  it('returns 401 when user does not exist', async () => {
    const result = await handler(
      buildEvent({
        method: 'POST',
        path: '/auth/login',
        body: { email: 'nobody@example.com', password: 'password123' },
      }),
    );
    expect(parseResponse(result).statusCode).toBe(401);
  });

  it('returns 400 when email is missing', async () => {
    const result = await handler(
      buildEvent({ method: 'POST', path: '/auth/login', body: { password: 'password123' } }),
    );
    expect(parseResponse(result).statusCode).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const result = await handler(
      buildEvent({ method: 'POST', path: '/auth/login', body: { email: 'alice@example.com' } }),
    );
    expect(parseResponse(result).statusCode).toBe(400);
  });
});
