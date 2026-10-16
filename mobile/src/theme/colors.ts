export const colors = {
  // Convenience Semantic Tokens (Fixmate brand design)
  primary: '#1A4731',        // Dominant dark green
  primaryLight: '#ECFDF5',   // Soft mint green
  primaryDark: '#123424',    // Deep forest green
  secondary: '#10B981',      // Vibrant emerald CTA
  secondaryDark: '#059669',  // Dark emerald
  background: '#F4F7F4',     // Soft tinted app background
  surface: '#FFFFFF',        // Pure white card surfaces
  text: '#111827',           // Dark neutral text
  textMuted: '#6B7280',      // Muted subtext
  border: '#E5E7EB',         // Neutral hairline borders
  error: '#EF4444',          // Danger / alert red
  success: '#10B981',        // Success green
  warning: '#F59E0B',        // Caution amber

  // Brand Green System (Strictly matching Fixmate template)
  brand: {
    forest: '#1A4731',       // Dominant dark green header background & headers
    forestDark: '#123424',   // Deep contrast borders and dark states
    emerald: '#10B981',      // Primary vibrant CTA, active toggles, accept buttons
    emeraldDark: '#059669',  // Pressed buttons and high-contrast links
    emeraldLight: '#D1FAE5', // Soft green pill backgrounds, subtle tags
    mint: '#ECFDF5',         // Ultra-light card and background accents
    softBg: '#F4F7F4',       // App background tinted off-white
  },

  // Status & Priority
  status: {
    online: '#10B981',       // "YOU ARE ONLINE" active green
    offline: '#6B7280',      // Muted inactive state
    urgent: '#F59E0B',       // Urgent lead pill & countdown amber
    urgentBg: '#FEF3C7',     // Light amber card background
    urgentBorder: '#FDE68A', // Amber card border
    danger: '#EF4444',       // Decline button & dispute alerts
    dangerBg: '#FEE2E2',     // Red badge background
    info: '#3B82F6',         // Information icons and links
    infoBg: '#DBEAFE',       // Light blue badge
  },

  // Escrow & Financial
  escrow: {
    lockedBg: '#E8F5E9',     // Pill background for "Locked in Smart Escrow"
    lockedText: '#1B5E20',   // Dark green text for locked escrow
    guaranteeBg: '#F0FDF4',  // Light platform guarantee box
    border: '#A7F3D0',       // Subtle green borders
  },

  // Neutrals
  neutral: {
    900: '#111827',          // Primary text on light screens
    800: '#1F2937',          // Secondary headings
    700: '#374151',          // Body text
    600: '#4B5563',          // Secondary body
    500: '#6B7280',          // Subtitles, metadata, hints
    400: '#9CA3AF',          // Placeholder text, inactive icons
    300: '#D1D5DB',          // Light dividers and borders
    200: '#E5E7EB',          // Subtle component borders
    100: '#F3F4F6',          // Search bar and card background
    50: '#F9FAFB',           // Subtle off-white surfaces
    white: '#FFFFFF',        // Pure white cards
  },

  // Fixmate Architectural Icon System Tokens
  icons: {
    primary: '#123F32',         // Forest green (precise, confident)
    secondary: '#606C38',       // Muted olive (subtle, structural)
    accent: '#10B981',          // Emerald (selective trust & security)
    creamBg: '#FEFAE0',         // Cream container background for key actions
    paleSageBg: '#EAF2EC',      // Pale sage container background
    strokeWeight: 1.85,         // Recommended 1.75-2px stroke at 24x24px
    sizes: {
      sm: 18,
      md: 20,
      base: 24,
      lg: 28,
    },
  },
} as const;

export type Colors = typeof colors;
