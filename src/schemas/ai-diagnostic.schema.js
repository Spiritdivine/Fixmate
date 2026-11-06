import { z } from 'zod';

export const BOMItemSchema = z.object({
  item: z.string().min(1).max(200),
  specification: z.string().max(250).optional().default('Standard trade grade'),
  quantity: z.number().int().positive().optional().default(1),
  unit: z.enum(['PCS', 'METERS', 'ROLLS', 'BAGS', 'KG', 'LITERS', 'SETS']).optional().default('PCS'),
  estimatedCostMin: z.coerce.number().nonnegative().default(0),
  estimatedCostMax: z.coerce.number().nonnegative().default(0),
  marketCategory: z
    .enum(['ELECTRICAL', 'PLUMBING', 'HARDWARE', 'REFRIGERANT', 'BUILDING_MATERIAL', 'GENERAL'])
    .optional()
    .default('GENERAL'),
});

export const SafetyContainmentStepSchema = z.object({
  stepNumber: z.coerce.number().int().positive().default(1),
  action: z.string().min(5).max(400),
  urgency: z.enum(['IMMEDIATE_ACTION', 'PRECAUTIONARY', 'MONITOR']).optional().default('IMMEDIATE_ACTION'),
  targetComponent: z.string().optional().nullable().default(null),
});

export const PossibleCauseSchema = z.object({
  label: z.string().min(2).max(300),
  supportingEvidence: z.array(z.string()).default([]),
  missingEvidence: z.array(z.string()).default([]),
  likelihoodBand: z.enum(['low', 'moderate', 'high']).default('moderate'),
});

export const GuidanceStepSchema = z.object({
  stepNumber: z.coerce.number().int().positive().optional().default(1),
  instruction: z.string().min(5).max(600),
  risk: z.enum(['low', 'moderate', 'professional_only']).default('low'),
  stopConditions: z.array(z.string()).default([]),
});

export const DiagnosticResponseSchema = z.object({
  conversationalReply: z.string().min(10).max(4000).default('Here is the diagnostic assessment of the fault.'),
  diagnosticTitle: z.string().min(3).max(255).default('Property Maintenance Diagnostic'),
  probableCause: z.string().min(5).max(1000).default('Component wear or physical failure requiring inspection.'),
  userIntent: z.enum(['GREETING', 'DIAGNOSTIC_CONSULTATION', 'ARTISAN_HIRE_REQUESTED', 'OUT_OF_SCOPE']).default('DIAGNOSTIC_CONSULTATION'),
  bomRequested: z.coerce.boolean().default(false),
  shouldMatchArtisans: z.coerce.boolean().default(false),
  categorySlug: z
    .string()
    .min(2)
    .max(100)
    .nullable()
    .optional()
    .default(null),
  severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).default('MODERATE'),
  urgency: z.enum(['ROUTINE', 'SCHEDULED', 'URGENT', 'EMERGENCY']).default('ROUTINE'),
  isHazardous: z.coerce.boolean().default(false),
  hazardTypes: z
    .array(
      z.enum([
        'ELECTRICAL_SHOCK',
        'FIRE_ARC',
        'GAS_EXPLOSION',
        'ACTIVE_FLOODING',
        'STRUCTURAL_COLLAPSE',
        'CHEMICAL_TOXIC',
        'NONE',
      ])
    )
    .optional()
    .default(['NONE']),
  safetyInstructions: z.array(z.union([SafetyContainmentStepSchema, z.string()])).default([]),
  diyAllowed: z.coerce.boolean().default(false),
  diyRiskReason: z.string().optional().nullable().default(null),
  diyGuide: z.string().optional().nullable().default(null),
  requiresArtisan: z.coerce.boolean().default(true),
  estimatedBOM: z.array(BOMItemSchema).default([]),
  estimatedLaborMin: z.coerce.number().nonnegative().nullable().default(null),
  estimatedLaborMax: z.coerce.number().nonnegative().nullable().default(null),
  currency: z.string().default('NGN'),
  recommendedSkills: z.array(z.string()).default([]),
  visualObservations: z.string().optional().nullable().default(null),
  clarificationNeeded: z.coerce.boolean().optional().default(false),
  clarificationQuestion: z.string().optional().nullable().default(null),
  clarificationOptions: z.array(z.string()).optional().default([]),
  // Differential diagnosis extensions
  symptoms: z.array(z.string()).optional().default([]),
  possibleCauses: z.array(PossibleCauseSchema).optional().default([]),
  guidanceSteps: z.array(GuidanceStepSchema).optional().default([]),
  nextAction: z
    .enum([
      'continue_chat',
      'answer_clarification',
      'offer_professional_help',
      'show_emergency_options',
      'offer_booking',
    ])
    .optional()
    .default('continue_chat'),
});

/**
 * Normalizes safety instructions array if elements are plain strings
 */
export function normalizeSafetyInstructions(rawSteps = []) {
  if (!Array.isArray(rawSteps)) return [];
  return rawSteps.map((step, index) => {
    if (typeof step === 'string') {
      return {
        stepNumber: index + 1,
        action: step,
        urgency: 'IMMEDIATE_ACTION',
        targetComponent: null,
      };
    }
    return {
      stepNumber: step.stepNumber || index + 1,
      action: step.action || 'Exercise caution around the affected area.',
      urgency: step.urgency || 'IMMEDIATE_ACTION',
      targetComponent: step.targetComponent || null,
    };
  });
}
