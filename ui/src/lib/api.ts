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
                          config.url?.includes('/auth/reset-password') ||
                          config.url?.includes('/auth/refresh');
    
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
      const isOnLoginPage = typeof window !== 'undefined' && (window.location.pathname === '/auth/login' || window.location.pathname.startsWith('/auth/'));
      
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
  
  forgotPassword: (phoneOrEmail: string) =>
    api.post('/auth/forgot-password', { phoneOrEmail }).then((r) => r.data),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }).then((r) => r.data),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
};

// Dashboard API
export const DashboardAPI = {
  get: (params?: {
    start_date?: string;
    end_date?: string;
    operator_id?: string;
  }) =>
    api.get('/dashboard', { params }).then((r) => r.data),
};

// Orders API
export const OrdersAPI = {
  create: (data: any) =>
    api.post('/orders', data).then((r) => r.data),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    operator_id?: string;
    customer_id?: string;
    search?: string;
  }) =>
    api.get('/orders', { params }).then((r) => r.data),
  
  getById: (id: string) =>
    api.get(`/orders/${id}`).then((r) => r.data),
  
  updateStatus: (id: string, status: string, rejection_reason?: string) =>
    api.patch(`/orders/${id}/status`, { status, rejection_reason }).then((r) => r.data),
  
  delete: (id: string) =>
    api.delete(`/orders/${id}`).then((r) => r.data),
};

// Operators API
export const OperatorsAPI = {
  create: (data: {
    code: string;
    name: string;
    email?: string;
    phone?: string;
    status?: string;
  }) =>
    api.post('/operators', data).then((r) => r.data),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) =>
    api.get('/operators', { params }).then((r) => r.data),
  
  getById: (id: string) =>
    api.get(`/operators/${id}`).then((r) => r.data),
  
  update: (id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
  }) =>
    api.patch(`/operators/${id}`, data).then((r) => r.data),
  
  updateConfig: (id: string, data: any) =>
    api.patch(`/operators/${id}/config`, data).then((r) => r.data),
  
  delete: (id: string) =>
    api.delete(`/operators/${id}`).then((r) => r.data),
};

// Vehicles API
export const VehiclesAPI = {
  create: (data: {
    operator_id: string;
    plate_number: string;
    make: string;
    model: string;
    vehicle_type: string;
    capacity_kg?: number;
    current_location_lat?: number;
    current_location_lng?: number;
    year?: number;
    color?: string;
    status?: string;
  }) =>
    api.post('/vehicles', data).then((r) => r.data),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    operator_id?: string;
    vehicle_type?: string;
    search?: string;
  }) =>
    api.get('/vehicles', { params }).then((r) => r.data),
  
  getById: (id: string) =>
    api.get(`/vehicles/${id}`).then((r) => r.data),
  
  update: (id: string, data: {
    plate_number?: string;
    make?: string;
    model?: string;
    vehicle_type?: string;
    capacity_kg?: number;
    current_location_lat?: number;
    current_location_lng?: number;
    year?: number;
    color?: string;
    status?: string;
  }) =>
    api.patch(`/vehicles/${id}`, data).then((r) => r.data),
  
  delete: (id: string) =>
    api.delete(`/vehicles/${id}`).then((r) => r.data),
};

// Drivers API
export const DriversAPI = {
  create: (data: {
    operator_id: string;
    name: string;
    phone: string;
    email?: string;
    license_number?: string;
    status?: string;
    user_id?: string;
  }) =>
    api.post('/drivers', data).then((r) => r.data),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    operator_id?: string;
    search?: string;
  }) =>
    api.get('/drivers', { params }).then((r) => r.data),
  
  getById: (id: string) =>
    api.get(`/drivers/${id}`).then((r) => r.data),
  
  update: (id: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    license_number?: string;
    status?: string;
    user_id?: string;
  }) =>
    api.patch(`/drivers/${id}`, data).then((r) => r.data),
  
  delete: (id: string) =>
    api.delete(`/drivers/${id}`).then((r) => r.data),
};

// Order Assignments API
export const OrderAssignmentsAPI = {
  create: (data: {
    order_id: string;
    vehicle_id: string;
    driver_id?: string;
  }) =>
    api.post('/order-assignments', data).then((r) => r.data),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    order_id?: string;
    vehicle_id?: string;
    driver_id?: string;
  }) =>
    api.get('/order-assignments', { params }).then((r) => r.data),
  
  getById: (id: string) =>
    api.get(`/order-assignments/${id}`).then((r) => r.data),
  
  update: (id: string, data: {
    vehicle_id?: string;
    driver_id?: string;
  }) =>
    api.patch(`/order-assignments/${id}`, data).then((r) => r.data),
  
  delete: (id: string) =>
    api.delete(`/order-assignments/${id}`).then((r) => r.data),
};

// Payments API
export const PaymentsAPI = {
  create: (data: {
    order_id: string;
    amount: number;
    method: 'MOBILE_MONEY' | 'CARD' | 'COD' | 'CORPORATE';
    transaction_id?: string;
    gateway_response?: string;
  }) =>
    api.post('/payments', data).then((r) => r.data),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    method?: 'MOBILE_MONEY' | 'CARD' | 'COD' | 'CORPORATE';
    order_id?: string;
    customer_id?: string;
    operator_id?: string;
    search?: string;
  }) =>
    api.get('/payments', { params }).then((r) => r.data),
  
  getById: (id: string) =>
    api.get(`/payments/${id}`).then((r) => r.data),
  
  update: (id: string, data: {
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    transaction_id?: string;
    gateway_response?: string;
  }) =>
    api.patch(`/payments/${id}`, data).then((r) => r.data),
  
  delete: (id: string) =>
    api.delete(`/payments/${id}`).then((r) => r.data),
};

// Tracking Events API
export const TrackingEventsAPI = {
  create: (data: {
    order_id: string;
    status: string;
    location_lat?: number;
    location_lng?: number;
    notes?: string;
  }) =>
    api.post('/tracking-events', data).then((r) => r.data),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    order_id?: string;
    status?: string;
  }) =>
    api.get('/tracking-events', { params }).then((r) => r.data),
  
  getByOrder: (orderId: string) =>
    api.get(`/tracking-events/order/${orderId}`).then((r) => r.data),
  
  getById: (id: string) =>
    api.get(`/tracking-events/${id}`).then((r) => r.data),
  
  delete: (id: string) =>
    api.delete(`/tracking-events/${id}`).then((r) => r.data),
};

// Notifications API
export const NotificationsAPI = {
  create: (data: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: string;
    send_email?: boolean;
    send_sms?: boolean;
    send_push?: boolean;
    send_in_app?: boolean;
  }) =>
    api.post('/notifications', data).then((r) => r.data),
  
  getAll: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    read?: boolean;
    user_id?: string;
  }) =>
    api.get('/notifications', { params }).then((r) => r.data),
  
  getById: (id: string) =>
    api.get(`/notifications/${id}`).then((r) => r.data),
  
  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),
  
  markAllAsRead: () =>
    api.patch('/notifications/mark-all-read').then((r) => r.data),
  
  getUnreadCount: () =>
    api.get('/notifications/unread-count').then((r) => r.data),
  
  delete: (id: string) =>
    api.delete(`/notifications/${id}`).then((r) => r.data),
};

// TODO: Add more API modules as we build them

