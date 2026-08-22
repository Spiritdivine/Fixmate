import { z } from 'zod';

export const notificationParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid notification UUID required'),
  }),
});

export const notificationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    unreadOnly: z.enum(['true', 'false']).optional(),
  }).optional(),
});
