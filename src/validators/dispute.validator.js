import { z } from 'zod';

export const fileDisputeSchema = z.object({
  body: z.object({
    contractId: z.string().uuid('Valid contract UUID required'),
    milestoneId: z.string().uuid('Valid milestone UUID required').optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(255),
    explanation: z.string().min(20, 'Explanation must be at least 20 characters'),
    evidences: z
      .array(
        z.object({
          title: z.string().min(1, 'Evidence title is required'),
          fileUrl: z.string().url('Evidence file must be a valid URL'),
          mimeType: z.string().optional().default('image/jpeg'),
        })
      )
      .optional()
      .default([]),
  }),
});

export const resolveDisputeSchema = z.object({
  body: z.object({
    resolution: z.enum([
      'FULL_REFUND_CLIENT',
      'FULL_PAYOUT_ARTISAN',
      'SPLIT_SETTLEMENT',
      'CANCELLED',
    ]),
    refundToClientAmount: z.number().nonnegative().optional().default(0),
    payoutToArtisanAmount: z.number().nonnegative().optional().default(0),
    adminResolutionNotes: z.string().min(10, 'Admin resolution notes must be at least 10 characters'),
    onChainResolutionTxHash: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Valid dispute UUID required'),
  }),
});

export const addEvidenceSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Evidence title is required'),
    fileUrl: z.string().url('Evidence file must be a valid URL'),
    mimeType: z.string().optional().default('image/jpeg'),
  }),
  params: z.object({
    id: z.string().uuid('Valid dispute UUID required'),
  }),
});

export const sendDisputeMessageSchema = z.object({
  body: z.object({
    body: z.string().min(1, 'Message body cannot be empty'),
    attachmentUrls: z.array(z.string().url()).optional().default([]),
  }),
  params: z.object({
    id: z.string().uuid('Valid dispute UUID required'),
  }),
});

export const disputeParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid dispute UUID required'),
  }),
});

export const evidenceParamSchema = z.object({
  params: z.object({
    evidenceId: z.string().uuid('Valid evidence UUID required'),
  }),
});
