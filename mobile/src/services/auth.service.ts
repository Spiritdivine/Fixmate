import { apiClient, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../lib/api-client';
import { Storage } from '../lib/storage';
import { ApiResponse, UserSession } from '../types/api-contracts';

export interface LoginPayload {
  email?: string;
  identifier?: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  phoneNumber: string;
  password: string;
  role: 'CLIENT' | 'ARTISAN';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  state?: string;
  lgaCity?: string;
}

export type OtpPurpose =
  | 'PHONE_VERIFICATION'
  | 'EMAIL_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'WITHDRAWAL_2FA';

export interface VerifyOtpPayload {
  identifier: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: string;
  };
  user: UserSession;
}

export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  user: UserSession;
}

/**
 * AuthService conforms to Single Responsibility Principle (SRP)
 * Encapsulates all backend authentication operations and universal cross-platform storage.
 */
export class AuthService {
  static async login(payload: LoginPayload): Promise<AuthSessionResult> {
    const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', payload);
    const data = response.data.data;

    const accessToken = data.tokens?.accessToken || data.accessToken || '';
    const refreshToken = data.tokens?.refreshToken || data.refreshToken || '';

    if (accessToken) {
      await Storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      await Storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    return {
      accessToken,
      refreshToken,
      user: data.user,
    };
  }

  static async register(payload: RegisterPayload): Promise<{ user: UserSession; requiresOtp?: boolean }> {
    const response = await apiClient.post<ApiResponse<{ user: UserSession; requiresOtp?: boolean }>>(
      '/auth/register',
      payload
    );
    return response.data.data;
  }

  static async verifyOtp(payload: VerifyOtpPayload): Promise<AuthSessionResult> {
    const response = await apiClient.post<ApiResponse<AuthTokens>>('/auth/verify-otp', payload);
    const data = response.data.data;

    const accessToken = data.tokens?.accessToken || data.accessToken || '';
    const refreshToken = data.tokens?.refreshToken || data.refreshToken || '';

    if (accessToken) {
      await Storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      await Storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    return {
      accessToken,
      refreshToken,
      user: data.user,
    };
  }

  static async resendOtp(identifier: string, purpose: OtpPurpose = 'PHONE_VERIFICATION'): Promise<void> {
    await apiClient.post('/auth/resend-otp', { identifier, purpose });
  }

  static async getMe(): Promise<UserSession> {
    const response = await apiClient.get<ApiResponse<UserSession>>('/auth/me');
    return response.data.data;
  }

  static async logout(): Promise<void> {
    try {
      const refreshToken = await Storage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network errors on logout to allow offline sign out
    } finally {
      await Storage.removeItem(ACCESS_TOKEN_KEY);
      await Storage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  static async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  static async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { email, token, newPassword });
  }
}
