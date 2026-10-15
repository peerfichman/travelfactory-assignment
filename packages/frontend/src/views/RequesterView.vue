<template>
  <div class="max-w-4xl mx-auto p-6">
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">My Vacation Requests</h1>
        <p class="text-gray-500 text-sm mt-1">Welcome, {{ auth.user?.name }}</p>
      </div>
      <button
        @click="
          auth.logout();
          router.push('/login');
        "
        class="text-sm text-gray-600 hover:text-red-600 transition"
      >
        Sign out
      </button>
    </header>

    <VacationRequestForm @submitted="store.fetchRequests()" />

    <section class="mt-8">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">Your Requests</h2>

      <div v-if="store.loading" class="text-gray-400 text-sm">Loading…</div>
      <div v-else-if="store.error" class="text-red-500 text-sm">{{ store.error }}</div>
      <div v-else-if="store.requests.length === 0" class="text-gray-400 text-sm">
        No requests yet.
      </div>

      <RequestList v-else :requests="store.requests" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useVacationStore } from '../stores/vacationRequests';
import VacationRequestForm from '../components/VacationRequestForm.vue';
import RequestList from '../components/RequestList.vue';

const auth = useAuthStore();
const store = useVacationStore();
const router = useRouter();

onMounted(() => store.fetchRequests());
</script>
