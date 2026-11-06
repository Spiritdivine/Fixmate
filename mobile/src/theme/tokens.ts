export interface ThemePalette {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderSubtle: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  error: string;
  errorBg: string;
  errorBorder: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  inputBg: string;
  inputBorder: string;
  cardShadow: string;
  headerBg: string;
  headerBorder: string;
  bottomBarBg: string;
  bottomBarBorder: string;
  brand: {
    forest: string;
    forestDark: string;
    emerald: string;
    emeraldDark: string;
    emeraldLight: string;
    mint: string;
    softBg: string;
  };
  icons: {
    primary: string;
    secondary: string;
    accent: string;
    creamBg: string;
    paleSageBg: string;
    strokeWeight: number;
    sizes: {
      sm: number;
      md: number;
      base: number;
      lg: number;
    };
  };
}

export const lightPalette: ThemePalette = {
  isDark: false,
  background: '#F4F7F4',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F9FAFB',
  text: '#111827',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  primary: '#1A4731',
  primaryLight: '#ECFDF5',
  primaryDark: '#123424',
  secondary: '#10B981',
  secondaryDark: '#059669',
  accent: '#10B981',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  errorBorder: '#FCA5A5',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  inputBg: '#F9FAFB',
  inputBorder: '#E5E7EB',
  cardShadow: 'rgba(0, 0, 0, 0.04)',
  headerBg: '#FFFFFF',
  headerBorder: '#E5E7EB',
  bottomBarBg: '#FFFFFF',
  bottomBarBorder: '#E5E7EB',
  brand: {
    forest: '#1A4731',
    forestDark: '#123424',
    emerald: '#10B981',
    emeraldDark: '#059669',
    emeraldLight: '#D1FAE5',
    mint: '#ECFDF5',
    softBg: '#F4F7F4',
  },
  icons: {
    primary: '#123F32',
    secondary: '#606C38',
    accent: '#10B981',
    creamBg: '#FEFAE0',
    paleSageBg: '#EAF2EC',
    strokeWeight: 1.85,
    sizes: {
      sm: 18,
      md: 20,
      base: 24,
      lg: 28,
    },
  },
};

export const darkPalette: ThemePalette = {
  isDark: true,
  background: '#071A11',
  surface: '#0E291C',
  surfaceElevated: '#143827',
  surfaceSubtle: '#092116',
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  textInverse: '#071A11',
  border: '#1E4D36',
  borderSubtle: '#163827',
  primary: '#10B981',
  primaryLight: 'rgba(16, 185, 129, 0.15)',
  primaryDark: '#059669',
  secondary: '#10B981',
  secondaryDark: '#34D399',
  accent: '#34D399',
  error: '#F87171',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  errorBorder: 'rgba(239, 68, 68, 0.3)',
  success: '#34D399',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#FBBF24',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  inputBg: '#092116',
  inputBorder: '#1E4D36',
  cardShadow: 'rgba(0, 0, 0, 0.35)',
  headerBg: '#071A11',
  headerBorder: '#163827',
  bottomBarBg: '#071A11',
  bottomBarBorder: '#163827',
  brand: {
    forest: '#10B981',
    forestDark: '#059669',
    emerald: '#10B981',
    emeraldDark: '#34D399',
    emeraldLight: '#143827',
    mint: '#0E291C',
    softBg: '#071A11',
  },
  icons: {
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#10B981',
    creamBg: '#143827',
    paleSageBg: '#0E291C',
    strokeWeight: 1.85,
    sizes: {
      sm: 18,
      md: 20,
      base: 24,
      lg: 28,
    },
  },
};
