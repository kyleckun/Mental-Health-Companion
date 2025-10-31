import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';

// Use empty string to make requests relative to current origin
// Vite proxy will forward /api/* requests to backend
const API_BASE_URL = '';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - token might be expired
      console.error('[API Client] Unauthorized request - redirecting to login');
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { apiClient };
