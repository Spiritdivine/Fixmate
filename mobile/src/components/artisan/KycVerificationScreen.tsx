import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ProfileService, KycSubmissionPayload } from '../../services/profile.service';
import { ImageProcessor } from '../../lib/image-processor';
import { UploadService } from '../../services/upload.service';
import { useToast } from '../shared/ToastContext';

interface KycVerificationScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export const KycVerificationScreen: React.FC<KycVerificationScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { showSuccess, showError, showInfo } = useToast();
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess('Document image uploaded successfully');
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to upload document photo.');
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess('Facial selfie captured successfully');
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to capture selfie.');
    }
  };

  const handleSubmit = async () => {
    const cleanNumber = ninNumber.trim();
    if (!cleanNumber) {
      showError('Please enter your government document identification number.');
      return;
    }

    if (docType === 'NIN' && cleanNumber.length !== 11) {
      showError('Your National Identity Number (NIN) must be exactly 11 numeric digits.');
      return;
    }

    if (!frontDocUrl) {
      showError('Please upload or snap a photo of your ID document front.');
      return;
    }

    if (!selfieUrl) {
      showError('Please snap a real-time portrait selfie for biometric matching.');
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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess('KYC documents submitted! Your verified badge will activate once verified.');
      if (onSuccess) {
        setTimeout(onSuccess, 1200);
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(err?.response?.data?.message || err?.message || 'Failed to submit verification.');
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
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Identity Verification</Text>
        </View>
        <View style={styles.tierPill}>
          <Text style={styles.tierText}>Level 2 KYC</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trust Card */}
        <View style={styles.trustCard}>
          <ShieldCheck size={28} color={colors.brand.emerald} />
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDocType('NIN');
            }}
            style={[styles.typeBtn, docType === 'NIN' && styles.typeBtnActive]}
          >
            <Text style={[styles.typeText, docType === 'NIN' && styles.typeTextActive]}>
              NIN Slip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDocType('VOTER');
            }}
            style={[styles.typeBtn, docType === 'VOTER' && styles.typeBtnActive]}
          >
            <Text style={[styles.typeText, docType === 'VOTER' && styles.typeTextActive]}>
              Voter's Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDocType('DRIVERS');
            }}
            style={[styles.typeBtn, docType === 'DRIVERS' && styles.typeBtnActive]}
          >
            <Text style={[styles.typeText, docType === 'DRIVERS' && styles.typeTextActive]}>
              Driver's Lic.
            </Text>
          </TouchableOpacity>
        </View>

        {/* NIN Number Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {docType === 'NIN'
              ? '11-Digit National Identity Number (NIN)'
              : 'Document Registration Number'}
          </Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            maxLength={docType === 'NIN' ? 11 : 20}
            value={ninNumber}
            placeholder={docType === 'NIN' ? '12345678901' : 'ABC1234567'}
            placeholderTextColor={colors.neutral[500]}
            onChangeText={setNinNumber}
          />
        </View>

        {/* Upload Slots */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Document Capture</Text>
        <View style={styles.uploadCard}>
          <View style={styles.uploadLeft}>
            <View style={styles.uploadIconWrap}>
              <CreditCard size={20} color={isFrontUploaded ? colors.brand.emerald : colors.neutral[400]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.uploadTitle}>Front of ID Document</Text>
              <Text style={[styles.uploadSub, isFrontUploaded && { color: colors.brand.emerald }]}>
                {isFrontUploaded ? 'Document Captured ✓' : 'Tap to scan or select photo'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handlePickDocument}
            style={[styles.retakeBtn, isFrontUploaded && styles.retakeBtnUploaded]}
            activeOpacity={0.8}
          >
            <Text style={[styles.retakeText, isFrontUploaded && { color: colors.brand.emerald }]}>
              {isFrontUploaded ? 'Change' : 'Scan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selfie Liveness */}
        <View style={styles.uploadCard}>
          <View style={styles.uploadLeft}>
            <View style={styles.uploadIconWrap}>
              <Camera size={20} color={isSelfieCaptured ? colors.brand.emerald : colors.neutral[400]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.uploadTitle}>Facial Liveness Selfie</Text>
              <Text style={[styles.uploadSub, isSelfieCaptured && { color: colors.brand.emerald }]}>
                {isSelfieCaptured ? 'Selfie Matched with ID ✓' : 'Tap to take live photo'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleCaptureSelfie}
            style={[styles.retakeBtn, isSelfieCaptured && styles.retakeBtnUploaded]}
            activeOpacity={0.8}
          >
            <Text style={[styles.retakeText, isSelfieCaptured && { color: colors.brand.emerald }]}>
              {isSelfieCaptured ? 'Retake' : 'Snap'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Bottom Submit */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
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
  tierPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  tierText: {
    fontSize: 11,
    color: colors.brand.emerald,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 110,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E291D',
    padding: spacing.base,
    borderRadius: radius.xl,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#1A4D36',
    gap: 12,
  },
  trustTextGroup: {
    flex: 1,
  },
  trustHeading: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trustSub: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: '#FFFFFF',
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
    backgroundColor: '#0E291D',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A4D36',
  },
  typeBtnActive: {
    backgroundColor: colors.brand.emerald,
    borderColor: colors.brand.emerald,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[400],
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
    color: colors.neutral[300],
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0E291D',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#1A4D36',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: typography.size.md,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1A4D36',
    marginTop: 10,
  },
  uploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  uploadIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadSub: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
    fontWeight: '600',
  },
  retakeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#1A4D36',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  retakeBtnUploaded: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  retakeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[300],
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#071A11',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#133E2B',
  },
  submitBtn: {
    backgroundColor: colors.brand.emerald,
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
