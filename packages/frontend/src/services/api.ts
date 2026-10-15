import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (import.meta.env.DEV) {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Log responses in dev
api.interceptors.response.use(
  (res) => {
    if (import.meta.env.DEV) {
      console.debug(`[API] ${res.status} ${res.config.url}`);
    }
    return res;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(`[API] Error ${error.response?.status}`, error.response?.data);
    }
    return Promise.reject(error);
  },
);
