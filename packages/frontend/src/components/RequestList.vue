<template>
  <ul class="space-y-3">
    <li
      v-for="req in requests"
      :key="req.id"
      class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
    >
      <div class="flex justify-between items-start">
        <div>
          <p class="text-sm font-medium text-gray-800">
            {{ formatDate(req.start_date) }} → {{ formatDate(req.end_date) }}
          </p>
          <p v-if="req.reason" class="text-sm text-gray-500 mt-1">{{ req.reason }}</p>
          <p v-if="req.comments" class="text-sm text-red-500 mt-1">
            <span class="font-medium">Comment:</span> {{ req.comments }}
          </p>
        </div>
        <StatusBadge :status="req.status" />
      </div>
      <p class="text-xs text-gray-400 mt-2">Submitted {{ formatDateTime(req.created_at) }}</p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { VacationRequest } from '../services/vacation.service';
import StatusBadge from './StatusBadge.vue';

defineProps<{ requests: VacationRequest[] }>();

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
</script>
