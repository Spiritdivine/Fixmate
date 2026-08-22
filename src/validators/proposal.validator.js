import { z } from 'zod';

export const createProposalSchema = z.object({
  body: z.object({
    jobId: z.string().uuid('Valid Job UUID required'),
    coverLetter: z.string().min(20, 'Cover letter must be at least 20 characters'),
    bidAmount: z.number().positive('Bid amount must be greater than 0'),
    estimatedDays: z.number().int().positive('Estimated turnaround days required'),
    milestones: z
      .array(
        z.object({
          stepOrder: z.number().int().positive(),
          title: z.string().min(1),
          amount: z.number().positive(),
          estimatedDays: z.number().int().positive(),
        })
      )
      .optional(),
  }),
});

export const updateProposalSchema = z.object({
  body: z.object({
    coverLetter: z.string().min(20).optional(),
    bidAmount: z.number().positive().optional(),
    estimatedDays: z.number().int().positive().optional(),
    milestones: z
      .array(
        z.object({
          stepOrder: z.number().int().positive(),
          title: z.string().min(1),
          amount: z.number().positive(),
          estimatedDays: z.number().int().positive(),
        })
      )
      .optional(),
  }),
  params: z.object({
    id: z.string().uuid('Valid proposal UUID required'),
  }),
});

export const updateProposalStatusSchema = z.object({
  body: z.object({
    status: z.enum(['SHORTLISTED', 'REJECTED']),
  }),
  params: z.object({
    id: z.string().uuid('Valid proposal UUID required'),
  }),
});

export const proposalParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid proposal UUID required'),
  }),
});
