import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Bell, Shield, ChevronRight, QrCode } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BrandLogo } from './BrandLogo';
import { UserAvatar } from './UserAvatar';
import { colors, spacing, radius, typography, touchTargets } from '../../theme';

interface AppHeaderProps {
  location?: string;
  unreadCount?: number;
  userAvatarUrl?: string;
  userName?: string;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  onScanPress?: () => void;
  theme?: 'light' | 'dark'; // Dark theme for artisan header
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  location = 'Lekki Phase 1, Lagos',
  unreadCount = 3,
  userAvatarUrl,
  userName = 'Client',
  onLocationPress,
  onNotificationPress,
  onAvatarPress,
  onScanPress,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  const initials = (userName || 'Client')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CL';

  const handleAvatar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onAvatarPress?.();
  };

  const handleLocation = () => {
    Haptics.selectionAsync().catch(() => {});
    onLocationPress?.();
  };

  const handleNotification = () => {
    Haptics.selectionAsync().catch(() => {});
    onNotificationPress?.();
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onScanPress?.();
  };

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {/* Left: Avatar & Logo */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          onPress={handleAvatar}
          activeOpacity={0.8}
          hitSlop={touchTargets.hitSlop}
          style={styles.avatarButton}
        >
          <UserAvatar
            avatarUrl={userAvatarUrl}
            name={userName}
            size={36}
            backgroundColor={isDark ? 'rgba(52, 211, 153, 0.2)' : '#ECFDF5'}
            textColor={isDark ? '#34D399' : '#1A4731'}
          />
        </TouchableOpacity>

        {/* Clean Brand Monogram Icon Mark (Without Fixmate text title) */}
        <BrandLogo variant="mark" theme={isDark ? 'dark' : 'light'} size={28} />
      </View>

      {/* Middle/Location Pill */}
      <TouchableOpacity
        onPress={handleLocation}
        activeOpacity={0.8}
        hitSlop={touchTargets.hitSlop}
        style={[styles.locationPill, isDark ? styles.locationPillDark : styles.locationPillLight]}
      >
        <MapPin
          size={13}
          color={isDark ? colors.icons.accent : colors.icons.primary}
          strokeWidth={1.85}
        />
        <Text
          numberOfLines={1}
          style={[styles.locationText, isDark && styles.locationTextDark]}
        >
          {location}
        </Text>
        <ChevronRight
          size={13}
          color={isDark ? '#D1FAE5' : colors.neutral[500]}
          strokeWidth={1.85}
        />
      </TouchableOpacity>

      {/* Right: Actions */}
      <View style={styles.rightSection}>
        {onScanPress && (
          <TouchableOpacity
            onPress={handleScan}
            activeOpacity={0.8}
            hitSlop={touchTargets.hitSlop}
            style={[styles.bellButton, isDark && styles.bellButtonDark, { marginRight: 6 }]}
          >
            <QrCode
              size={18}
              color={isDark ? '#F3F4F6' : colors.icons.primary}
              strokeWidth={1.85}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleNotification}
          activeOpacity={0.8}
          hitSlop={touchTargets.hitSlop}
          style={[styles.bellButton, isDark && styles.bellButtonDark]}
        >
          <Bell
            size={18}
            color={isDark ? '#F3F4F6' : colors.icons.primary}
            strokeWidth={1.85}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  containerDark: {
    backgroundColor: colors.brand.forest,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.brand.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.brand.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 14,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.neutral[900],
    letterSpacing: -0.3,
  },
  brandTextDark: {
    color: '#FFFFFF',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 4,
    maxWidth: 150,
  },
  locationPillLight: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationPillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  locationPin: {
    fontSize: 11,
  },
  locationText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '600',
    color: colors.neutral[800],
    flexShrink: 1,
  },
  locationTextDark: {
    color: '#FFFFFF',
  },
  locationChevron: {
    fontSize: 15,
    color: colors.neutral[500],
    fontWeight: '700',
    marginLeft: 2,
  },
  locationChevronDark: {
    color: '#D1FAE5',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  bellIcon: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.status.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
