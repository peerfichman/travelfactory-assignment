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

    <!-- Team Schedule ─────────────────────────────────────────────── -->
    <section class="mt-12">
      <h2 class="text-lg font-semibold text-gray-700 mb-1">Team Schedule</h2>
      <p class="text-sm text-gray-400 mb-4">Approved vacations across the team</p>

      <div v-if="teamLoading" class="text-gray-400 text-sm">Loading…</div>
      <div v-else-if="teamError" class="text-red-500 text-sm">{{ teamError }}</div>
      <template v-else>
        <TeamScheduleTable :requests="teamRequests" />
        <div class="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>{{ teamTotal }} approved</span>
          <div class="flex gap-2">
            <button
              :disabled="teamPage <= 1"
              @click="goTeamPage(teamPage - 1)"
              class="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
              Prev
            </button>
            <span class="px-3 py-1">Page {{ teamPage }} / {{ teamTotalPages }}</span>
            <button
              :disabled="teamPage >= teamTotalPages"
              @click="goTeamPage(teamPage + 1)"
              class="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useVacationStore } from '../stores/vacationRequests';
import { vacationService, type VacationRequest } from '../services/vacation.service';
import VacationRequestForm from '../components/VacationRequestForm.vue';
import RequestList from '../components/RequestList.vue';
import TeamScheduleTable from '../components/TeamScheduleTable.vue';

const auth = useAuthStore();
const store = useVacationStore();
const router = useRouter();

const teamRequests = ref<VacationRequest[]>([]);
const teamTotal = ref(0);
const teamPage = ref(1);
const teamLimit = 10;
const teamLoading = ref(false);
const teamError = ref<string | null>(null);

const teamTotalPages = computed(() => Math.max(1, Math.ceil(teamTotal.value / teamLimit)));

async function fetchTeam() {
  teamLoading.value = true;
  teamError.value = null;
  try {
    const res = await vacationService.listTeam({ page: teamPage.value, limit: teamLimit });
    teamRequests.value = res.data;
    teamTotal.value = res.total;
  } catch {
    teamError.value = 'Failed to load team schedule';
  } finally {
    teamLoading.value = false;
  }
}

function goTeamPage(p: number) {
  teamPage.value = p;
  fetchTeam();
}

onMounted(() => {
  store.fetchRequests();
  fetchTeam();
});
</script>
