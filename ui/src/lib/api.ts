import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    // Skip adding auth token for login/register endpoints
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register') ||
                          config.url?.includes('/auth/forgot-password') ||
                          config.url?.includes('/auth/reset-password');
    
    if (!isAuthEndpoint && typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on login page or if it's a login request
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/auth/login';
      
      if (!isLoginRequest && !isOnLoginPage) {
        // Clear auth and redirect to login only if not already there
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('tumanowAuth');
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const AuthAPI = {
  login: (phoneOrEmail: string, password: string) =>
    api.post('/auth/login', { phoneOrEmail, password }).then((r) => r.data),
  
  register: (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    customerType?: 'INDIVIDUAL' | 'BUSINESS';
  }) =>
    api.post('/auth/register', data).then((r) => r.data),
  
  profile: () =>
    api.get('/auth/profile').then((r) => r.data),
};

// TODO: Add more API modules as we build them
// OperatorsAPI, OrdersAPI, VehiclesAPI, DriversAPI, PaymentsAPI, etc.

