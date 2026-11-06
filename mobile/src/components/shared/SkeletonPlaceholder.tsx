import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadows, useTheme } from '../../theme';

interface SkeletonPlaceholderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radius.sm,
  style,
}) => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity: 0.65,
          backgroundColor: isDark ? '#2D3748' : (colors.skeleton?.base || '#E5E7EB'),
        },
        style,
      ]}
    />
  );
};

/**
 * Shimmer card matching the layout of a Job card in MyJobsScreen
 */
export const SkeletonJobCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, style]}>
      <View style={styles.rowBetween}>
        <SkeletonPlaceholder width={110} height={22} borderRadius={radius.full} />
        <SkeletonPlaceholder width={70} height={16} borderRadius={radius.sm} />
      </View>
      <View style={{ marginTop: 12 }}>
        <SkeletonPlaceholder width="80%" height={20} borderRadius={radius.sm} />
      </View>
      <View style={{ marginTop: 8 }}>
        <SkeletonPlaceholder width="95%" height={14} borderRadius={radius.sm} />
        <SkeletonPlaceholder width="60%" height={14} borderRadius={radius.sm} style={{ marginTop: 4 }} />
      </View>
      <View style={[styles.rowBetween, { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: themeColors.border }]}>
        <SkeletonPlaceholder width={90} height={18} borderRadius={radius.sm} />
        <SkeletonPlaceholder width={100} height={28} borderRadius={radius.full} />
      </View>
    </View>
  );
};

/**
 * Shimmer card matching the layout of a Contract card in ClientContractsListScreen
 */
export const SkeletonContractCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, style]}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <SkeletonPlaceholder width={40} height={40} borderRadius={20} />
          <View>
            <SkeletonPlaceholder width={120} height={16} borderRadius={radius.sm} />
            <SkeletonPlaceholder width={80} height={12} borderRadius={radius.sm} style={{ marginTop: 4 }} />
          </View>
        </View>
        <SkeletonPlaceholder width={75} height={22} borderRadius={radius.full} />
      </View>
      <View style={{ marginTop: 12 }}>
        <SkeletonPlaceholder width="75%" height={18} borderRadius={radius.sm} />
      </View>
      <View style={{ marginTop: 12 }}>
        <SkeletonPlaceholder width="100%" height={6} borderRadius={radius.full} />
      </View>
      <View style={[styles.rowBetween, { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: themeColors.border }]}>
        <SkeletonPlaceholder width={100} height={16} borderRadius={radius.sm} />
        <SkeletonPlaceholder width={90} height={20} borderRadius={radius.sm} />
      </View>
    </View>
  );
};

/**
 * Shimmer card matching the layout of an Artisan card in SavedArtisans / Discovery
 */
export const SkeletonArtisanCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonPlaceholder width={52} height={52} borderRadius={26} />
        <View style={{ flex: 1 }}>
          <SkeletonPlaceholder width={140} height={18} borderRadius={radius.sm} />
          <SkeletonPlaceholder width={100} height={14} borderRadius={radius.sm} style={{ marginTop: 5 }} />
          <SkeletonPlaceholder width={80} height={12} borderRadius={radius.sm} style={{ marginTop: 5 }} />
        </View>
        <SkeletonPlaceholder width={70} height={32} borderRadius={radius.full} />
      </View>
    </View>
  );
};

/**
 * Shimmer card matching the layout of a Proposal in JobDetailsAndProposalsScreen
 */
export const SkeletonProposalCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, style]}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <SkeletonPlaceholder width={44} height={44} borderRadius={22} />
          <View>
            <SkeletonPlaceholder width={130} height={16} borderRadius={radius.sm} />
            <SkeletonPlaceholder width={85} height={13} borderRadius={radius.sm} style={{ marginTop: 4 }} />
          </View>
        </View>
        <SkeletonPlaceholder width={90} height={22} borderRadius={radius.sm} />
      </View>
      <View style={{ marginTop: 12 }}>
        <SkeletonPlaceholder width="100%" height={14} borderRadius={radius.sm} />
        <SkeletonPlaceholder width="70%" height={14} borderRadius={radius.sm} style={{ marginTop: 4 }} />
      </View>
      <View style={{ marginTop: 14, flexDirection: 'row', gap: 10 }}>
        <SkeletonPlaceholder width="100%" height={44} borderRadius={radius.md} />
      </View>
    </View>
  );
};

/**
 * Shimmer row matching a Notification item in ClientNotificationsScreen
 */
export const SkeletonNotificationItem: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.notificationRow, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, style]}>
      <SkeletonPlaceholder width={42} height={42} borderRadius={21} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <SkeletonPlaceholder width="75%" height={16} borderRadius={radius.sm} />
        <SkeletonPlaceholder width="95%" height={13} borderRadius={radius.sm} style={{ marginTop: 5 }} />
        <SkeletonPlaceholder width={80} height={11} borderRadius={radius.sm} style={{ marginTop: 5 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.skeleton?.base || '#E5E7EB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
