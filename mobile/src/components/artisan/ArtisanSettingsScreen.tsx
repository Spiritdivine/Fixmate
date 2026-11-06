import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Shield,
  Key,
  Bell,
  MapPin,
  Lock,
  LogOut,
  Trash2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  Moon,
  Users,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { useToast } from '../shared/ToastContext';

interface ArtisanSettingsScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
}

export const ArtisanSettingsScreen: React.FC<ArtisanSettingsScreenProps> = ({
  onBack,
  onLogout,
}) => {
  const { user, logout, updateUser } = useAuthStore();
  const { showSuccess, showError, showInfo } = useToast();

  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [loudAlerts, setLoudAlerts] = useState<boolean>(true);
  const [autoOffline, setAutoOffline] = useState<boolean>(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);

  // Notification matrix
  const [pushLeads, setPushLeads] = useState<boolean>(true);
  const [smsPayouts, setSmsPayouts] = useState<boolean>(true);
  const [inAppMessages, setInAppMessages] = useState<boolean>(true);

  // Security PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentPinDigits, setCurrentPinDigits] = useState('');
  const [pinDigits, setPinDigits] = useState('');
  const [confirmPinDigits, setConfirmPinDigits] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Logout modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleUpdateRadius = async (km: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRadiusKm(km);
    showSuccess(`Operating radius set to ${km} km`);
  };

  const handleSavePin = async () => {
    if (pinDigits.length !== 4) {
      showError('Security PIN must be exactly 4 digits');
      return;
    }
    if (pinDigits !== confirmPinDigits) {
      showError('PIN numbers do not match');
      return;
    }

    setIsSettingPin(true);
    try {
      await AuthService.changeTransactionPin(currentPinDigits, pinDigits);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('4-Digit Security PIN configured successfully');
      setIsPinModalOpen(false);
      setCurrentPinDigits('');
      setPinDigits('');
      setConfirmPinDigits('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save Security PIN';
      showError(msg);
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      showError('Type "DELETE" to confirm account deactivation');
      return;
    }

    setIsDeleting(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showInfo('Account deactivation requested. Our team will review within 24h.');
      setIsDeleteModalOpen(false);
      setDeleteConfirmationText('');
    } catch {
      showError('Failed to request deactivation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePerformLogout = async () => {
    setIsLogoutModalOpen(false);
    try {
      await logout();
      onLogout?.();
    } catch {
      onLogout?.();
    }
  };

  const artisanName =
    user?.artisanProfile?.businessName ||
    (user as any)?.firstName ||
    (user?.email ? user.email.split('@')[0] : 'Artisan Specialist');

  const artisanTrade = user?.artisanProfile?.trade || 'Certified Specialist';
  const artisanContact = user?.phone || user?.email || 'Active Specialist';

  const initials =
    artisanName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AR';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <ArrowLeft size={20} color="#FFFFFF" />
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
                Play audible alert tone when an emergency repair is within 3 km.
              </Text>
            </View>
            <Switch
              value={loudAlerts}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLoudAlerts(val);
              }}
              trackColor={{ false: '#1A4D36', true: colors.brand.emerald }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Auto-Offline at Night */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>Auto-Offline after 8:00 PM</Text>
              <Text style={styles.switchSub}>Automatically silence lead radar overnight.</Text>
            </View>
            <Switch
              value={autoOffline}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAutoOffline(val);
              }}
              trackColor={{ false: '#1A4D36', true: colors.brand.emerald }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* SECTION 2: NOTIFICATIONS MATRIX */}
        <Text style={styles.sectionTitle}>Notification Channels</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>Push Notifications</Text>
              <Text style={styles.switchSub}>Instant alerts for newly dispatched jobs</Text>
            </View>
            <Switch
              value={pushLeads}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPushLeads(val);
              }}
              trackColor={{ false: '#1A4D36', true: colors.brand.emerald }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>SMS Alerts for Escrow Payouts</Text>
              <Text style={styles.switchSub}>Direct SMS notifications on bank settlements</Text>
            </View>
            <Switch
              value={smsPayouts}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSmsPayouts(val);
              }}
              trackColor={{ false: '#1A4D36', true: colors.brand.emerald }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>In-App Client Messages</Text>
              <Text style={styles.switchSub}>Banner alerts when client chats on active jobs</Text>
            </View>
            <Switch
              value={inAppMessages}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInAppMessages(val);
              }}
              trackColor={{ false: '#1A4D36', true: colors.brand.emerald }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* SECTION 3: SECURITY & PIN */}
        <Text style={styles.sectionTitle}>Security & Biometrics</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchTextGroup}>
              <Text style={styles.switchLabel}>Biometric Payout Lock</Text>
              <Text style={styles.switchSub}>
                Require FaceID or fingerprint before bank withdrawals.
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setBiometricsEnabled(val);
              }}
              trackColor={{ false: '#1A4D36', true: colors.brand.emerald }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsPinModalOpen(true);
            }}
          >
            <View style={styles.linkRowLeft}>
              <Key size={18} color={colors.brand.emerald} />
              <View>
                <Text style={styles.linkLabel}>Set 4-Digit Security PIN</Text>
                <Text style={styles.linkSub}>Used for wallet payouts and milestone approval</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.neutral[500]} />
          </TouchableOpacity>
        </View>

        {/* SECTION 4: APP INFO & ACTIONS */}
        <Text style={styles.sectionTitle}>Account & System</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>Artifix Pro v1.0.0 (Build 57)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Theme Engine</Text>
            <Text style={[styles.infoValue, { color: colors.brand.emerald }]}>Forest Dark Pro</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsLogoutModalOpen(true);
            }}
            style={styles.logoutBtn}
          >
            <LogOut size={16} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out of Artisan Account</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsDeleteModalOpen(true);
            }}
            style={styles.deleteBtn}
          >
            <Trash2 size={16} color={colors.neutral[400]} />
            <Text style={styles.deleteText}>Request Account Deactivation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 4-DIGIT PIN MODAL */}
      <Modal visible={isPinModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Key size={20} color={colors.brand.emerald} />
                <Text style={styles.modalTitle}>Set 4-Digit Security PIN</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPinModalOpen(false)}>
                <X size={20} color={colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Enter a memorable 4-digit code to authorize withdrawals and change bank details.
            </Text>

            <Text style={styles.pinLabel}>Current PIN (Leave empty if setting for first time)</Text>
            <TextInput
              style={styles.pinInput}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={currentPinDigits}
              onChangeText={setCurrentPinDigits}
              placeholder="••••"
              placeholderTextColor={colors.neutral[600]}
            />

            <Text style={styles.pinLabel}>New 4-Digit PIN</Text>
            <TextInput
              style={styles.pinInput}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={pinDigits}
              onChangeText={setPinDigits}
              placeholder="••••"
              placeholderTextColor={colors.neutral[600]}
            />

            <Text style={styles.pinLabel}>Confirm 4-Digit PIN</Text>
            <TextInput
              style={styles.pinInput}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={confirmPinDigits}
              onChangeText={setConfirmPinDigits}
              placeholder="••••"
              placeholderTextColor={colors.neutral[600]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsPinModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePin}
                disabled={isSettingPin}
                style={styles.modalSaveBtn}
              >
                {isSettingPin ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save PIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal visible={isLogoutModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.confirmBox}>
            <LogOut size={32} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.confirmTitle}>Log Out</Text>
            <Text style={styles.confirmSub}>
              Are you sure you want to log out of your Artifix artisan dashboard?
            </Text>
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                onPress={() => setIsLogoutModalOpen(false)}
                style={styles.confirmCancelBtn}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePerformLogout}
                style={styles.confirmDestructiveBtn}
              >
                <Text style={styles.confirmDestructiveText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DEACTIVATE ACCOUNT MODAL */}
      <Modal visible={isDeleteModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color="#EF4444" />
                <Text style={[styles.modalTitle, { color: '#EF4444' }]}>Deactivate Account</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDeleteModalOpen(false)}>
                <X size={20} color={colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Deactivating your artisan profile will remove you from the active radar and cancel all
              pending job dispatches. Any escrow funds must be settled first.
            </Text>

            <Text style={styles.pinLabel}>Type "DELETE" to confirm:</Text>
            <TextInput
              style={styles.pinInput}
              autoCapitalize="characters"
              value={deleteConfirmationText}
              onChangeText={setDeleteConfirmationText}
              placeholder="DELETE"
              placeholderTextColor={colors.neutral[600]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsDeleteModalOpen(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                style={[styles.modalSaveBtn, { backgroundColor: '#EF4444' }]}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Deactivate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071A11',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#133E2B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0E291D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.size.base + 2,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E291D',
    padding: spacing.base,
    borderRadius: radius.xl,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#1A4D36',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: typography.size.base,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  artisanName: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  badgeVerified: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeVerifiedText: {
    color: colors.brand.emerald,
    fontSize: 9,
    fontWeight: '800',
  },
  artisanTradeText: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[300],
    marginTop: 2,
  },
  artisanContactText: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.lg,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#1A4D36',
  },
  cardLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSub: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
    marginBottom: 12,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A4D36',
  },
  radiusPillActive: {
    backgroundColor: colors.brand.emerald,
    borderColor: colors.brand.emerald,
  },
  radiusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[300],
  },
  radiusTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#133E2B',
    marginVertical: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchSub: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  linkRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  linkLabel: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  linkSub: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[400],
  },
  infoValue: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: '#EF4444',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  deleteText: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[400],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0E291D',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#1A4D36',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: typography.size.base + 2,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[400],
    marginBottom: 16,
    lineHeight: 18,
  },
  pinLabel: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[300],
    marginBottom: 6,
  },
  pinInput: {
    backgroundColor: '#071A11',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#1A4D36',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: typography.size.md,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
    letterSpacing: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#1A4D36',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.neutral[300],
  },
  modalSaveBtn: {
    flex: 1.5,
    backgroundColor: colors.brand.emerald,
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  confirmBox: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#1A4D36',
    width: '100%',
    maxWidth: 340,
  },
  confirmTitle: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmSub: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#1A4D36',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.neutral[300],
  },
  confirmDestructiveBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  confirmDestructiveText: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
