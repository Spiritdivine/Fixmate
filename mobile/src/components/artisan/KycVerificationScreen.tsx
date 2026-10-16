import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ProfileService, KycSubmissionPayload } from '../../services/profile.service';
import { ImageProcessor } from '../../lib/image-processor';
import { UploadService } from '../../services/upload.service';

interface KycVerificationScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export const KycVerificationScreen: React.FC<KycVerificationScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [docType, setDocType] = useState<'NIN' | 'VOTER' | 'DRIVERS'>('NIN');
  const [ninNumber, setNinNumber] = useState('');
  const [isFrontUploaded, setIsFrontUploaded] = useState(false);
  const [isSelfieCaptured, setIsSelfieCaptured] = useState(false);
  const [frontDocUrl, setFrontDocUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const compressedUri = await ImageProcessor.compressForInspection(result.assets[0].uri);
        const url = await UploadService.uploadImage(compressedUri, 'kyc_documents');
        setFrontDocUrl(url);
        setIsFrontUploaded(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.response?.data?.message || 'Failed to upload document photo.');
    }
  };

  const handleCaptureSelfie = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const compressedUri = await ImageProcessor.compressForInspection(result.assets[0].uri);
        const url = await UploadService.uploadImage(compressedUri, 'kyc_documents');
        setSelfieUrl(url);
        setIsSelfieCaptured(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err?.response?.data?.message || 'Failed to capture selfie.');
    }
  };

  const handleSubmit = async () => {
    const cleanNumber = ninNumber.trim();
    if (!cleanNumber) {
      Alert.alert('Required', 'Please enter your government document identification number.');
      return;
    }

    if (docType === 'NIN' && cleanNumber.length !== 11) {
      Alert.alert('Invalid NIN', 'Your National Identity Number (NIN) must be exactly 11 numeric digits.');
      return;
    }

    if (!frontDocUrl) {
      Alert.alert('Document Required', 'Please upload or snap a photo of your ID document front.');
      return;
    }

    if (!selfieUrl) {
      Alert.alert('Selfie Required', 'Please snap a real-time portrait selfie for biometric matching.');
      return;
    }

    setIsSubmitting(true);
    try {
      const typeMapped: KycSubmissionPayload['documentType'] =
        docType === 'NIN' ? 'NIN' : docType === 'DRIVERS' ? 'DRIVERS_LICENSE' : 'NATIONAL_ID';

      await ProfileService.submitKyc({
        documentType: typeMapped,
        documentNumber: cleanNumber,
        documentUrl: frontDocUrl,
        selfieUrl,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Documents Submitted',
        'Your verification documents have been transmitted for automated database verification. Your verified artisan badge will activate once matched.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Verification Error', err?.response?.data?.message || err?.message || 'Failed to submit verification.');
    } finally {
      setIsSubmitting(false);
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
          <Text style={styles.headerTitle}>Identity Verification</Text>
        </View>
        <Text style={styles.tierText}>Level 2 KYC</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trust Card */}
        <View style={styles.trustCard}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <View style={styles.trustTextGroup}>
            <Text style={styles.trustHeading}>Verified Artisan Badge</Text>
            <Text style={styles.trustSub}>
              Government-verified artisans receive 4x more direct client hire requests and
              escrow release priority.
            </Text>
          </View>
        </View>

        {/* Document Type Selector */}
        <Text style={styles.sectionTitle}>Select ID Document Type</Text>
        <View style={styles.typeSelectorRow}>
          <TouchableOpacity
            onPress={() => setDocType('NIN')}
            style={[styles.typeBtn, docType === 'NIN' && styles.typeBtnActive]}
          >
            <Text style={[styles.typeText, docType === 'NIN' && styles.typeTextActive]}>
              NIN Slip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDocType('VOTER')}
            style={[styles.typeBtn, docType === 'VOTER' && styles.typeBtnActive]}
          >
            <Text style={[styles.typeText, docType === 'VOTER' && styles.typeTextActive]}>
              Voter's Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDocType('DRIVERS')}
            style={[styles.typeBtn, docType === 'DRIVERS' && styles.typeBtnActive]}
          >
            <Text style={[styles.typeText, docType === 'DRIVERS' && styles.typeTextActive]}>
              Driver's Lic.
            </Text>
          </TouchableOpacity>
        </View>

        {/* NIN Number Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>11-Digit National Identity Number (NIN)</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            maxLength={11}
            value={ninNumber}
            onChangeText={setNinNumber}
          />
        </View>

        {/* Upload Slots */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Document Capture</Text>
        <View style={styles.uploadCard}>
          <View style={styles.uploadLeft}>
            <Text style={styles.uploadIcon}>🪪</Text>
            <View>
              <Text style={styles.uploadTitle}>Front of ID Document</Text>
              <Text style={styles.uploadSub}>
                {isFrontUploaded ? 'NIN Slip Captured ✓' : 'Tap to scan card'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handlePickDocument}
            style={styles.retakeBtn}
          >
            <Text style={styles.retakeText}>{isFrontUploaded ? 'Retake' : 'Scan'}</Text>
          </TouchableOpacity>
        </View>

        {/* Selfie Liveness */}
        <View style={styles.uploadCard}>
          <View style={styles.uploadLeft}>
            <Text style={styles.uploadIcon}>🤳</Text>
            <View>
              <Text style={styles.uploadTitle}>Facial Liveness Selfie</Text>
              <Text style={styles.uploadSub}>
                {isSelfieCaptured ? 'Selfie Matched with ID ✓' : 'Tap to take live photo'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCaptureSelfie}
            style={styles.retakeBtn}
          >
            <Text style={styles.retakeText}>{isSelfieCaptured ? 'Retake' : 'Snap'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Bottom Submit */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitBtn}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Submit for Verification</Text>
          )}
        </TouchableOpacity>
      </View>
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
  tierText: {
    fontSize: 11,
    color: colors.brand.emeraldDark,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 100,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: spacing.base,
    borderRadius: radius.xl,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 12,
  },
  shieldIcon: {
    fontSize: 28,
  },
  trustTextGroup: {
    flex: 1,
  },
  trustHeading: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  trustSub: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
    marginTop: spacing.lg,
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeBtnActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginTop: spacing.base,
  },
  inputLabel: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.brand.forest,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.neutral[900],
    letterSpacing: 1.5,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
  },
  uploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadIcon: {
    fontSize: 22,
  },
  uploadTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  uploadSub: {
    fontSize: 11,
    color: colors.brand.emeraldDark,
    marginTop: 2,
    fontWeight: '600',
  },
  retakeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  retakeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  submitBtn: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    ...shadows.base,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
  },
});
