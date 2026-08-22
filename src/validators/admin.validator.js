import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters'),
    parentId: z.number().int().positive().optional().nullable(),
    iconUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    parentId: z.number().int().positive().optional().nullable(),
    iconUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be an integer'),
  }),
});

export const createSkillSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive('Category ID is required'),
    name: z.string().min(2, 'Skill name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters'),
  }),
});

export const updateSkillSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive().optional(),
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be an integer'),
  }),
});

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED']),
    reason: z.string().min(5, 'Reason for status change must be provided'),
  }),
  params: z.object({
    id: z.string().uuid('Valid user UUID required'),
  }),
});

export const updateSystemSettingSchema = z.object({
  body: z.object({
    value: z.string().min(1, 'Setting value is required'),
    description: z.string().optional(),
  }),
  params: z.object({
    key: z.string().min(2, 'Setting key is required'),
  }),
});
