/**
 * Fixmate Architectural Icon Design System Tokens
 *
 * Core Principles:
 * - Premium fintech meets industrial design: precise, confident, functional, mature.
 * - Architectural line icons with subtle custom geometric detailing.
 * - Communicates competence, security, and real-world craftsmanship.
 */
export const FIXMATE_ICON_TOKENS = {
  // Stroke weight: 1.75–2 px at 24 × 24 px
  strokeWeight: 1.85,

  // Curated color palette
  colors: {
    primary: '#123F32',       // Forest green (precise, confident, mature)
    secondary: '#606C38',     // Muted olive (subtle, structural)
    accent: '#10B981',        // Emerald (selective trust, verification, active highlights)
    creamBg: '#FEFAE0',       // Warm cream background for key feature containers
    paleSageBg: '#EAF2EC',    // Soft pale sage for neutral container surfaces
    darkBg: '#0A241C',        // Deep forest surface for high-contrast cards
    borderLight: '#E8EFE9',   // Architectural hairline border
    slate: '#475569',         // Muted secondary text
    muted: '#94A3B8',         // Placeholder & inactive states
  },

  // Optical sizing standard
  sizes: {
    xs: 16,
    sm: 18,
    base: 20,
    md: 24,
    action: 28,
    hero: 32,
  },
} as const;

export type FixmateIconTokens = typeof FIXMATE_ICON_TOKENS;
