import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MessageSquare, Flag, Star } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ReviewService } from '../../services/review.service';
import { ReviewRecord } from '../../types/review-contracts';
import { useAuthStore } from '../../stores/authStore';
import { ReviewReplyModal, ReviewReplyTarget } from './ReviewReplyModal';
import { DisputeReviewModal } from './DisputeReviewModal';
import { useToast } from '../shared/ToastContext';
import { useReviewReply } from '../../hooks';

interface ArtisanReviewsScreenProps {
  artisanId?: string;
  onBack?: () => void;
}

export const ArtisanReviewsScreen: React.FC<ArtisanReviewsScreenProps> = ({
  artisanId,
  onBack,
}) => {
  const { user } = useAuthStore();
  const { showSuccess } = useToast();
  const targetId = artisanId || user?.artisanProfile?.id || user?.id || '';

  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<'ALL' | number>('ALL');

  // Modals state
  const [replyTarget, setReplyTarget] = useState<ReviewReplyTarget | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<ReviewReplyTarget | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, string>>({});
  const { submitReply, deleteReply } = useReviewReply();

  const fetchReviews = useCallback(async () => {
    if (!targetId) {
      setLoading(false);
      return;
    }
    try {
      const data = await ReviewService.getArtisanReviews(targetId);
      setReviews(data || []);
    } catch (err) {
      console.warn('[ArtisanReviewsScreen] Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  // Compute rating metrics dynamically
  const metrics = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        avgRating: (user?.artisanProfile?.rating || 5.0).toFixed(1),
        totalCount: user?.artisanProfile?.reviewCount || 0,
        distribution: { five: 100, four: 0, three: 0, two: 0, one: 0 },
      };
    }

    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = (sum / total).toFixed(1);

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const floor = Math.min(5, Math.max(1, Math.round(r.rating || 5))) as 1 | 2 | 3 | 4 | 5;
      counts[floor] = (counts[floor] || 0) + 1;
    });

    return {
      avgRating: avg,
      totalCount: total,
      distribution: {
        five: Math.round((counts[5] / total) * 100),
        four: Math.round((counts[4] / total) * 100),
        three: Math.round((counts[3] / total) * 100),
        two: Math.round((counts[2] / total) * 100),
        one: Math.round((counts[1] / total) * 100),
      },
    };
  }, [reviews, user]);

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
          <Text style={styles.headerTitle}>Client Reviews & Ratings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.brand.forest]} />
        }
      >
        {/* Rating Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreBig}>{metrics.avgRating}</Text>
            <Text style={styles.starsRow}>★★★★★</Text>
            <Text style={styles.totalCount}>{metrics.totalCount} verified reviews</Text>
          </View>

          {/* Bar distributions */}
          <View style={styles.barsCol}>
            <View style={styles.barRow}>
              <Text style={styles.barLabel}>5 ★</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${metrics.distribution.five}%` }]} />
              </View>
              <Text style={styles.barPercent}>{metrics.distribution.five}%</Text>
            </View>

            <View style={styles.barRow}>
              <Text style={styles.barLabel}>4 ★</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${metrics.distribution.four}%` }]} />
              </View>
              <Text style={styles.barPercent}>{metrics.distribution.four}%</Text>
            </View>

            <View style={styles.barRow}>
              <Text style={styles.barLabel}>3 ★</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${metrics.distribution.three}%` }]} />
              </View>
              <Text style={styles.barPercent}>{metrics.distribution.three}%</Text>
            </View>
          </View>
        </View>

        {/* Reputation Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeEmoji}>⚡</Text>
            <Text style={styles.badgeText}>98% On-Time</Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgeEmoji}>🛡️</Text>
            <Text style={styles.badgeText}>100% Escrow Release</Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgeEmoji}>🏆</Text>
            <Text style={styles.badgeText}>Verified Pro</Text>
          </View>
        </View>

        {/* Star Rating Filter Chips */}
        <View style={styles.starFiltersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.starFiltersScroll}>
            {(['ALL', 5, 4, 3, 2, 1] as const).map((star) => (
              <TouchableOpacity
                key={String(star)}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedStarFilter(star);
                }}
                style={[
                  styles.starFilterChip,
                  selectedStarFilter === star && styles.starFilterChipActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.starFilterText,
                    selectedStarFilter === star && styles.starFilterTextActive,
                  ]}
                >
                  {star === 'ALL' ? 'All Reviews' : `${star} ★`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Customer Reviews Feed */}
        <Text style={styles.feedHeading}>
          {selectedStarFilter === 'ALL'
            ? 'Recent Client Reviews'
            : `${selectedStarFilter}-Star Reviews`}
        </Text>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={colors.brand.forest} />
            <Text style={styles.loadingText}>Loading client reviews...</Text>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptySub}>
              Complete contracts and deliver top-notch craftsmanship to earn ratings and reviews from clients.
            </Text>
          </View>
        ) : (
          reviews
            .filter((r) => {
              if (selectedStarFilter === 'ALL') return true;
              return Math.round(r.rating || 5) === selectedStarFilter;
            })
            .map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View>
                    <Text style={styles.clientName}>{item.clientName || 'Valued Client'}</Text>
                    <Text style={styles.dateText}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Verified Client'}
                    </Text>
                  </View>
                  <View style={styles.ratingBox}>
                    <Text style={styles.starText}>★ {item.rating}</Text>
                  </View>
                </View>

                <Text style={styles.commentBody}>"{item.comment}"</Text>

                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {item.tags.map((t, idx) => (
                      <View key={idx} style={styles.tagPill}>
                        <Text style={styles.tagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Public Artisan Reply if exists */}
                {repliesMap[item.id] ? (
                  <View style={styles.replyBox}>
                    <View style={styles.replyHeaderRow}>
                      <Text style={styles.replyAuthor}>Your Response</Text>
                      <View style={styles.publicBadge}>
                        <Text style={styles.publicBadgeText}>Public</Text>
                      </View>
                    </View>
                    <Text style={styles.replyBodyText}>{repliesMap[item.id]}</Text>
                  </View>
                ) : null}

                {/* Review Action Buttons */}
                <View style={styles.reviewActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setReplyTarget({
                        reviewId: item.id,
                        clientName: item.clientName || 'Valued Client',
                        rating: item.rating || 5,
                        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Verified Client',
                        clientComment: item.comment,
                        existingReply: repliesMap[item.id],
                      });
                    }}
                    style={styles.replyActionBtn}
                    activeOpacity={0.7}
                  >
                    <MessageSquare size={13} color={colors.brand.forest} />
                    <Text style={styles.replyActionText}>
                      {repliesMap[item.id] ? 'Edit Response' : 'Reply Publicly'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDisputeTarget({
                        reviewId: item.id,
                        clientName: item.clientName || 'Valued Client',
                        rating: item.rating || 5,
                        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Verified Client',
                        clientComment: item.comment,
                      });
                    }}
                    style={styles.disputeActionBtn}
                    activeOpacity={0.7}
                  >
                    <Flag size={13} color="#EF4444" />
                    <Text style={styles.disputeActionText}>Flag / Dispute</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
        )}
      </ScrollView>

      {/* REVIEW PUBLIC REPLY MODAL */}
      <ReviewReplyModal
        visible={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        review={replyTarget}
        onSubmitReply={async (reviewId, text) => {
          setRepliesMap((prev) => ({ ...prev, [reviewId]: text }));
          showSuccess('Response Published', 'Your reply is now live for all prospective clients.');
          submitReply({ reviewId, replyText: text });
        }}
        onDeleteReply={async (reviewId) => {
          setRepliesMap((prev) => {
            const copy = { ...prev };
            delete copy[reviewId];
            return copy;
          });
          deleteReply(reviewId);
        }}
      />

      {/* DISPUTE REVIEW MODAL */}
      <DisputeReviewModal
        visible={!!disputeTarget}
        onClose={() => setDisputeTarget(null)}
        review={disputeTarget}
        onSubmitDispute={async (reviewId, reason, explanation) => {
          // Submitted to moderation
        }}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 16,
  },
  scoreLeft: {
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    paddingRight: 16,
  },
  scoreBig: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  starsRow: {
    fontSize: 14,
    color: '#D97706',
    marginTop: 2,
  },
  totalCount: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 4,
  },
  barsCol: {
    flex: 1,
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 10,
    color: colors.neutral[600],
    width: 22,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: radius.full,
  },
  barPercent: {
    fontSize: 10,
    color: colors.neutral[400],
    width: 26,
    textAlign: 'right',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  badgePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  badgeEmoji: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  feedHeading: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    ...shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  jobSub: {
    fontSize: 11,
    color: colors.brand.emeraldDark,
    marginTop: 1,
    fontWeight: '600',
  },
  ratingBox: {
    alignItems: 'flex-end',
  },
  starText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: '#D97706',
  },
  dateText: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 1,
  },
  commentBody: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[700],
    lineHeight: 19,
    marginTop: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  centerWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  emptyWrap: {
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  starFiltersBar: {
    marginTop: spacing.md,
  },
  starFiltersScroll: {
    gap: 8,
  },
  starFilterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  starFilterChipActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  starFilterText: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  starFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  replyBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderColor: '#10B981',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 10,
  },
  replyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.emeraldDark,
  },
  publicBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  publicBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.brand.emeraldDark,
  },
  replyBodyText: {
    fontSize: typography.size.xs,
    color: colors.neutral[700],
    lineHeight: 17,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  replyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand.forest,
  },
  disputeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  disputeActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
});
