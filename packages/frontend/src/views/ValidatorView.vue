<template>
  <div class="max-w-6xl mx-auto p-6">
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Validator Dashboard</h1>
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

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6">
      <CheckboxDropdown
        v-model="filterStatuses"
        :options="statusOptions"
        placeholder="All statuses"
        @update:modelValue="applyFilters"
      />
      <CheckboxDropdown
        v-model="filterUserIds"
        :options="userOptions"
        placeholder="All employees"
        @update:modelValue="applyFilters"
      />
    </div>

    <div v-if="store.loading" class="text-gray-400 text-sm">Loading…</div>
    <div v-else-if="store.error" class="text-red-500 text-sm">{{ store.error }}</div>
    <template v-else>
      <RequestTable :requests="store.requests" @approve="handleApprove" @reject="openRejectModal" />

      <!-- Pagination -->
      <div class="flex justify-between items-center mt-4 text-sm text-gray-600">
        <span>{{ store.total }} total requests</span>
        <div class="flex gap-2">
          <button
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
            class="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
          >
            Prev
          </button>
          <span class="px-3 py-1">Page {{ currentPage }} / {{ totalPages }}</span>
          <button
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
            class="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </template>

    <RejectModal
      v-if="rejectTarget"
      :request-id="rejectTarget"
      @confirm="handleReject"
      @cancel="rejectTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useVacationStore } from '../stores/vacationRequests';
import { userService, type User } from '../services/user.service';
import RequestTable from '../components/RequestTable.vue';
import RejectModal from '../components/RejectModal.vue';
import CheckboxDropdown from '../components/CheckboxDropdown.vue';

const auth = useAuthStore();
const store = useVacationStore();
const router = useRouter();

const ALL_STATUSES = ['Pending', 'Approved', 'Rejected'];
const statusOptions = ALL_STATUSES.map((s) => ({ label: s, value: s }));

const filterStatuses = ref<string[]>([...ALL_STATUSES]);
const filterUserIds = ref<string[]>([]);
const users = ref<User[]>([]);
const currentPage = ref(1);
const pageLimit = 10;

const userOptions = computed(() => users.value.map((u) => ({ label: u.name, value: u.id })));
const totalPages = computed(() => Math.max(1, Math.ceil(store.total / pageLimit)));

const rejectTarget = ref<string | null>(null);

function applyFilters() {
  currentPage.value = 1;
  loadRequests();
}

function goToPage(p: number) {
  currentPage.value = p;
  loadRequests();
}

function loadRequests() {
  const allStatusesSelected = filterStatuses.value.length === ALL_STATUSES.length;
  const allUsersSelected = filterUserIds.value.length === users.value.length;
  store.fetchRequests({
    statuses: allStatusesSelected ? undefined : filterStatuses.value,
    userIds: allUsersSelected ? undefined : filterUserIds.value,
    page: currentPage.value,
    limit: pageLimit,
  });
}

async function handleApprove(id: string) {
  await store.approveRequest(id);
}

function openRejectModal(id: string) {
  rejectTarget.value = id;
}

async function handleReject(id: string, comments: string) {
  await store.rejectRequest(id, comments);
  rejectTarget.value = null;
}

onMounted(async () => {
  users.value = await userService.list();
  filterUserIds.value = users.value.map((u) => u.id);
  loadRequests();
});
</script>
