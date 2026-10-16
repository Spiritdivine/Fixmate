import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

export interface FixmateIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export interface IconContainerProps {
  children: React.ReactNode;
  variant?: 'cream' | 'sage' | 'forest' | 'emerald' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

/**
 * Standard visual specifications for Fixmate architectural iconography:
 * - Stroke weight: 1.75–2 px at 24 × 24 px (standard 1.85)
 * - Geometry: Restrained, open forms, consistent proportions
 * - Corners: Softened, architectural
 * - Colors: Primary Forest #123F32, Secondary Olive #606C38, Accent Emerald #10B981
 */
export const FIXMATE_ICON_DEFAULTS = {
  strokeWidth: 1.85,
  size: 22,
  primaryColor: colors.icons.primary,
  secondaryColor: colors.icons.secondary,
  accentColor: colors.icons.accent,
};

/**
 * IconContainer:
 * Important Fixmate rule: Do NOT put every icon inside a container!
 * Use standalone icons for navigation and inline actions.
 * Reserve containers strictly for feature cards, primary actions, and status badges.
 */
export const IconContainer: React.FC<IconContainerProps> = ({
  children,
  variant = 'cream',
  size = 'md',
  style,
}) => {
  return (
    <View
      style={[
        styles.baseContainer,
        styles[size],
        styles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  // Sizes (softened corners with architectural radius)
  sm: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  md: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  lg: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  // Color Variants
  cream: {
    backgroundColor: '#FEFAE0',
    borderColor: '#EFE8C3',
  },
  sage: {
    backgroundColor: '#EAF2EC',
    borderColor: '#D2E3D6',
  },
  forest: {
    backgroundColor: '#123F32',
    borderColor: '#0D2D24',
  },
  emerald: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
});
