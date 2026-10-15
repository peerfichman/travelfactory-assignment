<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Reject Request</h3>

      <label class="block text-sm font-medium text-gray-700 mb-2">
        Rejection Comment <span class="text-red-500">*</span>
      </label>
      <textarea
        v-model="comments"
        rows="3"
        placeholder="Explain why this request is rejected…"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      <p v-if="showError" class="text-red-500 text-xs mt-1">A comment is required.</p>

      <div class="flex justify-end gap-3 mt-5">
        <button
          @click="emit('cancel')"
          class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          @click="handleConfirm"
          :disabled="loading"
          class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
        >
          {{ loading ? 'Rejecting…' : 'Confirm Reject' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ requestId: string }>();
const emit = defineEmits<{
  confirm: [id: string, comments: string];
  cancel: [];
}>();

const comments = ref('');
const showError = ref(false);
const loading = ref(false);

async function handleConfirm() {
  if (!comments.value.trim()) {
    showError.value = true;
    return;
  }
  showError.value = false;
  loading.value = true;
  try {
    emit('confirm', props.requestId, comments.value.trim());
  } finally {
    loading.value = false;
  }
}
</script>
