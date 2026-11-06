import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Camera,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Check,
  User,
  Phone,
  Building,
  Sparkles,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets, useTheme } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { ProfileService } from '../../services/profile.service';
import { UploadService } from '../../services/upload.service';
import { useToast } from '../shared/ToastContext';
import { UserAvatar } from '../shared/UserAvatar';

interface ClientProfileEditScreenProps {
  onBack?: () => void;
  onNavigateToWallet?: () => void;
}

export const ClientProfileEditScreen: React.FC<ClientProfileEditScreenProps> = ({
  onBack,
  onNavigateToWallet,
}) => {
  const { user, updateUser } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const { colors, isDark } = useTheme();

  const [firstName, setFirstName] = useState(user?.clientProfile?.firstName || '');
  const [lastName, setLastName] = useState(user?.clientProfile?.lastName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || user?.phone || user?.clientProfile?.phone || '');
  const [companyName, setCompanyName] = useState(user?.clientProfile?.companyName || '');
  const [state, setState] = useState(user?.clientProfile?.state || 'Lagos');
  const [city, setCity] = useState(user?.clientProfile?.city || '');
  const [address, setAddress] = useState(user?.clientProfile?.address || '');
  const [secondaryContact, setSecondaryContact] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');

  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.avatarUrl || user?.clientProfile?.avatarUrl || null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pick / Take Avatar Image
  const handlePickAvatar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAvatarUri(asset.uri);
      setIsUploadingAvatar(true);

      try {
        const uploadedUrl = await UploadService.uploadImage(
          asset.uri,
          'avatars',
          `avatar_${user?.id || 'client'}.jpg`,
          'image/jpeg'
        );

        await ProfileService.updateAvatar(uploadedUrl);
        updateUser({
          avatarUrl: uploadedUrl,
          clientProfile: {
            ...(user?.clientProfile || {}),
            avatarUrl: uploadedUrl,
          } as any,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        showSuccess('Profile photo updated!');
      } catch (err: any) {
        showError('Could not upload avatar image');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      showError('Please enter your first name');
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
        companyName: companyName.trim() || undefined,
      });

      updateUser({
        phone: phone.trim(),
        phoneNumber: phone.trim(),
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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showSuccess('Profile & Service Location saved!');
    } catch (err: any) {
      showError(err?.response?.data?.message || err?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const clientName = firstName
    ? `${firstName} ${lastName}`.trim()
    : user?.email ? user.email.split('@')[0] : 'Valued Client';

  const initials = clientName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CL';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={onBack} hitSlop={touchTargets.hitSlop} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile & Addresses</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Manage your identity & repair locations</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveHeaderBtn, { backgroundColor: colors.primary }, isSaving && { opacity: 0.6 }]}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Upload Card */}
        <View style={[styles.avatarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.avatarWrap}>
            <UserAvatar
              avatarUrl={avatarUri}
              name={clientName}
              size={68}
              borderWidth={2}
              borderColor={colors.border}
            />

            <TouchableOpacity
              style={[styles.cameraBadge, { borderColor: isDark ? colors.surface : '#FFFFFF' }]}
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
              activeOpacity={0.8}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={14} color="#FFFFFF" strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.avatarMeta}>
            <Text style={[styles.userName, { color: colors.text }]}>{clientName}</Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email}</Text>
            {phone ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Phone size={11} color={isDark ? '#34D399' : colors.brand.forest} />
                <Text style={{ fontSize: 11, color: isDark ? '#34D399' : colors.brand.forest, fontWeight: '600' }}>
                  {phone}
                </Text>
              </View>
            ) : null}
            <View style={[styles.verifiedBadge, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <ShieldCheck size={12} color="#15803D" strokeWidth={2.5} />
              <Text style={[styles.verifiedBadgeText, isDark && { color: '#34D399' }]}>
                {user?.isKycVerified ? 'NIN Verified Client' : 'Active Homeowner Account'}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Platform Credibility Metrics */}
        <View style={[styles.credibilityCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <View style={styles.credItem}>
            <Text style={[styles.credVal, { color: isDark ? '#34D399' : colors.brand.forest }]}>100%</Text>
            <Text style={[styles.credLabel, { color: colors.textMuted }]}>On-Time Escrow Release</Text>
          </View>
          <View style={[styles.credDivider, { backgroundColor: colors.border }]} />
          <View style={styles.credItem}>
            <Text style={[styles.credVal, { color: isDark ? '#34D399' : colors.brand.forest }]}>5.0 ⭐</Text>
            <Text style={[styles.credLabel, { color: colors.textMuted }]}>Client Reputation</Text>
          </View>
          <View style={[styles.credDivider, { backgroundColor: colors.border }]} />
          <View style={styles.credItem}>
            <Text style={[styles.credVal, { color: isDark ? '#34D399' : colors.brand.forest }]}>Level 2</Text>
            <Text style={[styles.credLabel, { color: colors.textMuted }]}>Verified Status</Text>
          </View>
        </View>

        {/* Personal Details Form */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>FIRST NAME</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.text, borderColor: colors.border }]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>LAST NAME</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.text, borderColor: colors.border }]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>PRIMARY PHONE NUMBER (FOR ARTISAN DISPATCH)</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.text, borderColor: colors.border }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 08012345678"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>COMPANY OR ESTATE (OPTIONAL)</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.text, borderColor: colors.border }]}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="e.g. Victoria Crest Estate / Ikoyi Heights"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Primary Service Location & Address */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Default Service Location</Text>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>STATE</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.text, borderColor: colors.border }]}
                value={state}
                onChangeText={setState}
                placeholder="e.g. Lagos"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>CITY / LGA</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.text, borderColor: colors.border }]}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Lekki / Ikeja"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>STREET ADDRESS</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.text, borderColor: colors.border }]}
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Plot 12, Admiralty Way, Lekki Phase 1"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Alternative On-Site Contact */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>On-Site Emergency Contact</Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Person present at the property to receive the artisan if you are away.
          </Text>

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>CONTACT NAME</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.text, borderColor: colors.border }]}
                value={secondaryContact}
                onChangeText={setSecondaryContact}
                placeholder="e.g. House Caretaker"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>PHONE NUMBER</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: isDark ? colors.background : '#F3F4F6', color: colors.text, borderColor: colors.border }]}
                value={secondaryPhone}
                onChangeText={setSecondaryPhone}
                placeholder="e.g. 08098765432"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Save CTA */}
        <TouchableOpacity
          style={[styles.saveBottomBtn, { backgroundColor: colors.primary }, isSaving && { opacity: 0.6 }]}
          onPress={handleSaveProfile}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBottomBtnText}>Save Profile & Address Details</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  saveHeaderBtn: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: 48,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarInitials: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.brand.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  credibilityCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  credItem: {
    flex: 1,
    alignItems: 'center',
  },
  credVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  credLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  credDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 5,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveBottomBtn: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBottomBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
