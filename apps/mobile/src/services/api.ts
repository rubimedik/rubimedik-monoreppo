import axios from 'axios';
import { Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';
console.log('Connecting to API at:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh queue to prevent race conditions
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];
let isNetworkErrorAlertShown = false;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle Network Errors
    if (!error.response) {
      if (!isNetworkErrorAlertShown) {
        isNetworkErrorAlertShown = true;
        Alert.alert(
          'Network Error',
          'Please check your internet connection and try again.',
          [{ text: 'OK', onPress: () => { isNetworkErrorAlertShown = false; } }]
        );
      }
      error.message = 'Network connection issue. Please check your internet connection.';
      return Promise.reject(error);
    }

    // Don't try to refresh token for login, signup, or refresh requests
    const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                         originalRequest.url?.includes('/auth/signup') ||
                         originalRequest.url?.includes('/auth/google') ||
                         originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        useAuthStore.getState().setTokens(access_token, refreshToken);

        // Process all queued requests with the new token
        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Only show session expired if we were previously authenticated
        if (useAuthStore.getState().isAuthenticated) {
          Alert.alert('Session Expired', 'Your session has timed out. Please login again.');
          useAuthStore.getState().logout();
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error message for UI
    const message = error.response.data?.message || error.message || 'An unexpected error occurred';
    error.message = message;

    return Promise.reject(error);
  }
);
