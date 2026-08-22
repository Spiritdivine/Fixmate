import { z } from 'zod';

export const initializeDepositSchema = z.object({
  amount: z.number().positive('Deposit amount must be greater than zero'),
});

export const verifyDepositSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
});
