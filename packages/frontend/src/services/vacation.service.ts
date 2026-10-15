import { api } from './api';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface VacationRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: RequestStatus;
  comments: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; email: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const vacationService = {
  async list(params?: {
    statuses?: string[];
    userIds?: string[];
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<VacationRequest>> {
    const { statuses, userIds, ...rest } = params ?? {};
    const query: Record<string, unknown> = { ...rest };
    if (statuses && statuses.length > 0) query['status'] = statuses.join(',');
    if (userIds && userIds.length > 0) query['userId'] = userIds.join(',');
    const { data } = await api.get<PaginatedResponse<VacationRequest>>('/vacation-requests', {
      params: query,
    });
    return data;
  },

  async create(payload: {
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<{ id: string }> {
    const { data } = await api.post<{ id: string }>('/vacation-requests', payload);
    return data;
  },

  async listTeam(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<VacationRequest>> {
    const { data } = await api.get<PaginatedResponse<VacationRequest>>('/vacation-requests/team', {
      params,
    });
    return data;
  },

  async approve(id: string): Promise<void> {
    await api.patch(`/vacation-requests/${id}/approve`);
  },

  async reject(id: string, comments: string): Promise<void> {
    await api.patch(`/vacation-requests/${id}/reject`, { comments });
  },
};
