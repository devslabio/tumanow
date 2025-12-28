'use client';

import { create } from 'zustand';
import { AuthAPI } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  operator_id?: string | null;
  roles?: Array<{ id: string; code: string; name: string }>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (phoneOrEmail: string, password: string) => Promise<{ user: User; token: string } | { error: string }>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') || null : null,
  loading: false,
  error: null,

  login: async (phoneOrEmail: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await AuthAPI.login(phoneOrEmail, password);
      
      // Backend returns: { user: {...}, accessToken: '...', refreshToken: '...' }
      const token = response.accessToken;
      let user = response.user;

      if (!token) {
        throw new Error('Invalid response from server: No token received');
      }

      if (!user) {
        throw new Error('Invalid response from server: No user data received');
      }

      // Ensure roles are in the correct format
      if (user.user_roles && !user.roles) {
        user.roles = user.user_roles.map((ur: any) => ur.role || ur);
      }

      // Store token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
        sessionStorage.setItem('tumanowAuth', JSON.stringify(user));
      }

      // Update store
      set({ user, token, loading: false, error: null });
      
      return { user, token };
    } catch (error: any) {
      let errorMessage = 'Login failed';
      
      if (error?.response?.data) {
        errorMessage = error.response.data.message 
          || error.response.data.error 
          || error.response.data.error?.message
          || (typeof error.response.data === 'string' ? error.response.data : null)
          || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      if (error?.response?.status === 401) {
        if (!errorMessage || errorMessage === 'Login failed') {
          errorMessage = 'Invalid phone/email or password. Please check your credentials and try again.';
        }
      }
      
      set({ error: errorMessage, loading: false });
      return { error: errorMessage };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('tumanowAuth');
    }
    set({ user: null, token: null, error: null });
  },

  loadUser: async () => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    if (!token) {
      set({ user: null, loading: false });
      return;
    }

    if (!get().token && token) {
      set({ token });
    }

    set({ loading: true, error: null });
    try {
      const response = await AuthAPI.profile();
      
      let user = null;
      if (response) {
        if (response.user) {
          user = response.user;
        } else if (response.data?.user) {
          user = response.data.user;
        } else if (response.data && typeof response.data === 'object' && response.data.id) {
          user = response.data;
        } else if (response.id) {
          user = response;
        }
      }
      
      if (user && user.id) {
        // Transform user_roles to roles format for frontend
        const transformedUser = {
          ...user,
          roles: user.user_roles?.map((ur: any) => ur.role) || [],
        };
        set({ user: transformedUser, loading: false, error: null });
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tumanowAuth', JSON.stringify(transformedUser));
        }
      } else {
        set({ error: 'Invalid user data', loading: false });
      }
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        get().logout();
      } else {
        set({ error: error?.message || 'Failed to load user profile', loading: false });
      }
    }
  },

  setUser: (user: User | null) => set({ user }),
  setToken: (token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
    set({ token });
  },
}));

