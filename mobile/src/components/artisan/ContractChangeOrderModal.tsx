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
  PlusCircle,
  Clock,
  Camera,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { useToast } from '../shared/ToastContext';

interface ContractChangeOrderModalProps {
  visible: boolean;
  onClose: () => void;
  contractId: string;
  contractTitle: string;
  currentAmount: number;
  onSubmitChangeOrder: (data: {
    additionalAmount: number;
    additionalDays: number;
    reason: string;
    evidencePhotos: string[];
  }) => Promise<void>;
}

const TIME_ADDITION_PRESETS = [
  { label: '+1 Day', days: 1 },
  { label: '+2 Days', days: 2 },
  { label: '+3 Days', days: 3 },
  { label: '+5 Days', days: 5 },
  { label: '+1 Week', days: 7 },
];

export const ContractChangeOrderModal: React.FC<ContractChangeOrderModalProps> = ({
  visible,
  onClose,
  contractId,
  contractTitle,
  currentAmount,
  onSubmitChangeOrder,
}) => {
  const { showSuccess, showError, showWarning } = useToast();

  const [additionalAmountText, setAdditionalAmountText] = useState('');
  const [additionalDays, setAdditionalDays] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const additionalAmount = parseFloat(additionalAmountText.replace(/[^0-9.]/g, '')) || 0;
  const newTotalContract = currentAmount + additionalAmount;

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
      showError('Media Error', 'Could not open image gallery.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (additionalAmount <= 0) {
      showWarning('Amount Required', 'Please enter a valid additional amount for this scope change.');
      return;
    }
    if (reason.trim().length < 20) {
      showWarning(
        'Detailed Reason Required',
        'Please provide at least 20 characters explaining the unforeseen condition or client-requested addition.'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    try {
      await onSubmitChangeOrder({
        additionalAmount,
        additionalDays,
        reason: reason.trim(),
        evidencePhotos: photos,
      });
      showSuccess(
        'Change Order Submitted',
        'Your scope & price amendment was dispatched to the client for digital approval.'
      );
      // Reset & close
      setAdditionalAmountText('');
      setReason('');
      setPhotos([]);
      onClose();
    } catch (err: any) {
      showError('Submission Failed', err?.message || 'Could not send change order request.');
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
              <Text style={styles.topBarTitle}>Request Scope Amendment</Text>
              <Text style={styles.topBarSubtitle} numberOfLines={1}>
                {contractTitle}
              </Text>
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
            {/* Info Notice */}
            <View style={styles.noticeCard}>
              <AlertCircle size={20} color="#F59E0B" />
              <View style={styles.noticeTextCol}>
                <Text style={styles.noticeTitle}>Unforeseen Conditions & Extra Scope</Text>
                <Text style={styles.noticeBody}>
                  Client must review and digitally authorize any price adjustments before extra work begins. Funds will be secured in escrow upon client approval.
                </Text>
              </View>
            </View>

            {/* Current vs Proposed Total */}
            <View style={styles.financialSummaryCard}>
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Original Escrow:</Text>
                <Text style={styles.finVal}>{formatCurrency(currentAmount)}</Text>
              </View>
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Additional Requested:</Text>
                <Text style={[styles.finVal, { color: '#10B981' }]}>
                  +{formatCurrency(additionalAmount)}
                </Text>
              </View>
              <View style={styles.finDivider} />
              <View style={styles.finRow}>
                <Text style={styles.finTotalLabel}>New Total Contract:</Text>
                <Text style={styles.finTotalVal}>{formatCurrency(newTotalContract)}</Text>
              </View>
            </View>

            {/* Additional Amount Input */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Additional Amount (₦) *</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>₦</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="e.g. 15,000"
                  placeholderTextColor={colors.neutral[500]}
                  value={additionalAmountText}
                  onChangeText={setAdditionalAmountText}
                />
              </View>
            </View>

            {/* Additional Time Presets */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Additional Delivery Time</Text>
              <View style={styles.presetsRow}>
                {TIME_ADDITION_PRESETS.map((preset) => {
                  const isSelected = additionalDays === preset.days;
                  return (
                    <TouchableOpacity
                      key={preset.days}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAdditionalDays(preset.days);
                      }}
                      style={[styles.presetChip, isSelected && styles.presetChipActive]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isSelected && styles.presetChipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Reason & Detailed Justification */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Reason & Scope Justification *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Explain the unexpected issue (e.g. found rusted 2-inch pipe behind the drywall requiring full replacement before tiling)..."
                placeholderTextColor={colors.neutral[500]}
                value={reason}
                onChangeText={setReason}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                {reason.length < 20
                  ? `Minimum 20 characters (${20 - reason.length} more needed)`
                  : `${reason.length} characters`}
              </Text>
            </View>

            {/* Evidence Photos */}
            <View style={styles.formGroup}>
              <View style={styles.photosHeaderRow}>
                <Text style={styles.fieldLabel}>Condition Photos (Recommended)</Text>
                <Text style={styles.photosCount}>{photos.length}/4 Photos</Text>
              </View>

              <View style={styles.photosListRow}>
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

                {photos.length < 4 && (
                  <TouchableOpacity
                    onPress={handlePickPhoto}
                    style={styles.addPhotoCard}
                    activeOpacity={0.8}
                  >
                    <Camera size={20} color="#10B981" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.bottomFooter}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#071A11" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#071A11" />
                  <Text style={styles.submitButtonText}>
                    Send Change Order ({formatCurrency(additionalAmount)})
                  </Text>
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
    maxWidth: 240,
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
    paddingBottom: 100,
    gap: spacing.md,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#F59E0B15',
    borderWidth: 1,
    borderColor: '#F59E0B40',
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  noticeTextCol: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#FBBF24',
    marginBottom: 2,
  },
  noticeBody: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[300],
    lineHeight: 16,
  },
  financialSummaryCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
    gap: spacing.xs,
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  finVal: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[200],
  },
  finDivider: {
    height: 1,
    backgroundColor: '#19452F',
    marginVertical: 4,
  },
  finTotalLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  finTotalVal: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[200],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  currencyPrefix: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: colors.neutral[100],
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.semiBold,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#0E291D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
  },
  presetChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  presetChipText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[300],
  },
  presetChipTextActive: {
    color: '#071A11',
    fontFamily: typography.fonts.bold,
  },
  textArea: {
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    padding: spacing.sm,
    height: 100,
    color: colors.neutral[100],
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
  },
  helperText: {
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
  photosListRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  photoThumbWrapper: {
    width: 68,
    height: 68,
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
    width: 68,
    height: 68,
    borderRadius: radius.md,
    backgroundColor: '#0E291D',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#10B98160',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addPhotoText: {
    fontSize: 9,
    fontFamily: typography.fonts.medium,
    color: '#10B981',
  },
  bottomFooter: {
    padding: spacing.md,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#17402B',
  },
  submitButton: {
    height: 50,
    borderRadius: radius.xl,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
});
