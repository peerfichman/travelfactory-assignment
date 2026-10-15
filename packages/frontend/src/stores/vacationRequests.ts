import { defineStore } from 'pinia';
import { ref } from 'vue';
import { vacationService, type VacationRequest } from '../services/vacation.service';

export const useVacationStore = defineStore('vacationRequests', () => {
  const requests = ref<VacationRequest[]>([]);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(20);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRequests(params?: {
    statuses?: string[];
    userIds?: string[];
    page?: number;
    limit?: number;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const res = await vacationService.list(params);
      requests.value = res.data;
      total.value = res.total;
      page.value = res.page;
      limit.value = res.limit;
    } catch (e: unknown) {
      error.value =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to load requests';
    } finally {
      loading.value = false;
    }
  }

  async function submitRequest(payload: { startDate: string; endDate: string; reason?: string }) {
    const result = await vacationService.create(payload);
    await fetchRequests();
    return result;
  }

  async function approveRequest(id: string) {
    await vacationService.approve(id);
    await fetchRequests({ page: page.value, limit: limit.value });
  }

  async function rejectRequest(id: string, comments: string) {
    await vacationService.reject(id, comments);
    await fetchRequests({ page: page.value, limit: limit.value });
  }

  return {
    requests,
    total,
    page,
    limit,
    loading,
    error,
    fetchRequests,
    submitRequest,
    approveRequest,
    rejectRequest,
  };
});
