import React from 'react';
import { Image, View, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { colors } from '../../theme';

export interface BrandLogoProps {
  /**
   * 'full': The complete brand lockup image from logo1.png / logo1-dark.png
   * 'mark': Standalone architectural monogram icon (artifix-icon-transparent.png / artifix-icon-dark.png)
   * 'lockup': Architectural mark image + styled "Fixmate" text
   */
  variant?: 'full' | 'mark' | 'lockup';
  /**
   * Color theme: 'light' (for light backgrounds) or 'dark' (for dark green/obsidian backgrounds)
   */
  theme?: 'light' | 'dark';
  /**
   * Sizing presets:
   * - 'sm': compact (height: 24)
   * - 'md': standard (height: 32)
   * - 'lg': prominent (height: 44)
   * - 'xl': hero (height: 64)
   * or a custom number for height
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  showWordmark?: boolean;
}

const BRAND_IMAGES = {
  light: {
    full: require('../../../assets/brand/logo1.png'),
    mark: require('../../../assets/brand/artifix-icon-transparent.png'),
  },
  dark: {
    full: require('../../../assets/brand/logo1-dark.png'),
    mark: require('../../../assets/brand/artifix-icon-dark.png'),
  },
};

const HEIGHT_PRESETS = {
  sm: 24,
  md: 32,
  lg: 44,
  xl: 60,
};

// Aspect ratios of original PNG assets in brand-assets/png/
// logo1.png is ~902 x 621 (aspect ratio ~ 1.45)
// artifix-icon-transparent.png is ~385 x 375 (aspect ratio ~ 1.02)
const FULL_ASPECT_RATIO = 902 / 621;
const MARK_ASPECT_RATIO = 385 / 375;

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'lockup',
  theme = 'light',
  size = 'md',
  style,
  imageStyle,
  showWordmark = true,
}) => {
  const isDark = theme === 'dark';
  const targetHeight = typeof size === 'number' ? size : HEIGHT_PRESETS[size];

  if (variant === 'full') {
    const fullWidth = targetHeight * FULL_ASPECT_RATIO;
    return (
      <View style={[styles.container, style]}>
        <Image
          source={isDark ? BRAND_IMAGES.dark.full : BRAND_IMAGES.light.full}
          style={[
            {
              width: fullWidth,
              height: targetHeight,
              resizeMode: 'contain',
            },
            imageStyle,
          ]}
          fadeDuration={0}
        />
      </View>
    );
  }

  if (variant === 'mark') {
    const markWidth = targetHeight * MARK_ASPECT_RATIO;
    return (
      <View style={[styles.container, style]}>
        <Image
          source={isDark ? BRAND_IMAGES.dark.mark : BRAND_IMAGES.light.mark}
          style={[
            {
              width: markWidth,
              height: targetHeight,
              resizeMode: 'contain',
            },
            imageStyle,
          ]}
          fadeDuration={0}
        />
      </View>
    );
  }

  // 'lockup' variant: Standalone Icon Mark + stylized "Fixmate" wordmark
  const markWidth = targetHeight * MARK_ASPECT_RATIO;
  const fontSize = targetHeight * 0.62;

  return (
    <View style={[styles.lockupRow, style]}>
      <Image
        source={isDark ? BRAND_IMAGES.dark.mark : BRAND_IMAGES.light.mark}
        style={[
          {
            width: markWidth,
            height: targetHeight,
            resizeMode: 'contain',
          },
          imageStyle,
        ]}
        fadeDuration={0}
      />
      {showWordmark && (
        <Text
          style={[
            styles.wordmark,
            { fontSize },
            isDark ? styles.wordmarkDark : styles.wordmarkLight,
          ]}
        >
          Fixmate
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  wordmarkLight: {
    color: '#123F32', // Forest green brand primary
  },
  wordmarkDark: {
    color: '#FFFFFF', // High-contrast pure white for dark surfaces
  },
});

export default BrandLogo;
