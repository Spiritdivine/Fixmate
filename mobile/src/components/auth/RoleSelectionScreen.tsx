import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { BrandLogo } from '../shared/BrandLogo';

interface RoleSelectionScreenProps {
  onBack: () => void;
  onSelectRole: (role: 'CLIENT' | 'ARTISAN') => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onBack,
  onSelectRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<'CLIENT' | 'ARTISAN'>('CLIENT');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Type</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introWrap}>
          <BrandLogo variant="full" theme="light" size={42} style={{ alignSelf: 'flex-start', marginBottom: spacing.md }} />
          <Text style={styles.mainTitle}>How will you use Fixmate?</Text>
          <Text style={styles.subTitle}>
            Choose your profile type. You can switch between roles or manage both from your account settings later.
          </Text>
        </View>

        {/* Option 1: Client Card */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'CLIENT' && styles.roleCardActive,
          ]}
          onPress={() => setSelectedRole('CLIENT')}
          activeOpacity={0.8}
        >
          <View style={styles.radioHeader}>
            <View style={styles.iconBox}>
              <Text style={styles.iconEmoji}>🏡</Text>
            </View>
            <View style={styles.radioIndicator}>
              {selectedRole === 'CLIENT' && <View style={styles.radioDot} />}
            </View>
          </View>

          <Text style={styles.roleTitle}>I Need an Artisan</Text>
          <Text style={styles.roleBadge}>Client / Homeowner / Business</Text>
          <Text style={styles.roleDescription}>
            Find licensed electricians, plumbers, HVAC technicians, and carpenters with 100% smart escrow payment security.
          </Text>

          <View style={styles.perksList}>
            <Text style={styles.perkItem}>✓ Instant Oga John AI damage diagnostics</Text>
            <Text style={styles.perkItem}>✓ Funds held safely until you inspect & release</Text>
            <Text style={styles.perkItem}>✓ 30-day Fixmate warranty on all repairs</Text>
          </View>
        </TouchableOpacity>

        {/* Option 2: Artisan Card */}
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'ARTISAN' && styles.roleCardActive,
          ]}
          onPress={() => setSelectedRole('ARTISAN')}
          activeOpacity={0.8}
        >
          <View style={styles.radioHeader}>
            <View style={styles.iconBox}>
              <Text style={styles.iconEmoji}>🧰</Text>
            </View>
            <View style={styles.radioIndicator}>
              {selectedRole === 'ARTISAN' && <View style={styles.radioDot} />}
            </View>
          </View>

          <Text style={styles.roleTitle}>I Am a Skilled Artisan</Text>
          <Text style={styles.roleBadge}>Service Provider / Contractor</Text>
          <Text style={styles.roleDescription}>
            Get matched with pre-funded emergency job leads in your local area with guaranteed Paystack bank payouts.
          </Text>

          <View style={styles.perksList}>
            <Text style={styles.perkItem}>✓ Zero payment defaults — 100% pre-funded escrow</Text>
            <Text style={styles.perkItem}>✓ Instant radar dispatch within your GPS radius</Text>
            <Text style={styles.perkItem}>✓ Verified portfolio & Level 2 NIN trust badge</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Continue Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => onSelectRole(selectedRole)}
          activeOpacity={0.8}
        >
          <Text style={styles.continueBtnText}>
            Continue as {selectedRole === 'CLIENT' ? 'Client' : 'Artisan'} →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backBtnText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  introWrap: {
    marginBottom: spacing.lg,
  },
  mainTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subTitle: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  radioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  roleTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 2,
  },
  roleBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  roleDescription: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  perksList: {
    gap: 6,
    backgroundColor: 'rgba(26, 71, 49, 0.04)',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  perkItem: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  continueBtn: {
    backgroundColor: '#CBF7D2',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#153E2D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#153E2D',
  },
});
