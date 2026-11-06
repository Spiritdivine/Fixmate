import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';

export interface UserAvatarProps {
  url?: string | null;
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  fontSize?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  role?: 'CLIENT' | 'ARTISAN';
  showRoleBadge?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  url,
  avatarUrl,
  name = 'Client',
  size = 40,
  style,
  imageStyle,
  fontSize,
  borderWidth = 0,
  borderColor = 'transparent',
  backgroundColor = '#ECFDF5',
  textColor = '#1A4731',
  role = 'CLIENT',
  showRoleBadge = false,
}) => {
  const effectiveUrl = url || avatarUrl;
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [effectiveUrl]);

  const cleanName = (name || 'CL').includes('@') ? name.split('@')[0] : name || 'CL';
  const words = cleanName.trim().split(/\s+/).filter(Boolean);
  const initials = words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : (words[0]?.slice(0, 2) || 'CL').toUpperCase();

  const computedFontSize = fontSize || Math.max(10, Math.round(size * 0.38));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          borderColor,
        },
        style,
      ]}
    >
      {effectiveUrl && !hasError ? (
        <Image
          source={{ uri: effectiveUrl }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
            imageStyle,
          ]}
          onError={() => setHasError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: computedFontSize, color: textColor }]}>
            {initials}
          </Text>
        </View>
      )}

      {showRoleBadge && (
        <View
          style={[
            styles.roleBadgeDot,
            {
              backgroundColor: role === 'ARTISAN' ? '#D97706' : '#10B981',
              bottom: 0,
              right: 0,
              width: Math.max(8, Math.round(size * 0.26)),
              height: Math.max(8, Math.round(size * 0.26)),
              borderRadius: Math.round(size * 0.13),
              borderWidth: 1.5,
              borderColor: '#FFFFFF',
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  roleBadgeDot: {
    position: 'absolute',
  },
});

