import { create } from 'zustand';
import { Storage } from '../lib/storage';
import { UserSession, UserRole } from '../types/api-contracts';
import { AuthService, LoginPayload, RegisterPayload, VerifyOtpPayload } from '../services/auth.service';
import { BiometricService } from '../services/biometric.service';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../lib/api-client';

interface AuthState {
  user: UserSession | null;
  activeRole: UserRole;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  isAppLocked: boolean;
  
  // Actions
  login: (payload: LoginPayload) => Promise<UserSession>;
  socialLogin: (payload: { provider: 'GOOGLE' | 'APPLE'; idToken: string; role?: UserRole }) => Promise<UserSession>;
  register: (payload: RegisterPayload) => Promise<{ user: UserSession; requiresOtp?: boolean }>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<UserSession>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserSession>) => void;
  setActiveRole: (role: UserRole) => void;
  lockApp: () => void;
  unlockWithBiometrics: () => Promise<boolean>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  activeRole: 'CLIENT',
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  isAppLocked: false,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true });
    try {
      const data = await AuthService.login(payload);
      set({
        user: data.user,
        accessToken: data.accessToken,
        activeRole: data.user.role || 'CLIENT',
        isAuthenticated: true,
        isAppLocked: false,
      });
      return data.user;
    } finally {
      set({ isLoading: false });
    }
  },

  socialLogin: async (payload) => {
    set({ isLoading: true });
    try {
      const data = await AuthService.socialLogin({
        provider: payload.provider,
        idToken: payload.idToken,
        role: payload.role === 'ARTISAN' ? 'ARTISAN' : 'CLIENT',
      });
      set({
        user: data.user,
        accessToken: data.accessToken,
        activeRole: data.user.role || payload.role || 'CLIENT',
        isAuthenticated: true,
        isAppLocked: false,
      });
      return data.user;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true });
    try {
      const result = await AuthService.register(payload);
      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    set({ isLoading: true });
    try {
      const data = await AuthService.verifyOtp(payload);
      set({
        user: data.user,
        accessToken: data.accessToken,
        activeRole: data.user.role || 'CLIENT',
        isAuthenticated: true,
        isAppLocked: false,
      });
      return data.user;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await AuthService.logout();
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        isAppLocked: false,
      });
    }
  },

  updateUser: (userData: Partial<UserSession>) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...userData } });
    }
  },

  setActiveRole: (role: UserRole) => {
    set({ activeRole: role });
  },

  lockApp: () => {
    if (get().isAuthenticated) {
      set({ isAppLocked: true });
    }
  },

  unlockWithBiometrics: async () => {
    const success = await BiometricService.authenticate('Unlock Artifix to continue');
    if (success) {
      set({ isAppLocked: false });
      return true;
    }
    return false;
  },

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await Storage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        set({ accessToken: token });
        const user = await AuthService.getMe();
        if (user) {
          set({
            user,
            activeRole: user.role || 'CLIENT',
            isAuthenticated: true,
          });
        }
      }
    } catch (err) {
      console.warn('[AuthStore] Session initialization failed:', err);
      try {
        await Storage.removeItem(ACCESS_TOKEN_KEY);
        await Storage.removeItem(REFRESH_TOKEN_KEY);
      } catch {
        // ignore
      }
      set({ user: null, accessToken: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },
}));

