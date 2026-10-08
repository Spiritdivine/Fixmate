import { z } from 'zod';

export const diagnoseInquirySchema = z.object({
  body: z.object({
    textPrompt: z.string().max(2000, 'Text prompt cannot exceed 2000 characters').optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    address: z.string().max(500).optional(),
    clientSessionToken: z.string().max(128).optional(),
  }),
});

export const clarifyInquirySchema = z.object({
  body: z.object({
    answer: z.string().min(1, 'Clarification answer is required').max(500),
  }),
});

