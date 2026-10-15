import { CommonEvent, Response } from 'commoneventframework';
import { commandBus } from '../infrastructure/CommandBus';
import { CreateVacationRequestCommand } from '../commands/CreateVacationRequestCommand';
import { ApproveVacationRequestCommand } from '../commands/ApproveVacationRequestCommand';
import { RejectVacationRequestCommand } from '../commands/RejectVacationRequestCommand';
import { VacationRequestRepository } from '../repositories/VacationRequestRepository';
import { RequestStatus } from '../entities/VacationRequest';
import { extractAuth, requireRole } from '../middleware/requireAuth';
import { UserRole } from '../entities/User';
import { AppError } from '../command-handlers/CreateVacationRequestHandler';
import { createRequestId, requestLogger } from '../infrastructure/requestContext';

// ── List ──────────────────────────────────────────────────────────────────────

export const parseListInput = (event: CommonEvent) => {
  try {
    const user = extractAuth(event.headers as Record<string, string>);
    const qs = event.queryStringParameters ?? {};
    return {
      user,
      status: qs['status'] as RequestStatus | undefined,
      userId: qs['userId'],
      page: parseInt(qs['page'] ?? '1', 10),
      limit: Math.min(parseInt(qs['limit'] ?? '20', 10), 100),
      _requestId: createRequestId(),
      _startMs: Date.now(),
    };
  } catch (err) {
    return new Response((err as { statusCode: number }).statusCode, {
      error: (err as Error).message,
    });
  }
};

export const list = async (input: {
  user: ReturnType<typeof extractAuth>;
  status?: RequestStatus;
  userId?: string;
  page: number;
  limit: number;
  _requestId: string;
  _startMs: number;
}) => {
  const { user, status, userId, page, limit, _requestId, _startMs } = input;
  const log = requestLogger(_requestId);
  log.info({ method: 'GET', path: '/vacation-requests', role: user.role }, 'HTTP request received');

  let result;
  if (user.role === UserRole.REQUESTER) {
    const requests = await VacationRequestRepository.find({
      where: { user_id: user.sub },
      order: { created_at: 'DESC' },
    });
    result = { data: requests, total: requests.length, page: 1, limit: requests.length };
  } else {
    const [data, total] = await VacationRequestRepository.findPaginatedForValidator({
      status,
      userId,
      page,
      limit,
    });
    result = { data, total, page, limit };
  }

  log.info(
    { status: 200, count: result.total, durationMs: Date.now() - _startMs },
    'HTTP response',
  );
  return result;
};

// ── Create ────────────────────────────────────────────────────────────────────

export const parseCreateInput = (event: CommonEvent) => {
  try {
    const user = extractAuth(event.headers as Record<string, string>);
    requireRole(user, UserRole.REQUESTER);
    const body =
      typeof event.body === 'string' ? JSON.parse(event.body ?? '{}') : (event.body ?? {});
    const { startDate, endDate, reason } = body as Record<string, string>;
    if (!startDate || !endDate) {
      return new Response(400, { error: 'startDate and endDate are required' });
    }
    return {
      user,
      startDate,
      endDate,
      reason: reason ?? null,
      _requestId: createRequestId(),
      _startMs: Date.now(),
    };
  } catch (err) {
    return new Response((err as { statusCode: number }).statusCode ?? 400, {
      error: (err as Error).message,
    });
  }
};

export const create = async (input: {
  user: ReturnType<typeof extractAuth>;
  startDate: string;
  endDate: string;
  reason: string | null;
  _requestId: string;
  _startMs: number;
}) => {
  const { _requestId, _startMs } = input;
  const log = requestLogger(_requestId);
  log.info(
    { method: 'POST', path: '/vacation-requests', userId: input.user.sub },
    'HTTP request received',
  );

  try {
    const result = await commandBus.dispatch(
      new CreateVacationRequestCommand(
        input.user.sub,
        input.startDate,
        input.endDate,
        input.reason,
      ),
      _requestId,
    );
    log.info({ status: 201, durationMs: Date.now() - _startMs }, 'HTTP response');
    return new Response(201, result);
  } catch (err) {
    if (err instanceof AppError) {
      log.warn({ status: err.statusCode, durationMs: Date.now() - _startMs }, err.message);
      return new Response(err.statusCode, { error: err.message });
    }
    throw err;
  }
};

// ── Approve ───────────────────────────────────────────────────────────────────

export const parseApproveInput = (event: CommonEvent) => {
  try {
    const user = extractAuth(event.headers as Record<string, string>);
    requireRole(user, UserRole.VALIDATOR);
    const requestId = event.pathParameters?.['id'];
    if (!requestId) return new Response(400, { error: 'Missing request id' });
    return { user, requestId, _requestId: createRequestId(), _startMs: Date.now() };
  } catch (err) {
    return new Response((err as { statusCode: number }).statusCode ?? 400, {
      error: (err as Error).message,
    });
  }
};

export const approve = async (input: {
  user: ReturnType<typeof extractAuth>;
  requestId: string;
  _requestId: string;
  _startMs: number;
}) => {
  const { _requestId, _startMs } = input;
  const log = requestLogger(_requestId);
  log.info(
    { method: 'PATCH', path: `/vacation-requests/${input.requestId}/approve` },
    'HTTP request received',
  );

  try {
    await commandBus.dispatch(
      new ApproveVacationRequestCommand(input.requestId, input.user.sub),
      _requestId,
    );
    log.info({ status: 200, durationMs: Date.now() - _startMs }, 'HTTP response');
    return { success: true };
  } catch (err) {
    if (err instanceof AppError) {
      log.warn({ status: err.statusCode, durationMs: Date.now() - _startMs }, err.message);
      return new Response(err.statusCode, { error: err.message });
    }
    throw err;
  }
};

// ── Reject ────────────────────────────────────────────────────────────────────

export const parseRejectInput = (event: CommonEvent) => {
  try {
    const user = extractAuth(event.headers as Record<string, string>);
    requireRole(user, UserRole.VALIDATOR);
    const requestId = event.pathParameters?.['id'];
    if (!requestId) return new Response(400, { error: 'Missing request id' });
    const body =
      typeof event.body === 'string' ? JSON.parse(event.body ?? '{}') : (event.body ?? {});
    const { comments } = body as Record<string, string>;
    if (!comments || comments.trim().length === 0) {
      return new Response(400, { error: 'A rejection comment is required' });
    }
    return { user, requestId, comments, _requestId: createRequestId(), _startMs: Date.now() };
  } catch (err) {
    return new Response((err as { statusCode: number }).statusCode ?? 400, {
      error: (err as Error).message,
    });
  }
};

export const reject = async (input: {
  user: ReturnType<typeof extractAuth>;
  requestId: string;
  comments: string;
  _requestId: string;
  _startMs: number;
}) => {
  const { _requestId, _startMs } = input;
  const log = requestLogger(_requestId);
  log.info(
    { method: 'PATCH', path: `/vacation-requests/${input.requestId}/reject` },
    'HTTP request received',
  );

  try {
    await commandBus.dispatch(
      new RejectVacationRequestCommand(input.requestId, input.user.sub, input.comments),
      _requestId,
    );
    log.info({ status: 200, durationMs: Date.now() - _startMs }, 'HTTP response');
    return { success: true };
  } catch (err) {
    if (err instanceof AppError) {
      log.warn({ status: err.statusCode, durationMs: Date.now() - _startMs }, err.message);
      return new Response(err.statusCode, { error: err.message });
    }
    throw err;
  }
};
