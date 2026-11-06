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
  MessageSquare,
  Star,
  Send,
  Trash2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { useToast } from '../shared/ToastContext';

export interface ReviewReplyTarget {
  reviewId: string;
  clientName: string;
  rating: number;
  date: string;
  clientComment: string;
  existingReply?: string;
}

interface ReviewReplyModalProps {
  visible: boolean;
  onClose: () => void;
  review: ReviewReplyTarget | null;
  onSubmitReply: (reviewId: string, replyText: string) => Promise<void>;
  onDeleteReply?: (reviewId: string) => Promise<void>;
}

export const ReviewReplyModal: React.FC<ReviewReplyModalProps> = ({
  visible,
  onClose,
  review,
  onSubmitReply,
  onDeleteReply,
}) => {
  const { showSuccess, showWarning, showError } = useToast();

  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (review) {
      setReplyText(review.existingReply || '');
    }
  }, [review]);

  if (!review) return null;

  const handleSubmit = async () => {
    if (replyText.trim().length < 10) {
      showWarning(
        'Short Reply',
        'Please enter at least 10 characters for your public response.'
      );
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmitReply(review.reviewId, replyText.trim());
      showSuccess('Reply Published', 'Your public response is now visible on your public profile.');
      onClose();
    } catch (err: any) {
      showError('Reply Error', err?.message || 'Could not post response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteReply) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSubmitting(true);
    try {
      await onDeleteReply(review.reviewId);
      showSuccess('Reply Deleted', 'Your response was removed.');
      setReplyText('');
      onClose();
    } catch (err: any) {
      showError('Action Failed', err?.message || 'Could not remove response.');
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
              <Text style={styles.topBarTitle}>
                {review.existingReply ? 'Edit Public Response' : 'Reply to Client Review'}
              </Text>
              <Text style={styles.topBarSubtitle}>Visible to all future prospective clients</Text>
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
            {/* Original Client Review Context Card */}
            <View style={styles.clientReviewCard}>
              <View style={styles.clientHeaderRow}>
                <View>
                  <Text style={styles.clientName}>{review.clientName}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color={star <= review.rating ? '#F59E0B' : colors.neutral[600]}
                      fill={star <= review.rating ? '#F59E0B' : 'transparent'}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.clientCommentText}>"{review.clientComment}"</Text>
            </View>

            {/* Professionalism Tip */}
            <View style={styles.tipBox}>
              <Sparkles size={16} color="#10B981" />
              <Text style={styles.tipText}>
                Professional, polite, and constructive answers build high homeowner trust. Thank the client for their feedback and highlight your commitment to craftsmanship.
              </Text>
            </View>

            {/* Response Input */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Your Public Response *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={5}
                maxLength={400}
                placeholder="Thank you for your feedback! It was a pleasure working on your project..."
                placeholderTextColor={colors.neutral[500]}
                value={replyText}
                onChangeText={setReplyText}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{replyText.length}/400 characters</Text>
            </View>
          </ScrollView>

          {/* Bottom Bar Actions */}
          <View style={styles.bottomBar}>
            {review.existingReply && onDeleteReply && (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isSubmitting}
                style={styles.deleteBtn}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            )}

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
                  <Send size={16} color="#071A11" />
                  <Text style={styles.submitBtnText}>
                    {review.existingReply ? 'Update Public Response' : 'Publish Response'}
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
  clientReviewCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1D4E35',
  },
  clientHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  clientName: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  reviewDate: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    marginTop: 1,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  clientCommentText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[200],
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 4,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#10B98115',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#10B98140',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: '#A7F3D0',
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
  bottomBar: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#17402B',
  },
  deleteBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderColor: '#EF444450',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteBtnText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: '#EF4444',
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
