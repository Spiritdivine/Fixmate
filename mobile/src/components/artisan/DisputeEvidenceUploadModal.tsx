import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Camera,
  Trash2,
  ShieldAlert,
  Scale,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { useToast } from '../shared/ToastContext';

interface DisputeEvidenceUploadModalProps {
  visible: boolean;
  onClose: () => void;
  disputeId: string;
  disputedAmount: number;
  onSubmitEvidence: (data: {
    statement: string;
    evidencePhotos: string[];
    settlementOfferType: 'FULL_DEFENSE' | 'FREE_RECTIFICATION' | 'PARTIAL_REFUND';
    partialRefundAmount?: number;
  }) => Promise<void>;
}

export const DisputeEvidenceUploadModal: React.FC<DisputeEvidenceUploadModalProps> = ({
  visible,
  onClose,
  disputeId,
  disputedAmount,
  onSubmitEvidence,
}) => {
  const { showSuccess, showWarning, showError } = useToast();

  const [statement, setStatement] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [offerType, setOfferType] = useState<'FULL_DEFENSE' | 'FREE_RECTIFICATION' | 'PARTIAL_REFUND'>('FULL_DEFENSE');
  const [partialRefundText, setPartialRefundText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      showError('Image Picker', 'Could not open image library.');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (statement.trim().length < 25) {
      showWarning(
        'Detailed Defense Required',
        'Please provide at least 25 characters detailing your work defense and evidence.'
      );
      return;
    }

    const partialAmount = parseFloat(partialRefundText.replace(/[^0-9.]/g, '')) || 0;
    if (offerType === 'PARTIAL_REFUND' && (partialAmount <= 0 || partialAmount >= disputedAmount)) {
      showWarning(
        'Invalid Refund Amount',
        `Partial compromise refund must be between ₦1 and ${formatCurrency(disputedAmount)}.`
      );
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmitEvidence({
        statement: statement.trim(),
        evidencePhotos: photos,
        settlementOfferType: offerType,
        partialRefundAmount: offerType === 'PARTIAL_REFUND' ? partialAmount : undefined,
      });
      showSuccess('Defense Transmitted', 'Your counter-evidence was submitted to Artifix Arbitration.');
      setStatement('');
      setPhotos([]);
      onClose();
    } catch (err: any) {
      showError('Submission Failed', err?.message || 'Could not send dispute evidence.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.safeContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.topBarTitle}>Submit Counter-Evidence</Text>
              <Text style={styles.topBarSubtitle}>Case #{disputeId.slice(-6).toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.closeIconButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={colors.neutral[300]} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Notice Card */}
            <View style={styles.noticeCard}>
              <Scale size={20} color="#10B981" />
              <View style={styles.noticeTextCol}>
                <Text style={styles.noticeTitle}>Artifix Neutral Mediation</Text>
                <Text style={styles.noticeBody}>
                  Upload receipts, before/after photos, and your factual account of the worksite. Our legal mediation team reviews all evidence neutrally.
                </Text>
              </View>
            </View>

            {/* Defense Statement */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Your Factual Statement & Defense *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={5}
                placeholder="Detail what occurred, dates, materials delivered, client instructions given on site..."
                placeholderTextColor={colors.neutral[500]}
                value={statement}
                onChangeText={setStatement}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {statement.length < 25
                  ? `Minimum 25 characters (${25 - statement.length} more needed)`
                  : `${statement.length} characters`}
              </Text>
            </View>

            {/* Evidence Photos */}
            <View style={styles.formGroup}>
              <View style={styles.photosHeaderRow}>
                <Text style={styles.fieldLabel}>Proof Photos & Receipts</Text>
                <Text style={styles.photosCount}>{photos.length}/6 Uploaded</Text>
              </View>

              <View style={styles.photosGrid}>
                {photos.map((uri, idx) => (
                  <View key={idx} style={styles.photoThumbWrapper}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      onPress={() => handleRemovePhoto(idx)}
                      style={styles.removePhotoBtn}
                    >
                      <Trash2 size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {photos.length < 6 && (
                  <TouchableOpacity
                    onPress={handlePickPhoto}
                    style={styles.addPhotoCard}
                    activeOpacity={0.8}
                  >
                    <Camera size={22} color="#10B981" />
                    <Text style={styles.addPhotoText}>Add Photo/Receipt</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Settlement Compromise Offer Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Proposed Resolution Offer</Text>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setOfferType('FULL_DEFENSE');
                }}
                style={[styles.offerOptionCard, offerType === 'FULL_DEFENSE' && styles.offerOptionActive]}
                activeOpacity={0.8}
              >
                <View style={styles.radioCircle}>
                  {offerType === 'FULL_DEFENSE' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.offerTextCol}>
                  <Text style={styles.offerTitle}>Full Defense</Text>
                  <Text style={styles.offerDesc}>
                    Claim 100% of disputed escrow ({formatCurrency(disputedAmount)}). Work completed to specification.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setOfferType('FREE_RECTIFICATION');
                }}
                style={[
                  styles.offerOptionCard,
                  offerType === 'FREE_RECTIFICATION' && styles.offerOptionActive,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.radioCircle}>
                  {offerType === 'FREE_RECTIFICATION' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.offerTextCol}>
                  <Text style={styles.offerTitle}>Free Rectification Visit</Text>
                  <Text style={styles.offerDesc}>
                    Offer to return to site at no extra cost to adjust or inspect the issue.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setOfferType('PARTIAL_REFUND');
                }}
                style={[
                  styles.offerOptionCard,
                  offerType === 'PARTIAL_REFUND' && styles.offerOptionActive,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.radioCircle}>
                  {offerType === 'PARTIAL_REFUND' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.offerTextCol}>
                  <Text style={styles.offerTitle}>Partial Compromise Refund</Text>
                  <Text style={styles.offerDesc}>
                    Offer a negotiated discount from the held escrow to conclude dispute amicably.
                  </Text>
                </View>
              </TouchableOpacity>

              {offerType === 'PARTIAL_REFUND' && (
                <View style={styles.partialRefundInputBox}>
                  <Text style={styles.fieldLabel}>Compromise Refund Amount (₦)</Text>
                  <TextInput
                    style={styles.refundTextInput}
                    keyboardType="numeric"
                    placeholder="e.g. 10000"
                    placeholderTextColor={colors.neutral[500]}
                    value={partialRefundText}
                    onChangeText={setPartialRefundText}
                  />
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#071A11" />
              ) : (
                <>
                  <Scale size={18} color="#071A11" />
                  <Text style={styles.submitBtnText}>Submit Defense to Mediator</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#071A11',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#0E291D',
    borderBottomWidth: 1,
    borderBottomColor: '#17402B',
  },
  topBarTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  topBarSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: '#10B981',
    marginTop: 2,
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#163E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98140',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  noticeTextCol: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
    marginBottom: 2,
  },
  noticeBody: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[300],
    lineHeight: 16,
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[200],
  },
  textArea: {
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    padding: spacing.sm,
    height: 120,
    color: colors.neutral[100],
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
  },
  charCount: {
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    textAlign: 'right',
  },
  photosHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photosCount: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  photoThumbWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1D4E35',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoCard: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: '#0E291D',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#10B98160',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  addPhotoText: {
    fontSize: 8,
    fontFamily: typography.fonts.medium,
    color: '#10B981',
    textAlign: 'center',
  },
  offerOptionCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#1D4E35',
    alignItems: 'center',
  },
  offerOptionActive: {
    borderColor: '#10B981',
    backgroundColor: '#10B98115',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: '#10B981',
  },
  offerTextCol: {
    flex: 1,
  },
  offerTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
    marginBottom: 1,
  },
  offerDesc: {
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    lineHeight: 14,
  },
  partialRefundInputBox: {
    marginTop: 6,
    gap: 4,
  },
  refundTextInput: {
    backgroundColor: '#0E291D',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
    paddingHorizontal: spacing.sm,
    height: 44,
    color: colors.neutral[100],
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#17402B',
  },
  submitBtn: {
    height: 50,
    borderRadius: radius.xl,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
});
