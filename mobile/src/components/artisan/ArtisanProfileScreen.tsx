import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Camera,
  ShieldCheck,
  Eye,
  Star,
  Briefcase,
  Settings,
  ChevronRight,
  Plus,
  X,
  Save,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ProfileService } from '../../services/profile.service';
import { UploadService } from '../../services/upload.service';
import { ImageProcessor } from '../../lib/image-processor';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../shared/ToastContext';
import {
  ArtisanPublicProfilePreviewModal,
  ArtisanProfilePreviewData,
} from './ArtisanPublicProfilePreviewModal';

interface ArtisanProfileScreenProps {
  onBack?: () => void;
  onOpenKyc?: () => void;
  onOpenPortfolio?: () => void;
  onOpenReviews?: () => void;
  onOpenSettings?: () => void;
}

export const ArtisanProfileScreen: React.FC<ArtisanProfileScreenProps> = ({
  onBack,
  onOpenKyc,
  onOpenPortfolio,
  onOpenReviews,
  onOpenSettings,
}) => {
  const { user, updateUser } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const artisanProfile = user?.artisanProfile;

  const [title, setTitle] = useState(artisanProfile?.title || '');
  const [hourlyRate, setHourlyRate] = useState(
    artisanProfile?.hourlyRate ? String(artisanProfile.hourlyRate) : '5000'
  );
  const [experienceYears, setExperienceYears] = useState(
    artisanProfile?.yearsOfExperience ? String(artisanProfile.yearsOfExperience) : '5'
  );
  const [bio, setBio] = useState(artisanProfile?.bio || '');
  const [skills, setSkills] = useState<string[]>(
    artisanProfile?.skills && artisanProfile.skills.length > 0
      ? artisanProfile.skills
      : ['Electrical Installations', 'Maintenance & Diagnostics']
  );
  const [newSkillText, setNewSkillText] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.avatarUrl ||
      artisanProfile?.avatarUrl ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (artisanProfile) {
      if (artisanProfile.title) setTitle(artisanProfile.title);
      if (artisanProfile.hourlyRate) setHourlyRate(String(artisanProfile.hourlyRate));
      if (artisanProfile.yearsOfExperience) setExperienceYears(String(artisanProfile.yearsOfExperience));
      if (artisanProfile.bio) setBio(artisanProfile.bio);
      if (artisanProfile.skills && artisanProfile.skills.length > 0) setSkills(artisanProfile.skills);
    }
  }, [artisanProfile]);

  const displayName =
    artisanProfile?.businessName ||
    (user?.clientProfile?.firstName
      ? `${user.clientProfile.firstName} ${user.clientProfile.lastName || ''}`.trim()
      : null) ||
    user?.email?.split('@')[0] ||
    'Professional Artisan';

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingAvatar(true);
        const comp = await ImageProcessor.compressForInspection(result.assets[0].uri);
        const uploaded = await UploadService.uploadImage(comp, 'avatars');
        setAvatarUrl(uploaded);
        await ProfileService.updateArtisan({ avatarUrl: uploaded });
        updateUser({ avatarUrl: uploaded });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess('Profile photo updated successfully');
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to update avatar photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkillText.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      showError('Skill already added');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkills((prev) => [...prev, trimmed]);
    setNewSkillText('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await ProfileService.updateArtisan({
        title: title.trim(),
        hourlyRate: parseInt(hourlyRate, 10) || 5000,
        yearsOfExperience: parseInt(experienceYears, 10) || 1,
        bio: bio.trim(),
        skills,
      });

      if (user) {
        updateUser({
          ...user,
          artisanProfile: {
            ...user.artisanProfile,
            ...updated,
          },
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('Your professional profile has been saved.');
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewData: ArtisanProfilePreviewData = {
    fullName: displayName,
    avatarUrl,
    trade: title || 'Certified Specialist',
    rating: (artisanProfile as any)?.rating || 4.9,
    reviewCount: (artisanProfile as any)?.reviewCount || 24,
    completedJobsCount: (artisanProfile as any)?.completedJobsCount || 38,
    locationCity: (artisanProfile as any)?.city || 'Lagos, Nigeria',
    bio,
    hourlyRate: parseInt(hourlyRate, 10) || 5000,
    yearsExperience: parseInt(experienceYears, 10) || 5,
    isKycVerified: user?.isKycVerified ?? true,
    skills,
    portfolio: (artisanProfile as any)?.portfolio || [],
  };

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
          <Text style={styles.headerTitle}>My Profile & Identity</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsPreviewOpen(true);
            }}
            style={styles.previewBtn}
          >
            <Eye size={16} color={colors.brand.emerald} />
            <Text style={styles.previewBtnText}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={styles.saveBtn}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Photo Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Camera size={14} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.nameHeading}>{displayName}</Text>
          <View style={styles.verifiedRow}>
            <ShieldCheck size={14} color={colors.brand.emerald} />
            <Text style={styles.ratingSub}>
              {user?.isKycVerified ? 'Verified Pro Artisan' : 'Active Specialist'}
            </Text>
          </View>
        </View>

        {/* KYC Verification Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onOpenKyc}
          style={styles.kycBanner}
        >
          <View style={styles.kycLeft}>
            <View style={styles.kycIconWrap}>
              <ShieldCheck size={20} color={colors.brand.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kycTitle}>
                {user?.isKycVerified
                  ? 'Government ID Verified (Level 2)'
                  : 'Complete NIN Verification'}
              </Text>
              <Text style={styles.kycSub}>
                {user?.isKycVerified
                  ? 'National Identity Number (NIN) Linked'
                  : 'Get Verified Badge & 4x more lead dispatches'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.brand.emerald} />
        </TouchableOpacity>

        {/* Sub-Navigation Quick Cards */}
        <View style={styles.quickNavGrid}>
          {onOpenPortfolio && (
            <TouchableOpacity
              onPress={onOpenPortfolio}
              style={styles.quickNavCard}
              activeOpacity={0.85}
            >
              <Briefcase size={20} color={colors.brand.emerald} />
              <View style={styles.quickNavTextCol}>
                <Text style={styles.quickNavTitle}>Portfolio Showcase</Text>
                <Text style={styles.quickNavSub}>Manage verified work photos</Text>
              </View>
              <ChevronRight size={18} color={colors.neutral[500]} />
            </TouchableOpacity>
          )}

          {onOpenReviews && (
            <TouchableOpacity
              onPress={onOpenReviews}
              style={styles.quickNavCard}
              activeOpacity={0.85}
            >
              <Star size={20} color="#F59E0B" />
              <View style={styles.quickNavTextCol}>
                <Text style={styles.quickNavTitle}>Reviews & Ratings</Text>
                <Text style={styles.quickNavSub}>Client feedback & public replies</Text>
              </View>
              <ChevronRight size={18} color={colors.neutral[500]} />
            </TouchableOpacity>
          )}

          {onOpenSettings && (
            <TouchableOpacity
              onPress={onOpenSettings}
              style={styles.quickNavCard}
              activeOpacity={0.85}
            >
              <Settings size={20} color={colors.neutral[400]} />
              <View style={styles.quickNavTextCol}>
                <Text style={styles.quickNavTitle}>Artisan Settings</Text>
                <Text style={styles.quickNavSub}>Security PIN & notification matrix</Text>
              </View>
              <ChevronRight size={18} color={colors.neutral[500]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Professional Title Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Professional Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            placeholder="e.g. Master Electrician & Solar Specialist"
            placeholderTextColor={colors.neutral[500]}
            onChangeText={setTitle}
          />
        </View>

        {/* Hourly Rate & Years Experience */}
        <View style={styles.rowTwo}>
          <View style={styles.col}>
            <Text style={styles.label}>Hourly Rate (₦)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={hourlyRate}
              placeholderTextColor={colors.neutral[500]}
              onChangeText={setHourlyRate}
            />
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Years Experience</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={experienceYears}
              placeholderTextColor={colors.neutral[500]}
              onChangeText={setExperienceYears}
            />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Professional Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            value={bio}
            placeholder="Introduce your specializations, tools, and background..."
            placeholderTextColor={colors.neutral[500]}
            onChangeText={setBio}
          />
        </View>

        {/* Skills Tag Cloud */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Skills & Specializations</Text>
          <View style={styles.addSkillRow}>
            <TextInput
              style={[styles.input, styles.addSkillInput]}
              value={newSkillText}
              onChangeText={setNewSkillText}
              placeholder="Add skill tag (e.g. Inverter Wiring)"
              placeholderTextColor={colors.neutral[500]}
            />
            <TouchableOpacity
              onPress={handleAddSkill}
              style={styles.addSkillBtn}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.skillsCloud}>
            {skills.map((skill, index) => (
              <View key={index} style={styles.skillPill}>
                <Text style={styles.skillText}>{skill}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveSkill(skill)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <X size={12} color={colors.neutral[400]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Public Profile Preview Modal */}
      <ArtisanPublicProfilePreviewModal
        visible={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={previewData}
        onEditProfile={() => setIsPreviewOpen(false)}
      />
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
    justifyContent: 'space-between',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E291D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#1A4D36',
  },
  previewBtnText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.brand.emerald,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: spacing.base,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    width: 88,
    height: 88,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.brand.emerald,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.brand.emerald,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#071A11',
  },
  nameHeading: {
    fontSize: typography.size.lg,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  ratingSub: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[300],
    fontWeight: '600',
  },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E291D',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#1A4D36',
    marginBottom: spacing.base,
  },
  kycLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  kycIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kycSub: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  quickNavGrid: {
    gap: 8,
    marginBottom: spacing.lg,
  },
  quickNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#1A4D36',
    gap: 12,
  },
  quickNavTextCol: {
    flex: 1,
  },
  quickNavTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickNavSub: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[300],
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0E291D',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#1A4D36',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.size.sm,
    color: '#FFFFFF',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.base,
  },
  col: {
    flex: 1,
  },
  addSkillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addSkillInput: {
    flex: 1,
  },
  addSkillBtn: {
    backgroundColor: colors.brand.emerald,
    borderRadius: radius.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  skillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand.emerald,
  },
});
