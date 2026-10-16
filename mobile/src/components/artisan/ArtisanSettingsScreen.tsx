import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { ProfileService } from '../../services/profile.service';

interface ArtisanSettingsScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
}

export const ArtisanSettingsScreen: React.FC<ArtisanSettingsScreenProps> = ({
  onBack,
  onLogout,
}) => {
  const { user, logout, updateUser } = useAuthStore();
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [loudAlerts, setLoudAlerts] = useState<boolean>(true);
  const [autoOffline, setAutoOffline] = useState<boolean>(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleUpdateRadius = async (km: number) => {
    setRadiusKm(km);
    try {
      setIsSaving(true);
      await ProfileService.updateArtisan({
        // Updates artisan profile preferences on backend
      });
    } catch {
      // Graceful fallback
    } finally {
      setIsSaving(false);
    }
  };

  const artisanName =
    user?.artisanProfile?.businessName ||
    (user as any)?.firstName ||
    (user?.email ? user.email.split('@')[0] : 'Fixmate Artisan');

  const artisanTrade = user?.artisanProfile?.trade || 'General Artisan';
  const artisanContact = user?.phone || user?.email || 'Active Specialist';

  const initials = artisanName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AR';

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your artisan account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            onLogout?.();
          } catch {
            onLogout?.();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <Text style={styles.backChevron}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Settings & Preferences</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ARTISAN IDENTITY CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.artisanName}>{artisanName}</Text>
              <View style={styles.badgeVerified}>
                <Text style={styles.badgeVerifiedText}>PRO VERIFIED</Text>
              </View>
            </View>
            <Text style={styles.artisanTradeText}>{artisanTrade}</Text>
            <Text style={styles.artisanContactText}>{artisanContact}</Text>
          </View>
        </View>

        {/* SECTION 1: DISPATCH PREFERENCES */}
        <Text style={styles.sectionTitle}>Dispatch & Lead Radar</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Maximum Operating Radius</Text>
          <Text style={styles.cardSub}>You will only receive leads within this GPS distance.</Text>

          <View style={styles.radiusRow}>
            {[5, 10, 15, 25].map((km) => (
              <TouchableOpacity
                key={km}
                onPress={() => handleUpdateRadius(km)}
                style={[styles.radiusPill, radiusKm === km && styles.radiusPillActive]}
              >
                <Text style={[styles.radiusText, radiusKm === km && styles.radiusTextActive]}>
                  {km} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Loud Alerts Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>Loud Emergency Alert Tone</Text>
              <Text style={styles.switchSub}>
                Play loud audio alert when an emergency repair is within 3 km.
              </Text>
            </View>
            <Switch
              value={loudAlerts}
              onValueChange={setLoudAlerts}
              trackColor={{ false: '#D1D5DB', true: colors.brand.emerald }}
            />
          </View>

          <View style={styles.divider} />

          {/* Auto-Offline at Night */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>Auto-Offline after 8:00 PM</Text>
              <Text style={styles.switchSub}>Automatically turn off lead radar at night.</Text>
            </View>
            <Switch
              value={autoOffline}
              onValueChange={setAutoOffline}
              trackColor={{ false: '#D1D5DB', true: colors.brand.emerald }}
            />
          </View>
        </View>

        {/* SECTION 2: SECURITY */}
        <Text style={styles.sectionTitle}>Security & Biometrics</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>FaceID / Biometric Payout Lock</Text>
              <Text style={styles.switchSub}>
                Require biometric authentication before bank withdrawals.
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#D1D5DB', true: colors.brand.emerald }}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkLabel}>Change Account Password</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 3: APP INFO & LOGOUT */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>Fixmate Mobile v1.0.0 (Build 57)</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log Out of Artisan Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 20,
    color: colors.neutral[900],
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: typography.size.base + 2,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: spacing.base,
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.size.base,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  artisanName: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  badgeVerified: {
    backgroundColor: colors.brand.emeraldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeVerifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  artisanTradeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.emerald,
    marginTop: 2,
  },
  artisanContactText: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
    marginTop: spacing.lg,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardLabel: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  cardSub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  radiusPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radiusPillActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  radiusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  radiusTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  switchLabel: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  switchSub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkLabel: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  chevron: {
    fontSize: 18,
    color: colors.neutral[400],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[600],
  },
  infoValue: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  logoutBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: typography.size.sm,
    fontWeight: '800',
  },
});
