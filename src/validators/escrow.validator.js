import { z } from 'zod';

export const fundMilestoneSchema = z.object({
  body: z.object({
    fundingTxHash: z.string().optional(),
    onChainEscrowId: z.number().int().positive().optional(),
    cryptoAmount: z.number().positive().optional(),
    cryptoCurrency: z.string().default('MON').optional(),
  }),
  params: z.object({
    milestoneId: z.string().uuid('Valid milestone UUID required'),
  }),
});

export const submitWorkSchema = z.object({
  body: z.object({
    submissionNotes: z.string().min(5, 'Submission notes must be at least 5 characters'),
    beforeProofUrls: z.array(z.string().url('Must be valid URL')).optional().default([]),
    submissionProofUrls: z.array(z.string().url('Must be valid URL')).min(1, 'At least one completion proof URL is required'),
  }),
  params: z.object({
    milestoneId: z.string().uuid('Valid milestone UUID required'),
  }),
});

export const approveReleaseSchema = z.object({
  body: z.object({
    releaseTxHash: z.string().optional(),
  }).optional().default({}),
  params: z.object({
    milestoneId: z.string().uuid('Valid milestone UUID required'),
  }),
});

export const requestRevisionSchema = z.object({
  body: z.object({
    revisionNotes: z.string().min(5, 'Revision notes must be at least 5 characters'),
  }),
  params: z.object({
    milestoneId: z.string().uuid('Valid milestone UUID required'),
  }),
});

export const refundMilestoneSchema = z.object({
  body: z.object({
    refundReason: z.string().min(5, 'Refund reason must be at least 5 characters'),
  }),
  params: z.object({
    milestoneId: z.string().uuid('Valid milestone UUID required'),
  }),
});

export const syncOnChainSchema = z.object({
  params: z.object({
    contractId: z.string().uuid('Valid contract UUID required'),
  }),
});
