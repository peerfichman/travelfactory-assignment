import { createVacationRequestHandler } from '../src/command-handlers/CreateVacationRequestHandler';
import { approveVacationRequestHandler } from '../src/command-handlers/ApproveVacationRequestHandler';
import { rejectVacationRequestHandler } from '../src/command-handlers/RejectVacationRequestHandler';
import { CreateVacationRequestCommand } from '../src/commands/CreateVacationRequestCommand';
import { ApproveVacationRequestCommand } from '../src/commands/ApproveVacationRequestCommand';
import { RejectVacationRequestCommand } from '../src/commands/RejectVacationRequestCommand';
import { VacationRequestRepository } from '../src/repositories/VacationRequestRepository';
import { RequestStatus } from '../src/entities/VacationRequest';

jest.mock('../src/repositories/VacationRequestRepository', () => ({
  VacationRequestRepository: {
    findOverlapping: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../src/infrastructure/EventBus', () => ({
  eventBus: { publish: jest.fn() },
}));

const repo = VacationRequestRepository as jest.Mocked<typeof VacationRequestRepository>;

const FUTURE_START = '2099-01-10';
const FUTURE_END = '2099-01-20';
const USER_ID = 'user-1';
const REQUEST_ID = 'req-1';

describe('CreateVacationRequestHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 400 when start date is in the past', async () => {
    const cmd = new CreateVacationRequestCommand(USER_ID, '2000-01-01', '2000-01-10', null);
    await expect(createVacationRequestHandler(cmd)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('past'),
    });
  });

  it('throws 400 when end date is not after start date', async () => {
    const cmd = new CreateVacationRequestCommand(USER_ID, FUTURE_START, FUTURE_START, null);
    await expect(createVacationRequestHandler(cmd)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 on overlapping requests', async () => {
    repo.findOverlapping.mockResolvedValueOnce([{ id: 'existing' } as never]);
    const cmd = new CreateVacationRequestCommand(USER_ID, FUTURE_START, FUTURE_END, null);
    await expect(createVacationRequestHandler(cmd)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates request and returns id on happy path', async () => {
    repo.findOverlapping.mockResolvedValueOnce([]);
    repo.create.mockReturnValueOnce({ id: REQUEST_ID } as never);
    repo.save.mockResolvedValueOnce({
      id: REQUEST_ID,
      user_id: USER_ID,
      start_date: FUTURE_START,
      end_date: FUTURE_END,
    } as never);

    const cmd = new CreateVacationRequestCommand(USER_ID, FUTURE_START, FUTURE_END, 'holiday');
    const result = await createVacationRequestHandler(cmd);
    expect(result).toEqual({ id: REQUEST_ID });
  });
});

describe('ApproveVacationRequestHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 404 when request not found', async () => {
    repo.findOne.mockResolvedValueOnce(null);
    const cmd = new ApproveVacationRequestCommand(REQUEST_ID, 'validator-1');
    await expect(approveVacationRequestHandler(cmd)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 409 when already approved', async () => {
    repo.findOne.mockResolvedValueOnce({ status: RequestStatus.APPROVED } as never);
    const cmd = new ApproveVacationRequestCommand(REQUEST_ID, 'validator-1');
    await expect(approveVacationRequestHandler(cmd)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('approves a pending request', async () => {
    const mockReq = { id: REQUEST_ID, user_id: USER_ID, status: RequestStatus.PENDING };
    repo.findOne.mockResolvedValueOnce(mockReq as never);
    repo.save.mockResolvedValueOnce({ ...mockReq, status: RequestStatus.APPROVED } as never);

    await expect(
      approveVacationRequestHandler(new ApproveVacationRequestCommand(REQUEST_ID, 'v-1')),
    ).resolves.toBeUndefined();
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: RequestStatus.APPROVED }),
    );
  });
});

describe('RejectVacationRequestHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 400 when comments are empty', async () => {
    const cmd = new RejectVacationRequestCommand(REQUEST_ID, 'v-1', '');
    await expect(rejectVacationRequestHandler(cmd)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 409 when trying to reject an approved request', async () => {
    repo.findOne.mockResolvedValueOnce({ status: RequestStatus.APPROVED } as never);
    const cmd = new RejectVacationRequestCommand(REQUEST_ID, 'v-1', 'Some comment');
    await expect(rejectVacationRequestHandler(cmd)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects a pending request with a comment', async () => {
    const mockReq = { id: REQUEST_ID, user_id: USER_ID, status: RequestStatus.PENDING };
    repo.findOne.mockResolvedValueOnce(mockReq as never);
    repo.save.mockResolvedValueOnce({
      ...mockReq,
      status: RequestStatus.REJECTED,
      comments: 'reason',
    } as never);

    await expect(
      rejectVacationRequestHandler(new RejectVacationRequestCommand(REQUEST_ID, 'v-1', 'reason')),
    ).resolves.toBeUndefined();
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: RequestStatus.REJECTED, comments: 'reason' }),
    );
  });
});
