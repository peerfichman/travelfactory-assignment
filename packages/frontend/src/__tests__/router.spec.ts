import { describe, it, expect, beforeEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../stores/auth';

// Minimal route definitions for guard testing
const routes = [
  { path: '/login', name: 'Login', component: { template: '<div/>' }, meta: { public: true } },
  {
    path: '/requester',
    name: 'Requester',
    component: { template: '<div/>' },
    meta: { role: 'Requester' },
  },
  {
    path: '/validator',
    name: 'Validator',
    component: { template: '<div/>' },
    meta: { role: 'Validator' },
  },
];

describe('Router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('redirects unauthenticated user to /login', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    router.beforeEach((to, _from, next) => {
      const auth = useAuthStore();
      if (to.meta.public) return next();
      if (!auth.isAuthenticated) return next('/login');
      next();
    });
    await router.push('/requester');
    expect(router.currentRoute.value.path).toBe('/login');
  });
});
