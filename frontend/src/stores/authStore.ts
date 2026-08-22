import { create } from 'zustand';
import { User, ApiResponse } from '../types';
import { apiClient } from '../lib/api-client';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  fetchCurrentUser: () => Promise<User | null>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isLoading: false,
  isInitialized: false,

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({ accessToken, refreshToken, user, isInitialized: true });
    connectSocket(accessToken);
  },

  logout: async () => {
    try {
      const refreshToken = get().refreshToken;
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      disconnectSocket();
      set({ user: null, accessToken: null, refreshToken: null, isInitialized: true });
      window.location.href = '/login';
    }
  },

  updateUser: (data) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...data } });
    }
  },

  fetchCurrentUser: async () => {
    try {
      set({ isLoading: true });
      const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
      set({ user: data.data, isInitialized: true });
      if (get().accessToken) {
        connectSocket(get().accessToken as string);
      }
      return data.data;
    } catch {
      set({ user: null, isInitialized: true });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isInitialized: true, user: null });
      return;
    }
    await get().fetchCurrentUser();
  },
}));
