import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/auth.service';

export type UserRole = 'Requester' | 'Validator';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isValidator = computed(() => user.value?.role === 'Validator');
  const isRequester = computed(() => user.value?.role === 'Requester');

  async function login(email: string, password: string) {
    const res = await authService.login(email, password);
    token.value = res.token;
    user.value = res.user;
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function restoreSession() {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token.value) {
      user.value = JSON.parse(storedUser) as AuthUser;
    }
  }

  return { user, token, isAuthenticated, isValidator, isRequester, login, logout, restoreSession };
});
