import { z } from 'zod';

export const simulateDepositSchema = z.object({
  body: z.object({
    amount: z.number().positive('Deposit amount must be greater than 0'),
  }),
});

export const addBankAccountSchema = z.object({
  body: z.object({
    bankName: z.string().min(2, 'Bank name is required'),
    bankCode: z.string().min(2, 'Bank code is required'),
    accountNumber: z.string().min(10, 'Account number must be 10 digits').max(10),
    accountName: z.string().min(2, 'Account name is required'),
  }),
});

export const requestWithdrawalSchema = z.object({
  body: z.object({
    bankAccountId: z.string().uuid('Valid bank account UUID required'),
    amount: z.number().positive('Withdrawal amount must be greater than 0'),
  }),
});

export const bankAccountParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid bank account UUID required'),
  }),
});

export const cardParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid card UUID required'),
  }),
});

export const payoutParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid payout request UUID required'),
  }),
});
