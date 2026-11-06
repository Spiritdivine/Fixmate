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

export const createChangeOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid contract UUID required'),
  }),
  body: z.object({
    additionalAmount: z.number().min(0, 'Additional amount cannot be negative').default(0),
    additionalDays: z.number().int().min(0, 'Additional days cannot be negative').default(0),
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(2000),
    evidencePhotos: z.array(z.string()).optional().default([]),
  }),
});

export const respondChangeOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid contract UUID required'),
    changeOrderId: z.string().uuid('Valid change order UUID required'),
  }),
  body: z.object({
    action: z.enum(['APPROVE', 'REJECT'], {
      required_error: 'Action must be either APPROVE or REJECT',
    }),
    reason: z.string().max(1000).optional(),
  }),
});

export const changeOrderParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid contract UUID required'),
    changeOrderId: z.string().uuid('Valid change order UUID required'),
  }),
});
