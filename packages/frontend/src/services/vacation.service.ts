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
    status?: RequestStatus;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<VacationRequest>> {
    const { data } = await api.get<PaginatedResponse<VacationRequest>>('/vacation-requests', {
      params,
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

  async approve(id: string): Promise<void> {
    await api.patch(`/vacation-requests/${id}/approve`);
  },

  async reject(id: string, comments: string): Promise<void> {
    await api.patch(`/vacation-requests/${id}/reject`, { comments });
  },
};
