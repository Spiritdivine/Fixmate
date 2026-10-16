import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../lib/api-client';

interface ArtisanStatusState {
  isOnline: boolean;
  isUpdating: boolean;
  toggleStatus: () => Promise<void>;
  setStatus: (online: boolean) => void;
}

export const useArtisanStatusStore = create<ArtisanStatusState>((set, get) => ({
  isOnline: true, // Default to online as in mockup template
  isUpdating: false,

  toggleStatus: async () => {
    const nextStatus = !get().isOnline;
    set({ isOnline: nextStatus, isUpdating: true });
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await apiClient.patch('/profiles/artisan/availability', {
        isAvailable: nextStatus,
      });
    } catch (e) {
      console.warn('Failed to update online status on server', e);
      // Revert if error occurs
      set({ isOnline: !nextStatus });
    } finally {
      set({ isUpdating: false });
    }
  },

  setStatus: (online: boolean) => set({ isOnline: online }),
}));
