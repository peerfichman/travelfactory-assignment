<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 class="text-lg font-semibold text-gray-700 mb-4">New Vacation Request</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            v-model="startDate"
            type="date"
            required
            :min="today"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
          <input
            v-model="endDate"
            type="date"
            required
            :min="startDate || today"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
        <textarea
          v-model="reason"
          rows="2"
          placeholder="e.g. Family vacation"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <p v-if="errorMsg" class="text-red-600 text-sm">{{ errorMsg }}</p>
      <p v-if="successMsg" class="text-green-600 text-sm">{{ successMsg }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {{ loading ? 'Submitting…' : 'Submit Request' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useVacationStore } from '../stores/vacationRequests';

const emit = defineEmits<{ submitted: [] }>();

const store = useVacationStore();
const startDate = ref('');
const endDate = ref('');
const reason = ref('');
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const today = new Date().toISOString().split('T')[0];

async function handleSubmit() {
  errorMsg.value = '';
  successMsg.value = '';

  if (endDate.value <= startDate.value) {
    errorMsg.value = 'End date must be after start date.';
    return;
  }

  loading.value = true;
  try {
    await store.submitRequest({
      startDate: startDate.value,
      endDate: endDate.value,
      reason: reason.value || undefined,
    });
    successMsg.value = 'Request submitted successfully!';
    startDate.value = '';
    endDate.value = '';
    reason.value = '';
    emit('submitted');
  } catch (e: unknown) {
    errorMsg.value =
      (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      'Failed to submit request.';
  } finally {
    loading.value = false;
  }
}
</script>
