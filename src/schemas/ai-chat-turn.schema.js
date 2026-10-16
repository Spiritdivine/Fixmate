import { z } from 'zod';

export const DiagnosticTurnResponseSchema = z.object({
  conversationalReply: z.string().min(10).max(4000),
  status: z.enum(['INFORMATION_GATHERING', 'ASSESSMENT_READY', 'DIY_GUIDANCE', 'PROFESSIONAL_REQUIRED', 'EMERGENCY', 'RESOLVED']).default('INFORMATION_GATHERING'),
  confirmedFacts: z.array(z.string().max(500)).default([]),
  hypotheses: z.array(z.object({
    label: z.string().max(300),
    evidenceFor: z.array(z.string().max(500)).default([]),
    evidenceMissing: z.array(z.string().max(500)).default([]),
    likelihoodBand: z.enum(['low', 'moderate', 'high']).default('moderate'),
  })).default([]),
  missingInformation: z.array(z.string().max(500)).default([]),
  nextQuestion: z.string().max(600).nullable().default(null),
  imageRequest: z.object({
    needed: z.boolean().default(false),
    guidance: z.string().max(600).nullable().default(null),
  }).default({ needed: false, guidance: null }),
  intent: z.enum(['CONVERSATIONAL', 'MATCH_REQUESTED', 'MATCH_ONLY', 'EMERGENCY_ESCALATION', 'BOM_REQUESTED', 'ISSUE_RESOLVED']).default('CONVERSATIONAL'),
  shouldMatchArtisans: z.boolean().default(false),
  updatedProbableCause: z.string().max(1000).nullable().default(null),
  updatedSeverity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).nullable().default(null),
  safetyWarning: z.string().max(1000).nullable().default(null),
  diyAdvice: z.object({
    isFeasible: z.boolean().default(false),
    instructions: z.array(z.string().max(600)).default([]),
    requiredTools: z.array(z.string().max(200)).default([]),
    risks: z.string().max(1000).nullable().default(null),
  }).default({ isFeasible: false, instructions: [], requiredTools: [], risks: null }),
  clarificationOptions: z.array(z.string().max(200)).optional().default([]),
  isResolved: z.boolean().optional().default(false),
  categorySlug: z.string().max(100).nullable().optional().default(null),
  estimatedBOM: z.array(z.object({
    item: z.string().max(200),
    specification: z.string().max(300).nullable().optional(),
    quantity: z.number().int().positive().default(1),
    unit: z.string().max(50).default('PCS'),
    estimatedCostMin: z.number().nonnegative().optional(),
    estimatedCostMax: z.number().nonnegative().optional(),
    marketCategory: z.string().max(100).optional(),
  })).default([]),
});
