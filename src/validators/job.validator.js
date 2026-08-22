import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive('Valid category ID required'),
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    budgetType: z.enum(['FIXED', 'MILESTONE_BASED', 'HOURLY']).default('FIXED'),
    budgetMin: z.number().positive('Minimum budget must be greater than 0'),
    budgetMax: z.number().positive('Maximum budget must be greater than 0'),
    state: z.string().min(1, 'State is required'),
    lgaCity: z.string().min(1, 'LGA/City is required'),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    expectedOutcome: z.string().optional(),
    materialsProvidedBy: z.string().optional(),
    completionProofReq: z.string().optional(),
    deadlineDate: z.string().optional(),
    skillIds: z.array(z.number().int()).optional(),
    attachments: z
      .array(
        z.object({
          fileUrl: z.string().url(),
          fileName: z.string(),
          fileSizeBytes: z.number().int(),
          mimeType: z.string(),
        })
      )
      .optional(),
  }),
});

export const updateJobSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive().optional(),
    title: z.string().min(5).optional(),
    description: z.string().min(20).optional(),
    budgetType: z.enum(['FIXED', 'MILESTONE_BASED', 'HOURLY']).optional(),
    budgetMin: z.number().positive().optional(),
    budgetMax: z.number().positive().optional(),
    state: z.string().min(1).optional(),
    lgaCity: z.string().min(1).optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    expectedOutcome: z.string().optional(),
    materialsProvidedBy: z.string().optional(),
    completionProofReq: z.string().optional(),
    deadlineDate: z.string().optional().nullable(),
    skillIds: z.array(z.number().int()).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Valid job UUID required'),
  }),
});

export const updateJobStatusSchema = z.object({
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  }),
  params: z.object({
    id: z.string().uuid('Valid job UUID required'),
  }),
});

export const inviteArtisanSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid job UUID required'),
    artisanId: z.string().uuid('Valid artisan user UUID required'),
  }),
});

export const respondInvitationSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'DECLINED']),
  }),
  params: z.object({
    id: z.string().uuid('Valid invitation UUID required'),
  }),
});

export const jobParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid job UUID required'),
  }),
});

export const attachmentParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid job UUID required'),
    attachmentId: z.string().uuid('Valid attachment UUID required'),
  }),
});
