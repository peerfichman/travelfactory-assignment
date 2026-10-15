import { setActivePinia, createPinia } from 'pinia';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useVacationStore } from '../../stores/vacationRequests';

vi.mock('../../services/vacation.service', () => ({
  vacationService: {
    list: vi.fn(),
    create: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  },
}));

const mockRequest = {
  id: 'r-1',
  user_id: 'u-1',
  start_date: '2027-07-01',
  end_date: '2027-07-07',
  reason: null,
  status: 'Pending' as const,
  comments: null,
  created_at: '2027-01-01T00:00:00Z',
  updated_at: '2027-01-01T00:00:00Z',
};

const mockListResponse = { data: [mockRequest], total: 1, page: 1, limit: 20 };

describe('vacationRequests store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchRequests populates requests, total, page, limit on success', async () => {
    const { vacationService } = await import('../../services/vacation.service');
    vi.mocked(vacationService.list).mockResolvedValue(mockListResponse);

    const store = useVacationStore();
    await store.fetchRequests();

    expect(store.requests).toEqual([mockRequest]);
    expect(store.total).toBe(1);
    expect(store.page).toBe(1);
    expect(store.limit).toBe(20);
    expect(store.error).toBeNull();
  });

  it('fetchRequests sets error message on failure', async () => {
    const { vacationService } = await import('../../services/vacation.service');
    vi.mocked(vacationService.list).mockRejectedValue({
      response: { data: { error: 'Unauthorized' } },
    });

    const store = useVacationStore();
    await store.fetchRequests();

    expect(store.error).toBe('Unauthorized');
    expect(store.requests).toHaveLength(0);
  });

  it('fetchRequests sets generic error when response has no message', async () => {
    const { vacationService } = await import('../../services/vacation.service');
    vi.mocked(vacationService.list).mockRejectedValue(new Error('Network error'));

    const store = useVacationStore();
    await store.fetchRequests();

    expect(store.error).toBe('Failed to load requests');
  });

  it('submitRequest calls service and re-fetches', async () => {
    const { vacationService } = await import('../../services/vacation.service');
    vi.mocked(vacationService.create).mockResolvedValue({ id: 'new-req' });
    vi.mocked(vacationService.list).mockResolvedValue(mockListResponse);

    const store = useVacationStore();
    await store.submitRequest({ startDate: '2027-08-01', endDate: '2027-08-10' });

    expect(vacationService.create).toHaveBeenCalledWith({
      startDate: '2027-08-01',
      endDate: '2027-08-10',
    });
    expect(vacationService.list).toHaveBeenCalled();
  });

  it('approveRequest calls service and re-fetches', async () => {
    const { vacationService } = await import('../../services/vacation.service');
    vi.mocked(vacationService.approve).mockResolvedValue(undefined);
    vi.mocked(vacationService.list).mockResolvedValue(mockListResponse);

    const store = useVacationStore();
    await store.approveRequest('req-5');

    expect(vacationService.approve).toHaveBeenCalledWith('req-5');
    expect(vacationService.list).toHaveBeenCalled();
  });

  it('rejectRequest calls service and re-fetches', async () => {
    const { vacationService } = await import('../../services/vacation.service');
    vi.mocked(vacationService.reject).mockResolvedValue(undefined);
    vi.mocked(vacationService.list).mockResolvedValue(mockListResponse);

    const store = useVacationStore();
    await store.rejectRequest('req-6', 'No budget');

    expect(vacationService.reject).toHaveBeenCalledWith('req-6', 'No budget');
    expect(vacationService.list).toHaveBeenCalled();
  });

  it('loading is true while fetching and false afterwards', async () => {
    const { vacationService } = await import('../../services/vacation.service');
    let resolveList!: (v: typeof mockListResponse) => void;
    vi.mocked(vacationService.list).mockReturnValue(
      new Promise((r) => {
        resolveList = r;
      }),
    );

    const store = useVacationStore();
    const fetchPromise = store.fetchRequests();
    expect(store.loading).toBe(true);

    resolveList(mockListResponse);
    await fetchPromise;
    expect(store.loading).toBe(false);
  });
});
