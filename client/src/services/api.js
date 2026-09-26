import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stocksense_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/signup')) {
      localStorage.removeItem('stocksense_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expired=1');
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error) {
  if (!error.response) return 'Unable to reach the server. Check your connection and try again.';
  return error.response.data?.message || 'Something went wrong. Please try again.';
}

export default api;
