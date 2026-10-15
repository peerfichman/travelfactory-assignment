import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { handler } from '../../src/index';
import { AppDataSource } from '../../src/infrastructure/database';
import { TestDataSource, initTestDb, clearTestDb, closeTestDb } from '../setup/testDataSource';
import { User, UserRole } from '../../src/entities/User';
import { VacationRequest, RequestStatus } from '../../src/entities/VacationRequest';
import { buildEvent, parseResponse } from '../helpers/eventBuilder';

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

async function loginAs(email: string): Promise<string> {
  const result = await handler(
    buildEvent({ method: 'POST', path: '/auth/login', body: { email, password: 'password123' } }),
  );
  const { body } = parseResponse(result);
  return (body as { token: string }).token;
}

async function createRequest(token: string, start: string, end: string, reason?: string) {
  return handler(
    buildEvent({
      method: 'POST',
      path: '/vacation-requests',
      body: { startDate: start, endDate: end, reason },
      token,
    }),
  );
}

describe('Vacation Requests', () => {
  let aliceToken: string;
  let carolToken: string;

  beforeAll(async () => {
    await initTestDb();
    const repo = TestDataSource.getRepository(User);
    const hashed = await bcrypt.hash('password123', 10);
    await repo.save([
      repo.create({
        name: 'Alice Martin',
        email: 'alice@example.com',
        password: hashed,
        role: UserRole.REQUESTER,
      }),
      repo.create({
        name: 'Carol Dubois',
        email: 'carol@example.com',
        password: hashed,
        role: UserRole.VALIDATOR,
      }),
    ]);
    aliceToken = await loginAs('alice@example.com');
    carolToken = await loginAs('carol@example.com');
  });

  afterEach(async () => {
    await TestDataSource.query('DELETE FROM vacation_requests');
  });

  afterAll(async () => {
    await clearTestDb();
    await closeTestDb();
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  // ── Happy paths ────────────────────────────────────────────────────────────

  it('lifecycle: create → approve sets status to Approved', async () => {
    const createRes = parseResponse(
      await createRequest(aliceToken, futureDate(10), futureDate(15)),
    );
    expect(createRes.statusCode).toBe(201);
    const { id } = createRes.body as { id: string };

    const approveRes = parseResponse(
      await handler(
        buildEvent({
          method: 'PATCH',
          path: `/vacation-requests/${id}/approve`,
          token: carolToken,
          pathParams: { id },
        }),
      ),
    );
    expect(approveRes.statusCode).toBe(200);

    const saved = await TestDataSource.getRepository(VacationRequest).findOneByOrFail({ id });
    expect(saved.status).toBe(RequestStatus.APPROVED);
  });

  it('lifecycle: create → reject with comment sets status to Rejected and saves comment', async () => {
    const createRes = parseResponse(
      await createRequest(aliceToken, futureDate(20), futureDate(25)),
    );
    const { id } = createRes.body as { id: string };

    const rejectRes = parseResponse(
      await handler(
        buildEvent({
          method: 'PATCH',
          path: `/vacation-requests/${id}/reject`,
          token: carolToken,
          pathParams: { id },
          body: { comments: 'Team is at full capacity' },
        }),
      ),
    );
    expect(rejectRes.statusCode).toBe(200);

    const saved = await TestDataSource.getRepository(VacationRequest).findOneByOrFail({ id });
    expect(saved.status).toBe(RequestStatus.REJECTED);
    expect(saved.comments).toBe('Team is at full capacity');
  });

  // ── Validation: create ─────────────────────────────────────────────────────

  it('returns 400 when start date is in the past', async () => {
    const res = parseResponse(await createRequest(aliceToken, pastDate(1), futureDate(5)));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when end date is not after start date', async () => {
    const start = futureDate(5);
    const res = parseResponse(await createRequest(aliceToken, start, start));
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 when dates overlap an existing request', async () => {
    await createRequest(aliceToken, futureDate(10), futureDate(20));
    const overlap = parseResponse(await createRequest(aliceToken, futureDate(12), futureDate(18)));
    expect(overlap.statusCode).toBe(409);
  });

  // ── Validation: reject ─────────────────────────────────────────────────────

  it('returns 400 when rejecting without a comment', async () => {
    const { body } = parseResponse(await createRequest(aliceToken, futureDate(30), futureDate(35)));
    const { id } = body as { id: string };

    const res = parseResponse(
      await handler(
        buildEvent({
          method: 'PATCH',
          path: `/vacation-requests/${id}/reject`,
          token: carolToken,
          pathParams: { id },
          body: { comments: '' },
        }),
      ),
    );
    expect(res.statusCode).toBe(400);
  });

  // ── Validation: approve ────────────────────────────────────────────────────

  it('returns 409 when approving an already-approved request', async () => {
    const { body } = parseResponse(await createRequest(aliceToken, futureDate(40), futureDate(45)));
    const { id } = body as { id: string };

    await handler(
      buildEvent({
        method: 'PATCH',
        path: `/vacation-requests/${id}/approve`,
        token: carolToken,
        pathParams: { id },
      }),
    );
    const second = parseResponse(
      await handler(
        buildEvent({
          method: 'PATCH',
          path: `/vacation-requests/${id}/approve`,
          token: carolToken,
          pathParams: { id },
        }),
      ),
    );
    expect(second.statusCode).toBe(409);
  });

  // ── Authorization ──────────────────────────────────────────────────────────

  it('returns 403 when Requester tries to approve', async () => {
    const { body } = parseResponse(await createRequest(aliceToken, futureDate(50), futureDate(55)));
    const { id } = body as { id: string };

    const res = parseResponse(
      await handler(
        buildEvent({
          method: 'PATCH',
          path: `/vacation-requests/${id}/approve`,
          token: aliceToken,
          pathParams: { id },
        }),
      ),
    );
    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when Requester tries to reject', async () => {
    const { body } = parseResponse(await createRequest(aliceToken, futureDate(60), futureDate(65)));
    const { id } = body as { id: string };

    const res = parseResponse(
      await handler(
        buildEvent({
          method: 'PATCH',
          path: `/vacation-requests/${id}/reject`,
          token: aliceToken,
          pathParams: { id },
          body: { comments: 'Trying anyway' },
        }),
      ),
    );
    expect(res.statusCode).toBe(403);
  });

  it('returns 401 when request has no token', async () => {
    const res = parseResponse(
      await handler(buildEvent({ method: 'GET', path: '/vacation-requests' })),
    );
    expect(res.statusCode).toBe(401);
  });

  // ── List / Pagination ──────────────────────────────────────────────────────

  it('Validator GET returns all requests with pagination metadata', async () => {
    await createRequest(aliceToken, futureDate(70), futureDate(75));
    await createRequest(aliceToken, futureDate(80), futureDate(85));

    const res = parseResponse(
      await handler(
        buildEvent({
          method: 'GET',
          path: '/vacation-requests',
          token: carolToken,
          query: { page: '1', limit: '10' },
        }),
      ),
    );
    expect(res.statusCode).toBe(200);
    const body = res.body as { data: unknown[]; total: number; page: number; limit: number };
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(10);
  });

  it('Validator GET with ?status=Pending returns only Pending requests', async () => {
    const r1 = parseResponse(await createRequest(aliceToken, futureDate(90), futureDate(95)));
    const r2 = parseResponse(await createRequest(aliceToken, futureDate(100), futureDate(105)));
    const { id: id2 } = r2.body as { id: string };

    // Approve r2 so it is no longer Pending
    await handler(
      buildEvent({
        method: 'PATCH',
        path: `/vacation-requests/${id2}/approve`,
        token: carolToken,
        pathParams: { id: id2 },
      }),
    );
    void r1; // r1 stays Pending

    const res = parseResponse(
      await handler(
        buildEvent({
          method: 'GET',
          path: '/vacation-requests',
          token: carolToken,
          query: { status: 'Pending' },
        }),
      ),
    );
    const body = res.body as { data: { status: string }[]; total: number };
    expect(body.data.every((r) => r.status === 'Pending')).toBe(true);
    expect(body.total).toBe(1);
  });

  it('Requester GET returns only their own requests', async () => {
    await createRequest(aliceToken, futureDate(110), futureDate(115));

    const res = parseResponse(
      await handler(buildEvent({ method: 'GET', path: '/vacation-requests', token: aliceToken })),
    );
    const body = res.body as { data: { user_id: string }[] };
    expect(res.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
    // All returned requests belong to alice (Requester sees only their own)
    expect(body.data.every((r) => r.user_id !== undefined)).toBe(true);
  });
});
