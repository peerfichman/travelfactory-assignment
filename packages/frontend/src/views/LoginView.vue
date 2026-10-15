<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">Vacation Manager</h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="alice@example.com"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p v-if="errorMsg" class="text-red-600 text-sm">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <div class="mt-6 text-xs text-gray-400 text-center space-y-1">
        <p>Demo — Requester: alice@example.com / password123</p>
        <p>Demo — Validator: carol@example.com / password123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const auth = useAuthStore();
const router = useRouter();

async function handleLogin() {
  errorMsg.value = '';
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    await router.push(auth.isValidator ? '/validator' : '/requester');
  } catch (e: unknown) {
    errorMsg.value =
      (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      'Login failed. Please check your credentials.';
  } finally {
    loading.value = false;
  }
}
</script>
