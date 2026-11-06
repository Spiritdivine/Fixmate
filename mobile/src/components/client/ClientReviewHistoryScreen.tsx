import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  Star,
  ChevronLeft,
  Edit3,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  X,
  Check,
  Gift,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ReviewService } from '../../services/review.service';
import { ReviewRecord } from '../../types/review-contracts';
import { useToast } from '../shared/ToastContext';
import { SkeletonPlaceholder } from '../shared/SkeletonPlaceholder';

interface ClientReviewHistoryScreenProps {
  onBack?: () => void;
  onNavigateToContracts?: () => void;
}

export const ClientReviewHistoryScreen: React.FC<ClientReviewHistoryScreenProps> = ({
  onBack,
  onNavigateToContracts,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    data: reviews = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['client-review-history'],
    queryFn: async () => {
      const data = await ReviewService.getMyReviews();
      return Array.isArray(data) ? data : [];
    },
  });

  const handleOpenEdit = (review: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEditingReview(review);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || '');
  };

  const handleSaveEdit = async () => {
    if (!editingReview?.id) return;
    if (!editComment.trim()) {
      showError('Please enter a feedback comment');
      return;
    }

    setIsUpdating(true);
    try {
      await ReviewService.updateReview(editingReview.id, {
        rating: editRating,
        comment: editComment.trim(),
      });

      await queryClient.invalidateQueries({ queryKey: ['client-review-history'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showSuccess('Review updated successfully! ⭐');
      setEditingReview(null);
    } catch (err: any) {
      showError(err?.response?.data?.message || err?.message || 'Failed to update review');
    } finally {
      setIsUpdating(false);
    }
  };

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
      : '5.0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity onPress={onBack} hitSlop={touchTargets.hitSlop} style={styles.backBtn}>
          <ChevronLeft size={24} color={themeColors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>My Reviews & Ratings</Text>
          <Text style={[styles.headerSub, { color: themeColors.textMuted }]}>Feedback you provided to contracted artisans</Text>
        </View>
      </View>

      {/* Summary KPI Bar */}
      <View style={[styles.kpiBar, { backgroundColor: themeColors.surfaceSubtle, borderBottomColor: themeColors.border }]}>
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiVal, { color: themeColors.text }]}>{totalReviews}</Text>
          <Text style={[styles.kpiLabel, { color: themeColors.textMuted }]}>Reviews Given</Text>
        </View>

        <View style={[styles.kpiDivider, { backgroundColor: themeColors.border }]} />

        <View style={styles.kpiItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Star size={15} color="#F59E0B" fill="#F59E0B" />
            <Text style={[styles.kpiVal, { color: themeColors.text }]}>{avgRating}</Text>
          </View>
          <Text style={[styles.kpiLabel, { color: themeColors.textMuted }]}>Avg Star Rating</Text>
        </View>

        <View style={[styles.kpiDivider, { backgroundColor: themeColors.border }]} />

        <View style={styles.kpiItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Sparkles size={14} color="#10B981" />
            <Text style={[styles.kpiVal, { color: '#10B981' }]}>100%</Text>
          </View>
          <Text style={[styles.kpiLabel, { color: themeColors.textMuted }]}>Escrow Verified</Text>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3].map((k) => (
            <View key={k} style={[styles.skeletonCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <SkeletonPlaceholder width="50%" height={16} borderRadius={4} />
              <SkeletonPlaceholder width="30%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
              <SkeletonPlaceholder width="100%" height={14} borderRadius={4} style={{ marginTop: 12 }} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => { refetch(); }}
              tintColor={colors.brand.forest}
              colors={[colors.brand.forest]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Star size={44} color={themeColors.textMuted} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Reviews Given Yet</Text>
              <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>
                When you complete contracts and release milestone funds, you can rate and tip verified artisans.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={onNavigateToContracts}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyCtaText}>View Completed Contracts</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recently';

            const artisanName =
              (item as any).artisan?.artisanProfile?.businessName ||
              (item as any).artisanName ||
              'Certified Artisan';

            return (
              <View style={[styles.reviewCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.artisanName, { color: themeColors.text }]}>{artisanName}</Text>
                    <Text style={[styles.contractTitle, { color: themeColors.textMuted }]}>
                      {(item as any).contract?.title || 'Contract Handover'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: themeColors.surfaceSubtle }]}
                    onPress={() => handleOpenEdit(item)}
                    hitSlop={touchTargets.hitSlop}
                  >
                    <Edit3 size={15} color={isDark ? '#34D399' : colors.brand.forest} />
                    <Text style={[styles.editText, isDark && { color: '#34D399' }]}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* Stars and Date */}
                <View style={styles.starsRow}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        color="#F59E0B"
                        fill={s <= item.rating ? '#F59E0B' : 'transparent'}
                      />
                    ))}
                  </View>
                  <Text style={[styles.dateText, { color: themeColors.textMuted }]}>{dateStr}</Text>
                </View>

                {/* Comment */}
                <Text style={[styles.commentText, { color: themeColors.text }]}>"{item.comment}"</Text>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagsWrap}>
                    {item.tags.map((t) => (
                      <View key={t} style={[styles.tagChip, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                        <ThumbsUp size={10} color={isDark ? '#34D399' : colors.brand.forest} />
                        <Text style={[styles.tagText, isDark && { color: '#34D399' }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tip Badge if present */}
                {(item as any).tipAmount > 0 && (
                  <View style={[styles.tipBadge, isDark && { backgroundColor: 'rgba(245, 158, 11, 0.15)' }, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <Gift size={12} color={isDark ? '#FBBF24' : '#D97706'} />
                    <Text style={[styles.tipText, isDark && { color: '#FBBF24' }]}>
                      {formatCurrency((item as any).tipAmount)} Tip Disbursed
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Edit Review Modal */}
      <Modal visible={!!editingReview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: themeColors.border }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Edit Review</Text>
              <TouchableOpacity onPress={() => setEditingReview(null)} hitSlop={touchTargets.hitSlop}>
                <X size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {/* Interactive Stars */}
            <Text style={[styles.sheetLabel, { color: themeColors.textMuted }]}>YOUR RATING</Text>
            <View style={styles.starPickRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setEditRating(s);
                  }}
                  hitSlop={touchTargets.hitSlop}
                  style={styles.starTouch}
                >
                  <Star
                    size={32}
                    color="#F59E0B"
                    fill={s <= editRating ? '#F59E0B' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment */}
            <Text style={[styles.sheetLabel, { color: themeColors.textMuted, marginTop: 14 }]}>FEEDBACK COMMENT</Text>
            <TextInput
              style={[styles.editTextInput, {
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.inputBorder,
                color: themeColors.text,
              }]}
              value={editComment}
              onChangeText={setEditComment}
              placeholder="Update your review..."
              placeholderTextColor={themeColors.textMuted}
              multiline
              numberOfLines={4}
            />

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetCancelBtn, { backgroundColor: themeColors.surfaceSubtle }]}
                onPress={() => setEditingReview(null)}
                disabled={isUpdating}
              >
                <Text style={[styles.sheetCancelBtnText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetSaveBtn, isUpdating && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sheetSaveBtnText}>Save Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  kpiBar: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  listContent: {
    padding: spacing.base,
    paddingBottom: 40,
  },
  skeletonList: {
    padding: spacing.base,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  artisanName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  contractTitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#F3F4F6',
  },
  editText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand.forest,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  commentText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand.forest,
  },
  tipBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  tipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: 20,
    backgroundColor: colors.brand.forest,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: radius.lg,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 33, 22, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.base,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sheetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  starPickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  starTouch: {
    padding: 4,
  },
  editTextInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 90,
    textAlignVertical: 'top',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  sheetCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  sheetCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sheetSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.forest,
    alignItems: 'center',
  },
  sheetSaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
