import { create } from 'zustand';
import { apiClient } from '../lib/api-client';
import { ApiResponse, AdminAnalyticsOverview } from '../types';

interface SystemHealthState {
  status: 'ok' | 'degraded' | 'error';
  dbStatus: string;
  monadRpcStatus: string;
  timestamp: string;
  blockHeight?: number;
  isLoading: boolean;
}

interface AdminState {
  pendingKycCount: number;
  openDisputesCount: number;
  pendingPayoutsCount: number;
  systemHealth: SystemHealthState;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  fetchDashboardMetrics: () => Promise<AdminAnalyticsOverview | null>;
  fetchSystemHealth: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  pendingKycCount: 0,
  openDisputesCount: 0,
  pendingPayoutsCount: 0,
  globalSearchQuery: '',
  systemHealth: {
    status: 'ok',
    dbStatus: 'ok',
    monadRpcStatus: 'ok',
    timestamp: new Date().toISOString(),
    isLoading: false,
  },

  setGlobalSearchQuery: (query: string) => set({ globalSearchQuery: query }),

  fetchDashboardMetrics: async () => {
    try {
      const { data } = await apiClient.get<ApiResponse<AdminAnalyticsOverview>>('/admin/analytics/overview');
      if (data.success && data.data?.metrics) {
        set({
          pendingKycCount: data.data.metrics.pendingKycCount,
          openDisputesCount: data.data.metrics.openDisputesCount,
          pendingPayoutsCount: data.data.metrics.pendingPayoutsCount,
        });
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchSystemHealth: async () => {
    set((state) => ({ systemHealth: { ...state.systemHealth, isLoading: true } }));
    try {
      const { data } = await apiClient.get<any>('/health');
      set({
        systemHealth: {
          status: data.status || 'ok',
          dbStatus: data.checks?.database || 'ok',
          monadRpcStatus: data.checks?.monadRpc || 'ok',
          timestamp: data.timestamp || new Date().toISOString(),
          isLoading: false,
        },
      });
    } catch {
      set({
        systemHealth: {
          status: 'error',
          dbStatus: 'unreachable',
          monadRpcStatus: 'unreachable',
          timestamp: new Date().toISOString(),
          isLoading: false,
        },
      });
    }
  },
}));
