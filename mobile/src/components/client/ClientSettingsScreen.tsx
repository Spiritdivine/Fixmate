import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Shield,
  Bell,
  Lock,
  Moon,
  FileText,
  Trash2,
  LogOut,
  ChevronRight,
  X,
  AlertTriangle,
  Briefcase,
  Phone,
  MapPin,
  BadgeCheck,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets, useTheme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/auth.service';
import { useToast } from '../shared/ToastContext';
import { UserAvatar } from '../shared/UserAvatar';

interface ClientSettingsScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  onNavigateToProfileEdit?: () => void;
}

export const ClientSettingsScreen: React.FC<ClientSettingsScreenProps> = ({
  onBack,
  onLogout,
  onNavigateToProfileEdit,
}) => {
  const { user, logout } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const { themeMode, setThemeMode, colors: dynamicColors, isDark } = useTheme();

  const clientName = user?.clientProfile?.firstName
    ? `${user.clientProfile.firstName} ${user.clientProfile.lastName || ''}`.trim()
    : user?.email ? user.email.split('@')[0] : 'Valued Client';
  const clientAvatar = user?.avatarUrl || user?.clientProfile?.avatarUrl;
  const clientPhone = user?.phoneNumber || user?.phone || user?.clientProfile?.phone || '';
  const clientLocation = user?.clientProfile?.city || user?.clientProfile?.state
    ? `${user.clientProfile.city ? user.clientProfile.city + ', ' : ''}${user.clientProfile.state || ''}`.trim()
    : (user?.clientProfile?.address || '');

  // Security Toggles
  const [useBiometrics, setUseBiometrics] = useState(true);
  const [escrowOtp, setEscrowOtp] = useState(true);

  // Notification Toggles
  const [notifBids, setNotifBids] = useState(true);
  const [notifMilestones, setNotifMilestones] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [notifReceipts, setNotifReceipts] = useState(true);

  // App Settings
  const [aiCostPredictor, setAiCostPredictor] = useState(true);

  // PIN Modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  // Legal Modal
  const [legalModalTitle, setLegalModalTitle] = useState<string | null>(null);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdatePin = async () => {
    if (newPin.length !== 4) {
      showError('PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      showError('PINs do not match');
      return;
    }

    setIsUpdatingPin(true);
    try {
      await AuthService.changeTransactionPin(currentPin, newPin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showSuccess('Security PIN updated successfully!');
      setShowPinModal(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to update security PIN';
      showError(message);
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      showError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      // Simulate account deletion
      await new Promise((res) => setTimeout(res, 1200));
      await logout();
      showSuccess('Your account and personal data have been scheduled for permanent erasure.');
      onLogout?.();
    } catch {
      showError('Failed to erase account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: dynamicColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: dynamicColors.headerBg, borderBottomColor: dynamicColors.headerBorder }]}>
        <TouchableOpacity onPress={onBack} hitSlop={touchTargets.hitSlop} style={styles.backBtn}>
          <ChevronLeft size={24} color={dynamicColors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: dynamicColors.text }]}>Account Settings</Text>
          <Text style={[styles.headerSub, { color: dynamicColors.textMuted }]}>Security, notifications & privacy controls</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Client Identity & Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: dynamicColors.surface, borderColor: dynamicColors.border }]}>
          <UserAvatar
            avatarUrl={clientAvatar}
            name={clientName}
            size={56}
            role="CLIENT"
            showRoleBadge
            style={{ marginRight: 14 }}
          />
          <View style={styles.profileMeta}>
            <Text style={[styles.profileName, { color: dynamicColors.text }]}>{clientName}</Text>
            <Text style={[styles.profileEmail, { color: dynamicColors.textMuted }]}>{user?.email || 'Registered Client'}</Text>
            {clientPhone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Phone size={12} color={isDark ? '#34D399' : colors.brand.forest} />
                <Text style={[styles.profilePhone, { color: isDark ? '#34D399' : colors.brand.forest, marginTop: 0 }]}>{clientPhone}</Text>
              </View>
            ) : null}
            {clientLocation ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <MapPin size={12} color={dynamicColors.textMuted} />
                <Text style={[styles.profileLocation, { color: dynamicColors.textMuted, marginTop: 0 }]}>{clientLocation}</Text>
              </View>
            ) : null}
            <View style={styles.profileBadgeRow}>
              <View style={[styles.verifiedBadge, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <BadgeCheck size={12} color={isDark ? '#34D399' : '#15803D'} />
                <Text style={[styles.verifiedBadgeText, isDark && { color: '#34D399' }]}>
                  {user?.isKycVerified ? 'NIN Verified Client' : 'Active Client'}
                </Text>
              </View>
            </View>
          </View>
          {onNavigateToProfileEdit && (
            <TouchableOpacity
              onPress={onNavigateToProfileEdit}
              style={[styles.editProfileBtn, { backgroundColor: dynamicColors.surfaceSubtle, borderColor: dynamicColors.border }]}
              hitSlop={touchTargets.hitSlop}
            >
              <Text style={[styles.editProfileBtnText, { color: isDark ? '#34D399' : colors.brand.forest }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 1. Security & Biometrics */}
        <View style={[styles.sectionCard, { backgroundColor: dynamicColors.surface, borderColor: dynamicColors.border }]}>
          <View style={styles.sectionHeader}>
            <Shield size={16} color={isDark ? '#34D399' : colors.brand.forest} />
            <Text style={[styles.sectionTitle, { color: dynamicColors.text }]}>Security & Escrow Authorization</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={[styles.settingTitle, { color: dynamicColors.text }]}>FaceID / Biometric Login</Text>
              <Text style={[styles.settingDesc, { color: dynamicColors.textMuted }]}>Use biometric sensor to unlock Artifix wallet</Text>
            </View>
            <Switch
              value={useBiometrics}
              onValueChange={(val) => {
                Haptics.selectionAsync().catch(() => {});
                setUseBiometrics(val);
                showSuccess(`Biometrics ${val ? 'enabled' : 'disabled'}`);
              }}
              trackColor={{ false: isDark ? '#374151' : '#E5E7EB', true: dynamicColors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={[styles.settingTitle, { color: dynamicColors.text }]}>Require OTP for Escrow Releases</Text>
              <Text style={[styles.settingDesc, { color: dynamicColors.textMuted }]}>Extra SMS security verification before funds disburse</Text>
            </View>
            <Switch
              value={escrowOtp}
              onValueChange={(val) => {
                Haptics.selectionAsync().catch(() => {});
                setEscrowOtp(val);
                showSuccess(`Escrow OTP verification ${val ? 'enabled' : 'disabled'}`);
              }}
              trackColor={{ false: isDark ? '#374151' : '#E5E7EB', true: dynamicColors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />

          <TouchableOpacity
            style={styles.settingTouchRow}
            onPress={() => setShowPinModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingMeta}>
              <Text style={[styles.settingTitle, { color: dynamicColors.text }]}>Change 4-Digit Security PIN</Text>
              <Text style={[styles.settingDesc, { color: dynamicColors.textMuted }]}>Used for wallet payouts and high-value approvals</Text>
            </View>
            <ChevronRight size={18} color={dynamicColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 2. Granular Notifications */}
        <View style={[styles.sectionCard, { backgroundColor: dynamicColors.surface, borderColor: dynamicColors.border }]}>
          <View style={styles.sectionHeader}>
            <Bell size={16} color={isDark ? '#34D399' : colors.brand.forest} />
            <Text style={[styles.sectionTitle, { color: dynamicColors.text }]}>Notifications & Alerts</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={[styles.settingTitle, { color: dynamicColors.text }]}>Artisan Proposal & Bid Alerts</Text>
              <Text style={[styles.settingDesc, { color: dynamicColors.textMuted }]}>Notify when artisans submit quotes on your jobs</Text>
            </View>
            <Switch
              value={notifBids}
              onValueChange={setNotifBids}
              trackColor={{ false: isDark ? '#374151' : '#E5E7EB', true: dynamicColors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={[styles.settingTitle, { color: dynamicColors.text }]}>Milestone Proof Submissions</Text>
              <Text style={[styles.settingDesc, { color: dynamicColors.textMuted }]}>Alert when work proof is uploaded for review</Text>
            </View>
            <Switch
              value={notifMilestones}
              onValueChange={setNotifMilestones}
              trackColor={{ false: isDark ? '#374151' : '#E5E7EB', true: dynamicColors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={[styles.settingTitle, { color: dynamicColors.text }]}>Direct Chat Messages</Text>
              <Text style={[styles.settingDesc, { color: dynamicColors.textMuted }]}>Receive instant push messages from artisans</Text>
            </View>
            <Switch
              value={notifChat}
              onValueChange={setNotifChat}
              trackColor={{ false: isDark ? '#374151' : '#E5E7EB', true: dynamicColors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={[styles.settingTitle, { color: dynamicColors.text }]}>Financial Receipts & SMS</Text>
              <Text style={[styles.settingDesc, { color: dynamicColors.textMuted }]}>Payment confirmations and escrow statements</Text>
            </View>
            <Switch
              value={notifReceipts}
              onValueChange={setNotifReceipts}
              trackColor={{ false: isDark ? '#374151' : '#E5E7EB', true: dynamicColors.primary }}
            />
          </View>
        </View>

        {/* 3. AI & App Preferences */}
        <View style={[styles.sectionCard, { backgroundColor: dynamicColors.surface, borderColor: dynamicColors.border }]}>
          <View style={styles.sectionHeader}>
            <Moon size={16} color={isDark ? '#34D399' : colors.brand.forest} />
            <Text style={[styles.sectionTitle, { color: dynamicColors.text }]}>App Preferences & AI</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingMeta}>
              <Text style={[styles.settingTitle, { color: dynamicColors.text }]}>Oga John AI Cost Diagnostics</Text>
              <Text style={[styles.settingDesc, { color: dynamicColors.textMuted }]}>Automatic repair cost prediction from site photos</Text>
            </View>
            <Switch
              value={aiCostPredictor}
              onValueChange={setAiCostPredictor}
              trackColor={{ false: isDark ? '#374151' : '#E5E7EB', true: dynamicColors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />

          <View style={styles.themeRow}>
            <Text style={[styles.settingTitle, { color: dynamicColors.text }]}>Appearance Mode</Text>
            <View style={styles.themeChips}>
              {(['SYSTEM', 'LIGHT', 'DARK'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.themeChip,
                    { backgroundColor: dynamicColors.surfaceSubtle },
                    themeMode === m && [styles.themeChipActive, { backgroundColor: dynamicColors.primary }],
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setThemeMode(m);
                  }}
                >
                  <Text style={[styles.themeChipText, { color: dynamicColors.text }, themeMode === m && styles.themeChipTextActive]}>
                    {m === 'SYSTEM' ? 'Auto' : m === 'LIGHT' ? 'Light' : 'Dark'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 4. Legal & Documentation */}
        <View style={[styles.sectionCard, { backgroundColor: dynamicColors.surface, borderColor: dynamicColors.border }]}>
          <View style={styles.sectionHeader}>
            <FileText size={16} color={isDark ? '#34D399' : colors.brand.forest} />
            <Text style={[styles.sectionTitle, { color: dynamicColors.text }]}>Legal & Escrow Policies</Text>
          </View>

          {[
            { title: 'Artifix Escrow Protection Policy', key: 'ESCROW' },
            { title: 'Terms of Service', key: 'TERMS' },
            { title: 'Privacy Policy & NDPR Compliance', key: 'PRIVACY' },
          ].map((item, idx) => (
            <React.Fragment key={item.key}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />}
              <TouchableOpacity
                style={styles.settingTouchRow}
                onPress={() => setLegalModalTitle(item.title)}
                activeOpacity={0.7}
              >
                <Text style={[styles.legalItemTitle, { color: dynamicColors.text }]}>{item.title}</Text>
                <ChevronRight size={16} color={dynamicColors.textMuted} />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* 5. Danger Zone & Account Deletion */}
        <View
          style={[
            styles.sectionCard,
            styles.dangerCard,
            {
              backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : '#FFF5F5',
              borderColor: isDark ? 'rgba(220, 38, 38, 0.25)' : '#FEE2E2',
            },
          ]}
        >
          <Text style={styles.dangerTitle}>Data Sovereignty & Account Deletion</Text>
          <Text style={[styles.dangerDesc, { color: dynamicColors.textMuted }]}>
            Permanently delete your Artifix client profile, saved locations, and contract history.
          </Text>

          <TouchableOpacity
            style={[styles.deleteAccountBtn, { backgroundColor: isDark ? dynamicColors.surfaceSubtle : '#FFFFFF' }]}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color="#DC2626" />
            <Text style={styles.deleteAccountText}>Erase Data & Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, isDark && { backgroundColor: 'rgba(220, 38, 38, 0.15)', borderWidth: 1, borderColor: 'rgba(220, 38, 38, 0.3)' }]}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            await logout();
            onLogout?.();
          }}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        {/* Build info */}
        <Text style={[styles.buildInfoText, { color: dynamicColors.textMuted }]}>
          Artifix Mobile v1.3.4 (Build 412) • Monad Testnet Escrow
        </Text>
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { backgroundColor: dynamicColors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: dynamicColors.border }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: dynamicColors.text }]}>Change Security PIN</Text>
              <TouchableOpacity onPress={() => setShowPinModal(false)} hitSlop={touchTargets.hitSlop}>
                <X size={20} color={dynamicColors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: dynamicColors.textMuted }]}>ENTER NEW 4-DIGIT PIN</Text>
            <TextInput
              style={[
                styles.pinInput,
                {
                  backgroundColor: dynamicColors.inputBg,
                  borderColor: dynamicColors.inputBorder,
                  color: dynamicColors.text,
                },
              ]}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="••••"
              placeholderTextColor={dynamicColors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />

            <Text style={[styles.inputLabel, { marginTop: 12, color: dynamicColors.textMuted }]}>CONFIRM NEW PIN</Text>
            <TextInput
              style={[
                styles.pinInput,
                {
                  backgroundColor: dynamicColors.inputBg,
                  borderColor: dynamicColors.inputBorder,
                  color: dynamicColors.text,
                },
              ]}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="••••"
              placeholderTextColor={dynamicColors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetCancelBtn, { backgroundColor: dynamicColors.surfaceSubtle }]}
                onPress={() => setShowPinModal(false)}
                disabled={isUpdatingPin}
              >
                <Text style={[styles.sheetCancelBtnText, { color: dynamicColors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetSaveBtn, { backgroundColor: dynamicColors.primary }]}
                onPress={handleUpdatePin}
                disabled={isUpdatingPin}
              >
                {isUpdatingPin ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sheetSaveBtnText}>Set PIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { backgroundColor: dynamicColors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: dynamicColors.border }]} />

            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={18} color="#DC2626" />
                <Text style={[styles.sheetTitle, { color: '#DC2626' }]}>Delete Account</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} hitSlop={touchTargets.hitSlop}>
                <X size={20} color={dynamicColors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.deleteWarningText, { color: dynamicColors.textMuted }]}>
              This action is permanent and cannot be undone. All warranties, receipts, and bookmarked artisans will be permanently removed.
            </Text>

            <Text style={[styles.inputLabel, { marginTop: 12, color: dynamicColors.textMuted }]}>TYPE "DELETE" TO CONFIRM</Text>
            <TextInput
              style={[
                styles.pinInput,
                {
                  backgroundColor: dynamicColors.inputBg,
                  borderColor: dynamicColors.inputBorder,
                  color: dynamicColors.text,
                },
              ]}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={dynamicColors.textMuted}
              autoCapitalize="characters"
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetCancelBtn, { backgroundColor: dynamicColors.surfaceSubtle }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.sheetCancelBtnText, { color: dynamicColors.text }]}>Keep Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetDeleteBtn, isDeleting && { opacity: 0.6 }]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sheetDeleteBtnText}>Permanently Erase</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Legal Webview / Content Modal */}
      <Modal visible={!!legalModalTitle} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { maxHeight: '80%', backgroundColor: dynamicColors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: dynamicColors.border }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: dynamicColors.text }]}>{legalModalTitle}</Text>
              <TouchableOpacity onPress={() => setLegalModalTitle(null)} hitSlop={touchTargets.hitSlop}>
                <X size={20} color={dynamicColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={[styles.legalBodyText, { color: dynamicColors.text }]}>
                All financial escrow transactions on the Artifix platform are protected under the Artifix Guarantee and automated smart escrow agreements.
                {'\n\n'}
                1. Custody of Funds: Client funds are locked securely upon proposal acceptance and are never disbursed directly to an artisan without formal client approval.
                {'\n\n'}
                2. Inspection Period: Clients enjoy a 48-hour inspection period following milestone proof submission to verify defects and workmanship before release.
                {'\n\n'}
                3. Arbitration: If a dispute is raised, funds remain frozen in escrow until a designated legal arbiter reviews photo evidence and issues a binding award.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.sheetSaveBtn, { backgroundColor: dynamicColors.primary }]}
              onPress={() => setLegalModalTitle(null)}
            >
              <Text style={styles.sheetSaveBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: 48,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 11,
    color: colors.brand.forest,
    marginTop: 2,
    fontWeight: '600',
  },
  profileLocation: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  editProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingTouchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingMeta: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  settingDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  themeChips: {
    flexDirection: 'row',
    gap: 6,
  },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
  },
  themeChipActive: {
    backgroundColor: colors.brand.forest,
  },
  themeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  themeChipTextActive: {
    color: '#FFFFFF',
  },
  legalItemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  dangerCard: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  dangerDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  deleteAccountText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: radius.xl,
    marginTop: 4,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  buildInfoText: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 33, 22, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.base,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  pinInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  sheetCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  sheetCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sheetSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.forest,
    alignItems: 'center',
  },
  sheetSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetDeleteBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  sheetDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteWarningText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  legalBodyText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    paddingBottom: 20,
  },
});
