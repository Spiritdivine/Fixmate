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
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  X,
  Flag,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { useToast } from '../shared/ToastContext';
import { ReviewReplyTarget } from './ReviewReplyModal';

const FLAG_REASONS = [
  { id: 'EXTORTION', label: 'Payment Extortion / Coercion', desc: 'Client demanding uncontracted free work under threat of 1-star rating.' },
  { id: 'DEFAMATION', label: 'Defamation / Harassment', desc: 'Contains profanity, discriminatory remarks, or personal attacks.' },
  { id: 'FALSE_SCOPE', label: 'False Claims / Wrong Artisan', desc: 'Review describes work or issues outside of agreed contract scope.' },
  { id: 'OTHER', label: 'Other Policy Violation', desc: 'Any other violation of Artifix Community Guidelines.' },
];

interface DisputeReviewModalProps {
  visible: boolean;
  onClose: () => void;
  review: ReviewReplyTarget | null;
  onSubmitDispute: (reviewId: string, reason: string, explanation: string) => Promise<void>;
}

export const DisputeReviewModal: React.FC<DisputeReviewModalProps> = ({
  visible,
  onClose,
  review,
  onSubmitDispute,
}) => {
  const { showSuccess, showWarning, showError } = useToast();

  const [selectedReason, setSelectedReason] = useState(FLAG_REASONS[0].id);
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!review) return null;

  const handleSubmit = async () => {
    if (explanation.trim().length < 20) {
      showWarning(
        'Explanation Required',
        'Please provide at least 20 characters explaining why this review violates platform rules.'
      );
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const reasonObj = FLAG_REASONS.find((r) => r.id === selectedReason);
      await onSubmitDispute(review.reviewId, reasonObj?.label || selectedReason, explanation.trim());
      showSuccess(
        'Review Flagged for Audit',
        'Our Trust & Safety moderators will investigate this review within 24 hours.'
      );
      setExplanation('');
      onClose();
    } catch (err: any) {
      showError('Dispute Error', err?.message || 'Could not flag review.');
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
              <Text style={styles.topBarTitle}>Dispute / Flag Review</Text>
              <Text style={styles.topBarSubtitle}>Report unfair or policy-violating ratings</Text>
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
            {/* Review Context */}
            <View style={styles.reviewSnippetCard}>
              <Text style={styles.snippetClientName}>{review.clientName} ({review.rating}★)</Text>
              <Text style={styles.snippetCommentText}>"{review.clientComment}"</Text>
            </View>

            {/* Violation Reasons */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Select Violation Category *</Text>
              {FLAG_REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedReason(r.id);
                    }}
                    style={[styles.reasonOptionCard, isSelected && styles.reasonOptionActive]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioCircle}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.reasonTextCol}>
                      <Text style={styles.reasonLabel}>{r.label}</Text>
                      <Text style={styles.reasonDesc}>{r.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Evidence & Detailed Explanation */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Detailed Explanation & Evidence *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Explain the circumstances, reference contract deliverables, or cite WhatsApp/chat transcripts..."
                placeholderTextColor={colors.neutral[500]}
                value={explanation}
                onChangeText={setExplanation}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {explanation.length < 20
                  ? `Minimum 20 characters (${20 - explanation.length} more needed)`
                  : `${explanation.length} characters`}
              </Text>
            </View>

            {/* Safety Notice */}
            <View style={styles.noticeBox}>
              <ShieldAlert size={16} color="#F59E0B" />
              <Text style={styles.noticeText}>
                Artifix reviews all dispute tickets with contract escrow logs. Malicious or retaliatory ratings are expunged from your reputation score once verified.
              </Text>
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
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Flag size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit Review Dispute</Text>
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
    color: '#EF4444',
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
  reviewSnippetCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
  },
  snippetClientName: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[300],
    marginBottom: 4,
  },
  snippetCommentText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[100],
    fontStyle: 'italic',
    lineHeight: 18,
  },
  formGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[200],
  },
  reasonOptionCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#1D4E35',
    alignItems: 'center',
  },
  reasonOptionActive: {
    borderColor: '#EF4444',
    backgroundColor: '#EF444415',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: '#EF4444',
  },
  reasonTextCol: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
    marginBottom: 1,
  },
  reasonDesc: {
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    lineHeight: 14,
  },
  textArea: {
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    padding: spacing.sm,
    height: 110,
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
  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F59E0B15',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F59E0B40',
    alignItems: 'center',
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: '#FDE68A',
    lineHeight: 16,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#17402B',
  },
  submitBtn: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#EF4444',
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
    color: '#FFFFFF',
  },
});
