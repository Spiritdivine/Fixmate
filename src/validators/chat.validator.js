import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    body: z.string().optional().nullable(),
    messageType: z.enum(['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'LOCATION', 'SYSTEM_ALERT', 'MILESTONE_PROMPT']).default('TEXT'),
    attachmentUrl: z.string().url().optional().nullable(),
    metadata: z.object({
      duration: z.number().optional(),
      fileName: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
    }).optional().nullable(),
  }),
  params: z.object({
    conversationId: z.string().uuid('Valid conversation UUID required'),
  }),
});

export const editMessageSchema = z.object({
  body: z.object({
    body: z.string().min(1, 'Updated message body cannot be empty'),
  }),
  params: z.object({
    messageId: z.string().uuid('Valid message UUID required'),
  }),
});

export const conversationParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid conversation UUID required'),
  }),
});
