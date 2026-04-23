import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isNetworkErrorToastShown = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      if (window.location.pathname !== '/login') {
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } else if (!error.response) {
      if (!isNetworkErrorToastShown) {
        isNetworkErrorToastShown = true;
        toast.error('Network Connection Issue: Please check your internet connection', {
          onAutoClose: () => { isNetworkErrorToastShown = false; },
          onDismiss: () => { isNetworkErrorToastShown = false; }
        });
      }
      error.message = 'Network Connection Issue: Please check your internet connection';
    } else {
      // Normalize error message for UI
      const message = error.response.data?.message || error.message || 'An unexpected error occurred';
      error.message = message;
    }
    
    return Promise.reject(error);
  }
);

export default api;
