<template>
  <span
    :class="badgeClass"
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
  >
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RequestStatus } from '../services/vacation.service';

const props = defineProps<{ status: RequestStatus }>();

const badgeClass = computed(() => ({
  'bg-yellow-100 text-yellow-800': props.status === 'Pending',
  'bg-green-100 text-green-800': props.status === 'Approved',
  'bg-red-100 text-red-800': props.status === 'Rejected',
}));
</script>
