import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api-contracts';

export interface LoyaltyProfileData {
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
}

export interface PointLedgerItem {
  id: string;
  amount: number;
  balanceAfter: number;
  transactionType: string;
  description: string;
  createdAt: string;
}

export interface LoyaltyLedgerResponse {
  items: PointLedgerItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ValidateReferralResponse {
  isValid: boolean;
  referrerName?: string;
  refereeRewardPoints?: number;
  referrerRewardPoints?: number;
  description?: string;
  message?: string;
}

export interface ReferralActivityItem {
  id: string;
  refereeId: string;
  refereeName: string;
  role: 'CLIENT' | 'ARTISAN';
  status: 'PENDING_QUALIFICATION' | 'REWARD_DISBURSED' | 'REWARD_REVOKED';
  pointsEarned: number;
  potentialPoints: number;
  nairaValue: number;
  potentialNairaValue: number;
  date: string;
  qualifiedAt?: string | null;
}

export interface ReferralActivityResponse {
  items: ReferralActivityItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class LoyaltyService {
  static async getProfile(): Promise<LoyaltyProfileData> {
    const response = await apiClient.get<ApiResponse<LoyaltyProfileData>>('/loyalty/profile');
    return response.data.data;
  }

  static async getLedger(page = 1, limit = 20): Promise<LoyaltyLedgerResponse> {
    const response = await apiClient.get<ApiResponse<LoyaltyLedgerResponse>>('/loyalty/ledger', {
      params: { page, limit },
    });
    return response.data.data;
  }

  static async getReferralActivity(page = 1, limit = 20): Promise<ReferralActivityResponse> {
    const response = await apiClient.get<ApiResponse<ReferralActivityResponse>>('/loyalty/referrals/activity', {
      params: { page, limit },
    });
    return response.data.data;
  }

  static async validateReferralCode(referralCode: string): Promise<ValidateReferralResponse> {
    const response = await apiClient.post<ApiResponse<ValidateReferralResponse>>('/loyalty/referral/validate', {
      referralCode,
    });
    return response.data.data;
  }

  static async claimReferralCode(referralCode: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/loyalty/referral/claim', {
      referralCode,
    });
    return response.data.data;
  }

  static async reserveEscrowDiscount(amount: number, orderReference: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/loyalty/redeem/escrow-discount', {
      amount,
      orderReference,
    });
    return response.data.data;
  }

  static async purchaseDirectoryBoost(days = 7): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/loyalty/redeem/directory-boost', {
      days,
    });
    return response.data.data;
  }
}
