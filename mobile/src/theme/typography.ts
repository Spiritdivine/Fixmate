import { TextStyle } from 'react-native';

export const typography = {
  // Preset style helpers
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  } as TextStyle,
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 28,
  } as TextStyle,
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  } as TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  } as TextStyle,
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  } as TextStyle,
  captionMedium: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  } as TextStyle,
  badge: {
    fontSize: 11,
    fontWeight: '600' as const,
  } as TextStyle,

  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
  },

  // Font family mappings
  fonts: {
    regular: undefined as unknown as string,
    medium: undefined as unknown as string,
    semiBold: undefined as unknown as string,
    semibold: undefined as unknown as string,
    bold: undefined as unknown as string,
    extraBold: undefined as unknown as string,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Font weights
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const textStyles = {
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  body: typography.body,
  bodyMedium: typography.bodyMedium,
  caption: typography.caption,
  captionMedium: typography.captionMedium,
  badge: typography.badge,
};
