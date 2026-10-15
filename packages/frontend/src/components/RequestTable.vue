<template>
  <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
    <table class="min-w-full bg-white text-sm">
      <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
        <tr>
          <th class="px-4 py-3 text-left">Employee</th>
          <th class="px-4 py-3 text-left">Start</th>
          <th class="px-4 py-3 text-left">End</th>
          <th class="px-4 py-3 text-left">Reason</th>
          <th class="px-4 py-3 text-left">Status</th>
          <th class="px-4 py-3 text-left">Comments</th>
          <th class="px-4 py-3 text-left">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="req in requests" :key="req.id" class="hover:bg-gray-50 transition">
          <td class="px-4 py-3">
            <p class="font-medium text-gray-800">{{ req.user?.name ?? '—' }}</p>
            <p class="text-gray-400 text-xs">{{ req.user?.email ?? '' }}</p>
          </td>
          <td class="px-4 py-3 text-gray-700">{{ formatDate(req.start_date) }}</td>
          <td class="px-4 py-3 text-gray-700">{{ formatDate(req.end_date) }}</td>
          <td class="px-4 py-3 text-gray-500">{{ req.reason ?? '—' }}</td>
          <td class="px-4 py-3"><StatusBadge :status="req.status" /></td>
          <td class="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
            {{ req.comments ?? '—' }}
          </td>
          <td class="px-4 py-3">
            <div v-if="req.status === 'Pending'" class="flex gap-2">
              <button
                @click="emit('approve', req.id)"
                class="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                @click="emit('reject', req.id)"
                class="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition"
              >
                Reject
              </button>
            </div>
            <span v-else class="text-gray-400 text-xs">—</span>
          </td>
        </tr>
        <tr v-if="requests.length === 0">
          <td colspan="7" class="px-4 py-6 text-center text-gray-400">No requests found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { VacationRequest } from '../services/vacation.service';
import StatusBadge from './StatusBadge.vue';

defineProps<{ requests: VacationRequest[] }>();
const emit = defineEmits<{
  approve: [id: string];
  reject: [id: string];
}>();

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
</script>
