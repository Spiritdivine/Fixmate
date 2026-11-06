import { z } from 'zod';

export const validateReferralCodeSchema = z.object({
  body: z.object({
    referralCode: z.string().min(3, 'Referral code must be at least 3 characters').max(16),
  }),
});

export const reservePointsSchema = z.object({
  body: z.object({
    amount: z.number().int().positive('Point amount must be a positive integer'),
    orderReference: z.string().min(3, 'Order reference is required'),
    ttlMinutes: z.number().int().min(5).max(60).optional(),
  }),
});

export const directoryBoostSchema = z.object({
  body: z.object({
    days: z.number().int().min(7).max(30).optional().default(7),
  }),
});

export const ledgerQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  }),
});
