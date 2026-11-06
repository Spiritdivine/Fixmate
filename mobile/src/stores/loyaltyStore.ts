import { create } from 'zustand';
import {
  LoyaltyService,
  LoyaltyProfileData,
  PointLedgerItem,
} from '../services/loyalty.service';

interface LoyaltyState {
  points: {
    available: number;
    locked: number;
    lifetimeEarned: number;
    lifetimeBurned: number;
  };
  tier: {
    current: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'ELITE_GUILD';
    tierPoints: number;
    nextTierThreshold: number;
    pointsToNextTier: number;
    multiplier: number;
    feeDiscountPercent: number;
    searchBoostPercent: number;
    badgeUrl: string | null;
  };
  referral: {
    code: string;
    shareUrl: string;
    totalInvited: number;
    totalQualified: number;
    pendingBonusPoints: number;
  };
  ledgerItems: PointLedgerItem[];
  isLoading: boolean;
  isLedgerLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  fetchLedger: () => Promise<void>;
  reserveDiscount: (amount: number, orderReference: string) => Promise<any>;
  purchaseBoost: (days?: number) => Promise<any>;
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  points: { available: 0, locked: 0, lifetimeEarned: 0, lifetimeBurned: 0 },
  tier: {
    current: 'BRONZE',
    tierPoints: 0,
    nextTierThreshold: 1000,
    pointsToNextTier: 1000,
    multiplier: 1.0,
    feeDiscountPercent: 0,
    searchBoostPercent: 0,
    badgeUrl: null,
  },
  referral: {
    code: '',
    shareUrl: '',
    totalInvited: 0,
    totalQualified: 0,
    pendingBonusPoints: 0,
  },
  ledgerItems: [],
  isLoading: false,
  isLedgerLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await LoyaltyService.getProfile();
      set({
        points: data.points,
        tier: data.tier,
        referral: data.referral,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || err.message || 'Could not load rewards profile.',
      });
    }
  },

  fetchLedger: async () => {
    set({ isLedgerLoading: true });
    try {
      const data = await LoyaltyService.getLedger(1, 20);
      set({ ledgerItems: data.items, isLedgerLoading: false });
    } catch (err: any) {
      set({ isLedgerLoading: false });
    }
  },

  reserveDiscount: async (amount: number, orderReference: string) => {
    const result = await LoyaltyService.reserveEscrowDiscount(amount, orderReference);
    // Optimistically update locked points in local state
    set((state) => ({
      points: {
        ...state.points,
        available: Math.max(0, state.points.available - amount),
        locked: state.points.locked + amount,
      },
    }));
    return result;
  },

  purchaseBoost: async (days = 7) => {
    const result = await LoyaltyService.purchaseDirectoryBoost(days);
    await get().fetchProfile();
    await get().fetchLedger();
    return result;
  },
}));
