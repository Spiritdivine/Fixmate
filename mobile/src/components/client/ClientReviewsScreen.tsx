import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, CheckCircle2, Star, Check, Plus } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ReviewService } from '../../services/review.service';
import { ContractService } from '../../services/contract.service';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { useToast } from '../shared/ToastContext';
import { useSubmitReview } from '../../hooks';

interface ClientReviewsScreenProps {
  contractId?: string;
  artisanId?: string;
  artisanName?: string;
  jobTitle?: string;
  onBack?: () => void;
  onSubmitReview?: () => void;
}

export const ClientReviewsScreen: React.FC<ClientReviewsScreenProps> = ({
  contractId: initialContractId,
  artisanId: initialArtisanId,
  artisanName: initialArtisanName,
  jobTitle: initialJobTitle,
  onBack,
  onSubmitReview,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { showSuccess, showError, showWarning } = useToast();
  const { data: myContracts } = useQuery({
    queryKey: ['contracts', 'client-reviews'],
    queryFn: () => ContractService.getMyContracts('CLIENT'),
  });

  const availableContracts = (myContracts || []).filter(
    (c: any) => c.status === 'COMPLETED' || c.status === 'ACTIVE'
  );

  const [selectedContractId, setSelectedContractId] = useState<string | undefined>(
    initialContractId || (availableContracts.length > 0 ? availableContracts[0].id : undefined)
  );

  const activeContract = availableContracts.find((c: any) => c.id === (selectedContractId || initialContractId)) || availableContracts[0];

  const targetContractId = initialContractId || activeContract?.id;
  const targetArtisanId = initialArtisanId || activeContract?.artisanId;
  const targetArtisanName = initialArtisanName || activeContract?.artisan?.artisanProfile?.businessName || activeContract?.artisan?.artisanProfile?.title || 'Verified Artisan';
  const targetJobTitle = initialJobTitle || activeContract?.title || 'Completed Service';

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTip, setSelectedTip] = useState<number | null>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const submitReviewMutation = useSubmitReview();
  const isSubmitting = submitReviewMutation.isPending;

  const praiseTags = [
    'On-Time Arrival',
    'Clean Cable Trunking',
    'Honest Diagnostics',
    'Professional & Polite',
    'Fair Pricing',
    'Quality Materials Used',
  ];

  const tipOptions = [0, 1000, 2500, 5000];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const getRatingLabel = () => {
    switch (rating) {
      case 5:
        return 'Outstanding & Highly Recommended!';
      case 4:
        return 'Good Quality Work';
      case 3:
        return 'Satisfactory';
      case 2:
        return 'Needs Improvement';
      default:
        return 'Unsatisfactory';
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={22} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Rate & Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Completed Job & Artisan Hero */}
        <View style={[styles.artisanCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.avatar, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Text style={[styles.avatarText, isDark && { color: '#34D399' }]}>
              {targetArtisanName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'AR'}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.artisanName, { color: themeColors.text }]}>{targetArtisanName}</Text>
            <Text style={[styles.jobTitle, { color: themeColors.textMuted }]}>{targetJobTitle}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <CheckCircle2 size={12} color={isDark ? '#34D399' : '#059669'} />
              <Text style={[styles.completedTag, isDark && { color: '#34D399' }, { marginTop: 0 }]}>Completed & Escrow Settled</Text>
            </View>
          </View>
        </View>

        {/* Rating Stars Card */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>How was {targetArtisanName.split(' ')[0]}'s service?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starBtn}
              >
                <Star
                  size={32}
                  color={star <= rating ? '#F59E0B' : (isDark ? '#374151' : '#E5E7EB')}
                  fill={star <= rating ? '#F59E0B' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.ratingDescriptor, isDark && { color: '#34D399' }]}>{getRatingLabel()}</Text>
        </View>

        {/* Compliment Badges */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>What did they do exceptionally well?</Text>
          <View style={styles.tagsGrid}>
            {praiseTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                    active && [styles.tagChipActive, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10B981' }],
                  ]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {active ? (
                      <Check size={12} color={isDark ? '#34D399' : colors.brand.forest} strokeWidth={2.8} />
                    ) : (
                      <Plus size={12} color={themeColors.textMuted} strokeWidth={2.2} />
                    )}
                    <Text style={[
                      styles.tagChipText,
                      { color: themeColors.text },
                      active && [styles.tagChipTextActive, isDark && { color: '#34D399' }],
                    ]}>
                      {tag}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Written Review */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Detailed Feedback (Public)</Text>
          <TextInput
            style={[styles.textArea, {
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.inputBorder,
              color: themeColors.text,
            }]}
            placeholder="Share details of your experience to help future clients on Artifix..."
            placeholderTextColor={themeColors.textMuted}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
        </View>

        {/* Tipping Section */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.tipHeaderRow}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Add a Tip for Good Work?</Text>
            <Text style={[styles.tipNotice, { color: themeColors.textMuted }]}>100% goes directly to artisan</Text>
          </View>
          <View style={styles.tipsRow}>
            {tipOptions.map((tip) => {
              const active = selectedTip === tip;
              return (
                <TouchableOpacity
                  key={tip}
                  style={[
                    styles.tipChip,
                    { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                    active && [styles.tipChipActive, isDark && { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.2)' }],
                  ]}
                  onPress={() => setSelectedTip(tip)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.tipChipText,
                    { color: themeColors.text },
                    active && [styles.tipChipTextActive, isDark && { color: '#34D399' }],
                  ]}>
                    {tip === 0 ? 'No Tip' : formatCurrency(tip)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit Review CTA */}
        <TouchableOpacity
          style={styles.submitBtn}
          disabled={isSubmitting}
          onPress={() => {
            if (!targetContractId || !targetArtisanId) {
              showWarning('Contract Required', 'A completed contract reference is required to submit a verified review.');
              return;
            }
            if (!comment.trim()) {
              showWarning('Feedback Required', 'Please write a brief sentence sharing your experience with the artisan.');
              return;
            }

            // Immediate feedback and transition
            showSuccess(
              'Review Recorded',
              'Thank you! Your verified review, rating, and tip have been credited to the artisan.'
            );
            onSubmitReview?.();

            submitReviewMutation.mutate(
              {
                contractId: targetContractId,
                artisanId: targetArtisanId,
                rating,
                comment: comment.trim(),
                tags: selectedTags,
                tipAmount: selectedTip || 0,
              },
              {
                onError: (err: any) => {
                  const msg = err?.response?.data?.message || err?.message || 'Failed to submit review. Please try again.';
                  showError('Submission Error', msg);
                },
              }
            );
          }}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              Submit Review {selectedTip ? `& Tip (${formatCurrency(selectedTip)})` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backBtnText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 40,
  },
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  meta: {
    flex: 1,
  },
  artisanName: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  jobTitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  completedTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 36,
  },
  starFilled: {
    color: '#F59E0B',
  },
  starEmpty: {
    color: '#D1D5DB',
  },
  ratingDescriptor: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tagChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  tagChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  tagChipTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
    height: 90,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tipNotice: {
    fontSize: 10,
    color: colors.textMuted,
  },
  tipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tipChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  tipChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tipChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  tipChipTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    ...shadows.md,
  },
  submitBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
