import { z } from 'zod';

export const acceptProposalSchema = z.object({
  params: z.object({
    proposalId: z.string().uuid('Valid proposal UUID required'),
  }),
});

export const getContractSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid contract UUID required'),
  }),
});

export const updateMilestoneScheduleSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    amount: z.number().positive().optional(),
    dueDate: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Valid contract UUID required'),
    milestoneId: z.string().uuid('Valid milestone UUID required'),
  }),
});

export const milestoneParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid contract UUID required'),
    milestoneId: z.string().uuid('Valid milestone UUID required'),
  }),
});
