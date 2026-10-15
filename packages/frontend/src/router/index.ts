import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/requester',
    name: 'Requester',
    component: () => import('../views/RequesterView.vue'),
    meta: { role: 'Requester' },
  },
  {
    path: '/validator',
    name: 'Validator',
    component: () => import('../views/ValidatorView.vue'),
    meta: { role: 'Validator' },
  },
  {
    path: '/',
    redirect: () => {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) return '/login';
      return auth.isValidator ? '/validator' : '/requester';
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  auth.restoreSession();

  if (to.meta.public) return next();

  if (!auth.isAuthenticated) return next('/login');

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return next(auth.isValidator ? '/validator' : '/requester');
  }

  next();
});
