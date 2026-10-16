import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { ProfileService } from '../../services/profile.service';
import { WalletService } from '../../services/wallet.service';

interface ClientProfileSettingsScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  onNavigateToWallet?: () => void;
}

export const ClientProfileSettingsScreen: React.FC<ClientProfileSettingsScreenProps> = ({
  onBack,
  onLogout,
  onNavigateToWallet,
}) => {
  const { user, logout, updateUser } = useAuthStore();
  const [useBiometrics, setUseBiometrics] = useState(true);
  const [escrowOtp, setEscrowOtp] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);

  // Live profile form state
  const [firstName, setFirstName] = useState(user?.clientProfile?.firstName || '');
  const [lastName, setLastName] = useState(user?.clientProfile?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || user?.clientProfile?.phone || '');
  const [state, setState] = useState(user?.clientProfile?.state || 'Lagos');
  const [city, setCity] = useState(user?.clientProfile?.city || '');
  const [address, setAddress] = useState(user?.clientProfile?.address || '');
  const [isSaving, setIsSaving] = useState(false);

  // Live bank accounts for refund & payout
  const { data: savedBanks } = useQuery({
    queryKey: ['saved-banks'],
    queryFn: () => WalletService.getBanks(),
  });

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('First Name Required', 'Please provide your first name.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await ProfileService.updateClient({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        state: state.trim(),
        city: city.trim(),
        address: address.trim(),
      });

      updateUser({
        phone: phone.trim(),
        clientProfile: {
          ...(user?.clientProfile || {}),
          ...updated,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          state: state.trim(),
          city: city.trim(),
          address: address.trim(),
        } as any,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Profile Saved', 'Your client details and service location have been updated.');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      Alert.alert('Update Failed', apiErr?.response?.data?.message || apiErr?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const clientName = firstName
    ? `${firstName} ${lastName}`.trim()
    : user?.email ? user.email.split('@')[0] : 'Fixmate Client';

  const clientContact = phone || user?.email || 'Registered User';
  const initials = clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CL';

  const handleLogoutPress = async () => {
    try {
      await logout();
      onLogout?.();
    } catch {
      onLogout?.();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Dossier */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{clientName}</Text>
            <Text style={styles.profileContact}>{clientContact}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>
                {user?.isKycVerified ? '✓ Verified Identity' : '✓ Active Client Account'}
              </Text>
            </View>
          </View>
        </View>

        {/* Live Personal Details Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal & Contact Details</Text>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>FIRST NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="First name"
                placeholderTextColor={colors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>LAST NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Last name"
                placeholderTextColor={colors.textMuted}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>PHONE NUMBER (FOR ARTISAN DISPATCH)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 08012345678"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Primary Service Location & Address */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Primary Service Location</Text>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>STATE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Lagos"
                placeholderTextColor={colors.textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>CITY / LGA</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Lekki / Ikeja"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>STREET ADDRESS</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
            placeholderTextColor={colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSaveProfile}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Details</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security & Escrow Safeguards */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Security & Escrow Authorization</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>FaceID / Biometric Login</Text>
              <Text style={styles.settingDesc}>Use biometric sensor to unlock Fixmate wallet</Text>
            </View>
            <Switch
              value={useBiometrics}
              onValueChange={setUseBiometrics}
              trackColor={{ false: '#E5E7EB', true: colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Require OTP for Escrow Releases</Text>
              <Text style={styles.settingDesc}>Extra SMS security code before funds disburse</Text>
            </View>
            <Switch
              value={escrowOtp}
              onValueChange={setEscrowOtp}
              trackColor={{ false: '#E5E7EB', true: colors.primary }}
            />
          </View>
        </View>

        {/* Linked Bank Accounts */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Linked Bank Accounts</Text>
            {onNavigateToWallet && (
              <TouchableOpacity onPress={onNavigateToWallet}>
                <Text style={styles.sectionAction}>Manage in Wallet ›</Text>
              </TouchableOpacity>
            )}
          </View>

          {savedBanks && savedBanks.length > 0 ? (
            savedBanks.map((b: any, idx: number) => (
              <React.Fragment key={b.id || idx}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.bankItem}>
                  <Text style={styles.cardIcon}>🏦</Text>
                  <View style={styles.bankItemMeta}>
                    <Text style={styles.bankItemName}>{b.bankName} •••• {b.accountNumber.slice(-4)}</Text>
                    <Text style={styles.bankItemSub}>{b.accountName} • Verified NUBAN</Text>
                  </View>
                </View>
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyBankNotice}>
              <Text style={styles.emptyBankText}>
                No payout bank accounts linked yet. Link an account in your Wallet to receive instant NIP refunds.
              </Text>
            </View>
          )}
        </View>

        {/* Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Get instant notifications when artisan bids</Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: '#E5E7EB', true: colors.primary }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingTitle}>Oga John AI Cost Predictor</Text>
              <Text style={styles.settingDesc}>Auto analyze uploaded damage photos</Text>
            </View>
            <Switch
              value={aiSuggestions}
              onValueChange={setAiSuggestions}
              trackColor={{ false: '#E5E7EB', true: colors.primary }}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
    gap: spacing.md,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    color: colors.text,
  },
  profileContact: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  addressIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  addressMeta: {
    flex: 1,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  defaultTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defaultTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addressDetails: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  settingMeta: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  settingTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  settingDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  cardIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  paymentMeta: {
    flex: 1,
  },
  cardName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: spacing.xs,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  bankItemMeta: {
    flex: 1,
  },
  bankItemName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  bankItemSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyBankNotice: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyBankText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  logoutBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#DC2626',
  },
});
