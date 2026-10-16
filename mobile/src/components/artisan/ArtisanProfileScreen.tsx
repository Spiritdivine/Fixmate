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
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ProfileService } from '../../services/profile.service';
import { UploadService } from '../../services/upload.service';
import { ImageProcessor } from '../../lib/image-processor';
import { useAuthStore } from '../../stores/authStore';

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
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.avatarUrl || artisanProfile?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.response?.data?.message || 'Failed to update avatar photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
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

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Profile Saved', 'Your professional profile has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
          <Text style={styles.headerTitle}>My Profile & Identity</Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.brand.forest} />
          ) : (
            <Text style={styles.saveHeaderBtn}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Photo Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
            />
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.cameraBadgeIcon}>📷</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.nameHeading}>{displayName}</Text>
          <Text style={styles.ratingSub}>
            {user?.isKycVerified ? '🛡️ Verified Pro Artisan' : 'Active Specialist'}
          </Text>
        </View>

        {/* KYC Verification Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onOpenKyc}
          style={styles.kycBanner}
        >
          <View style={styles.kycLeft}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
            <View>
              <Text style={styles.kycTitle}>
                {user?.isKycVerified ? 'Government ID Verified (Level 2)' : 'Complete NIN Verification'}
              </Text>
              <Text style={styles.kycSub}>
                {user?.isKycVerified ? 'National Identity Number (NIN) Linked' : 'Get Verified Badge & 4x more lead dispatches'}
              </Text>
            </View>
          </View>
          <Text style={styles.chevronGreen}>›</Text>
        </TouchableOpacity>

        {/* Sub-Navigation Quick Cards */}
        <View style={styles.quickNavGrid}>
          {onOpenPortfolio && (
            <TouchableOpacity
              onPress={onOpenPortfolio}
              style={styles.quickNavCard}
              activeOpacity={0.85}
            >
              <Text style={styles.quickNavEmoji}>🖼️</Text>
              <View style={styles.quickNavTextCol}>
                <Text style={styles.quickNavTitle}>Portfolio Showcase</Text>
                <Text style={styles.quickNavSub}>Manage work photos</Text>
              </View>
              <Text style={styles.quickNavChevron}>›</Text>
            </TouchableOpacity>
          )}

          {onOpenReviews && (
            <TouchableOpacity
              onPress={onOpenReviews}
              style={styles.quickNavCard}
              activeOpacity={0.85}
            >
              <Text style={styles.quickNavEmoji}>⭐</Text>
              <View style={styles.quickNavTextCol}>
                <Text style={styles.quickNavTitle}>Client Reviews & Ratings</Text>
                <Text style={styles.quickNavSub}>Feedback & reputation</Text>
              </View>
              <Text style={styles.quickNavChevron}>›</Text>
            </TouchableOpacity>
          )}

          {onOpenSettings && (
            <TouchableOpacity
              onPress={onOpenSettings}
              style={styles.quickNavCard}
              activeOpacity={0.85}
            >
              <Text style={styles.quickNavEmoji}>⚙️</Text>
              <View style={styles.quickNavTextCol}>
                <Text style={styles.quickNavTitle}>Radar & App Settings</Text>
                <Text style={styles.quickNavSub}>Operating radius & alerts</Text>
              </View>
              <Text style={styles.quickNavChevron}>›</Text>
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
            placeholderTextColor={colors.neutral[400]}
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
              onChangeText={setHourlyRate}
            />
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Years Experience</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={experienceYears}
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
            placeholderTextColor={colors.neutral[400]}
            onChangeText={setBio}
          />
        </View>

        {/* Skills Tag Cloud */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Skills & Specializations</Text>
          <View style={styles.skillsCloud}>
            {skills.map((skill, index) => (
              <View key={index} style={styles.skillPill}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
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
    justifyContent: 'space-between',
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
  saveHeaderBtn: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.brand.forest,
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
    width: 84,
    height: 84,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.brand.forest,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.brand.forest,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraBadgeIcon: {
    fontSize: 12,
  },
  nameHeading: {
    fontSize: typography.size.lg,
    fontWeight: '900',
    color: colors.neutral[900],
    marginTop: 8,
  },
  ratingSub: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: spacing.base,
  },
  kycLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shieldEmoji: {
    fontSize: 20,
  },
  kycTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  kycSub: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 1,
  },
  chevronGreen: {
    fontSize: 20,
    color: colors.brand.emeraldDark,
    fontWeight: 'bold',
  },
  fieldGroup: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.size.sm,
    color: colors.neutral[900],
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.base,
  },
  col: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  skillsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  quickNavGrid: {
    gap: 10,
    marginBottom: spacing.base,
  },
  quickNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 12,
    ...shadows.sm,
  },
  quickNavEmoji: {
    fontSize: 24,
  },
  quickNavTextCol: {
    flex: 1,
  },
  quickNavTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  quickNavSub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  quickNavChevron: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.neutral[400],
  },
});
