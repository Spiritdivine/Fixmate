import { apiClient } from '../lib/api-client';
import { ApiResponse, WalletData, BankAccountRecord } from '../types/api-contracts';

export interface AddBankAccountPayload {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

export interface RequestWithdrawalPayload {
  amount: number;
  bankAccountId: string;
  pin?: string;
}

export interface InitializeDepositPayload {
  amount: number;
  currency?: string;
  paymentMethod?: 'PAYSTACK' | 'KOTANI';
}

/**
 * WalletService (SRP):
 * Manages dual-rail fiat & Monad escrow ledger, bank verification,
 * and payout withdrawals.
 */
export class WalletService {
  static async getMyWallet(): Promise<WalletData> {
    const response = await apiClient.get<ApiResponse<WalletData>>('/wallets/my-wallet');
    return response.data.data;
  }

  static async simulateDeposit(amount: number): Promise<WalletData> {
    const response = await apiClient.post<ApiResponse<WalletData>>('/wallets/simulate-deposit', { amount });
    return response.data.data;
  }

  static async initializeDeposit(payload: InitializeDepositPayload): Promise<{ authorizationUrl: string; reference: string }> {
    const response = await apiClient.post<ApiResponse<{ authorizationUrl: string; reference: string }>>(
      '/payments/initialize',
      payload
    );
    return response.data.data;
  }

  static async verifyDeposit(reference: string): Promise<WalletData> {
    const response = await apiClient.get<ApiResponse<WalletData>>(`/payments/verify/${reference}`);
    return response.data.data;
  }

  static async getBanks(): Promise<BankAccountRecord[]> {
    const response = await apiClient.get<ApiResponse<BankAccountRecord[]>>('/wallets/bank-accounts');
    return response.data.data;
  }

  static async resolveBank(accountNumber: string, bankCode: string): Promise<{ accountName: string }> {
    const response = await apiClient.get<ApiResponse<{ accountName: string }>>('/wallets/bank-accounts/resolve', {
      params: { accountNumber, bankCode },
    });
    return response.data.data;
  }

  static async addBank(payload: AddBankAccountPayload): Promise<BankAccountRecord> {
    const response = await apiClient.post<ApiResponse<BankAccountRecord>>('/wallets/bank-accounts', payload);
    return response.data.data;
  }

  static async deleteBank(id: string): Promise<void> {
    await apiClient.delete(`/wallets/bank-accounts/${id}`);
  }

  static async setDefaultBank(id: string): Promise<BankAccountRecord> {
    const response = await apiClient.patch<ApiResponse<BankAccountRecord>>(`/wallets/bank-accounts/${id}/default`);
    return response.data.data;
  }

  static async requestWithdrawal(payload: RequestWithdrawalPayload): Promise<{ id: string; status: string }> {
    const response = await apiClient.post<ApiResponse<{ id: string; status: string }>>('/wallets/withdraw', payload);
    return response.data.data;
  }

  static async getExchangeRate(): Promise<{ rate: number; currencyPair: string }> {
    const response = await apiClient.get<ApiResponse<{ rate: number; currencyPair: string }>>('/payments/rates');
    return response.data.data;
  }

  static async getSavedCards(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/wallets/saved-cards');
    return response.data.data;
  }

  static async setDefaultCard(id: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/wallets/saved-cards/${id}/default`);
    return response.data.data;
  }

  static async deleteCard(id: string): Promise<void> {
    await apiClient.delete(`/wallets/saved-cards/${id}`);
  }

  static async initiateKotaniOnRamp(payload: {
    amountNgn: number;
    destinationWalletAddress?: string;
  }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/payments/kotani/on-ramp', payload);
    return response.data.data;
  }
}


