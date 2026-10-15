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
}) => {
  const { user, status, userId, page, limit } = input;

  if (user.role === UserRole.REQUESTER) {
    const requests = await VacationRequestRepository.find({
      where: { user_id: user.sub },
      order: { created_at: 'DESC' },
    });
    return { data: requests, total: requests.length, page: 1, limit: requests.length };
  }

  const [data, total] = await VacationRequestRepository.findPaginatedForValidator({
    status,
    userId,
    page,
    limit,
  });
  return { data, total, page, limit };
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
    return { user, startDate, endDate, reason: reason ?? null };
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
}) => {
  try {
    const result = await commandBus.dispatch(
      new CreateVacationRequestCommand(
        input.user.sub,
        input.startDate,
        input.endDate,
        input.reason,
      ),
    );
    return new Response(201, result);
  } catch (err) {
    if (err instanceof AppError) return new Response(err.statusCode, { error: err.message });
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
    return { user, requestId };
  } catch (err) {
    return new Response((err as { statusCode: number }).statusCode ?? 400, {
      error: (err as Error).message,
    });
  }
};

export const approve = async (input: {
  user: ReturnType<typeof extractAuth>;
  requestId: string;
}) => {
  try {
    await commandBus.dispatch(new ApproveVacationRequestCommand(input.requestId, input.user.sub));
    return { success: true };
  } catch (err) {
    if (err instanceof AppError) return new Response(err.statusCode, { error: err.message });
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
    return { user, requestId, comments };
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
}) => {
  try {
    await commandBus.dispatch(
      new RejectVacationRequestCommand(input.requestId, input.user.sub, input.comments),
    );
    return { success: true };
  } catch (err) {
    if (err instanceof AppError) return new Response(err.statusCode, { error: err.message });
    throw err;
  }
};
