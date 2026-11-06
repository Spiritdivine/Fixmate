import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  Heart,
  BadgeCheck,
  MapPin,
  Star,
  MessageSquare,
  Mail,
  Zap,
  Camera,
  Image as ImageIcon,
  ChevronLeft,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProfileService } from '../../services/profile.service';
import { ReviewService } from '../../services/review.service';
import { queryClient } from '../../lib/query-client';
import { JobInvitationModal } from './JobInvitationModal';
import { SkeletonPlaceholder } from '../shared';
import { useToast } from '../shared/ToastContext';
import { useToggleSaveArtisan } from '../../hooks';

interface ArtisanPublicProfileScreenProps {
  artisanId?: string;
  onBack?: () => void;
  onChat?: () => void;
  onRequestQuote?: (trade?: string) => void;
}

export const ArtisanPublicProfileScreen: React.FC<ArtisanPublicProfileScreenProps> = ({
  artisanId,
  onBack,
  onChat,
  onRequestQuote,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { showSuccess, showError } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'REVIEWS' | 'ABOUT'>('PORTFOLIO');
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);

  const { data: artisan, isLoading: loadingArtisan } = useQuery({
    queryKey: ['artisan-details', artisanId],
    queryFn: () => ProfileService.getArtisanDetails(artisanId!),
    enabled: !!artisanId,
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['artisan-reviews', artisanId],
    queryFn: () => ReviewService.getArtisanReviews(artisanId!),
    enabled: !!artisanId,
  });

  // Check saved status
  useEffect(() => {
    if (!artisanId) return;
    (async () => {
      try {
        const savedList = await ProfileService.getSavedArtisans();
        if (Array.isArray(savedList)) {
          setIsSaved(savedList.some((a) => a.id === artisanId));
        }
      } catch {
        // Ignore background saved check error
      }
    })();
  }, [artisanId]);

  const toggleSaveMutation = useToggleSaveArtisan();

  const handleToggleSave = () => {
    if (!artisanId) return;
    const next = !isSaved;
    setIsSaved(next);
    if (next) {
      showSuccess('Artisan Saved', 'Added to your saved artisans directory.');
    } else {
      showSuccess('Artisan Removed', 'Removed from your bookmarks.');
    }

    toggleSaveMutation.mutate(
      { artisanId, artisan: artisan as any, isSaved: next },
      {
        onError: () => {
          setIsSaved(!next);
          showError('Bookmark Error', 'Could not update saved artisan status.');
        },
      }
    );
  };

  const displayName = artisan?.businessName || (artisan as any)?.user?.name || (artisan as any)?.user?.email?.split('@')[0] || 'Verified Artisan';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AR';
  const tradeName = artisan?.trade || 'Specialist Artisan';
  const ratingVal = Number(artisan?.rating || 5.0);
  const jobsCount = Number(artisan?.completedJobsCount || (artisan as any)?.jobsCompleted || 0);
  const rateVal = Number(artisan?.hourlyRate || artisan?.startingPrice || 0);
  const portfolioItems = artisan?.portfolio || [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ChevronLeft size={22} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Artisan Profile</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleToggleSave}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart size={20} color={isSaved ? '#EF4444' : themeColors.textMuted} fill={isSaved ? '#EF4444' : 'transparent'} />
        </TouchableOpacity>
      </View>

      {loadingArtisan ? (
        <View style={styles.scrollContent}>
          {/* Dossier Card Shimmer */}
          <View style={[styles.dossierCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.avatarRow}>
              <SkeletonPlaceholder width={56} height={56} borderRadius={28} />
              <View style={[styles.dossierMeta, { marginLeft: 12 }]}>
                <SkeletonPlaceholder width={140} height={20} borderRadius={radius.sm} />
                <SkeletonPlaceholder width={90} height={14} borderRadius={radius.sm} style={{ marginTop: 6 }} />
                <SkeletonPlaceholder width={110} height={12} borderRadius={radius.sm} style={{ marginTop: 6 }} />
              </View>
            </View>
            <View style={{ marginTop: 16 }}>
              <SkeletonPlaceholder width="100%" height={14} borderRadius={radius.sm} />
              <SkeletonPlaceholder width="75%" height={14} borderRadius={radius.sm} style={{ marginTop: 6 }} />
            </View>
            <View style={[styles.statsBar, { backgroundColor: themeColors.surfaceSubtle, marginTop: 16 }]}>
              <View style={styles.statItem}>
                <SkeletonPlaceholder width={40} height={18} borderRadius={radius.sm} />
                <SkeletonPlaceholder width={60} height={10} borderRadius={radius.sm} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.statItem}>
                <SkeletonPlaceholder width={40} height={18} borderRadius={radius.sm} />
                <SkeletonPlaceholder width={60} height={10} borderRadius={radius.sm} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.statItem}>
                <SkeletonPlaceholder width={40} height={18} borderRadius={radius.sm} />
                <SkeletonPlaceholder width={60} height={10} borderRadius={radius.sm} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>

          {/* Section Card Shimmer */}
          <View style={[styles.portfolioCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <SkeletonPlaceholder width={130} height={18} borderRadius={radius.sm} style={{ marginBottom: 12 }} />
            <SkeletonPlaceholder width="100%" height={14} borderRadius={radius.sm} />
            <SkeletonPlaceholder width="90%" height={14} borderRadius={radius.sm} style={{ marginTop: 6 }} />
            <SkeletonPlaceholder width="60%" height={14} borderRadius={radius.sm} style={{ marginTop: 6 }} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Dossier Hero */}
          <View style={[styles.dossierCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatar, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                {artisan?.avatarUrl ? (
                  <Image source={{ uri: artisan.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 28 }} />
                ) : (
                  <Text style={[styles.avatarText, isDark && { color: '#34D399' }]}>{initials}</Text>
                )}
                {artisan?.isAvailable !== false && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.dossierMeta}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: themeColors.text }]}>{displayName}</Text>
                  {artisan?.isVerified && (
                    <View style={[styles.ninBadge, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <BadgeCheck size={12} color={isDark ? '#34D399' : '#15803D'} />
                      <Text style={[styles.ninBadgeText, isDark && { color: '#34D399' }]}>NIN Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.trade, { color: themeColors.textMuted }]}>{tradeName}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <MapPin size={12} color={themeColors.textMuted} />
                  <Text style={[styles.location, { color: themeColors.textMuted, marginTop: 0 }]}>{(artisan as any)?.location || (artisan as any)?.address || 'Lagos, Nigeria'}</Text>
                </View>
                {rateVal > 0 && (
                  <Text style={[styles.hourlyRate, { color: themeColors.textMuted }]}>
                    Base rate: <Text style={[styles.rateHighlight, isDark && { color: '#34D399' }]}>{formatCurrency(rateVal)} / hr</Text>
                  </Text>
                )}
              </View>
            </View>

            {/* Stats Bar */}
            <View style={[styles.statsBar, { backgroundColor: themeColors.surfaceSubtle }]}>
              <View style={styles.statItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.statVal, { color: themeColors.text }]}>{ratingVal.toFixed(1)}</Text>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                </View>
                <Text style={[styles.statLbl, { color: themeColors.textMuted }]}>Rating ({reviews.length})</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: themeColors.text }]}>{jobsCount}</Text>
                <Text style={[styles.statLbl, { color: themeColors.textMuted }]}>Jobs Done</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: themeColors.text }]}>99%</Text>
                <Text style={[styles.statLbl, { color: themeColors.textMuted }]}>On-Time</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: themeColors.text }]}>0</Text>
                <Text style={[styles.statLbl, { color: themeColors.textMuted }]}>Disputes</Text>
              </View>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={[styles.tabsRow, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'PORTFOLIO' && styles.tabBtnActive]}
              onPress={() => setActiveTab('PORTFOLIO')}
            >
              <Text style={[styles.tabText, { color: themeColors.textMuted }, activeTab === 'PORTFOLIO' && styles.tabTextActive]}>
                Portfolio ({portfolioItems.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'REVIEWS' && styles.tabBtnActive]}
              onPress={() => setActiveTab('REVIEWS')}
            >
              <Text style={[styles.tabText, { color: themeColors.textMuted }, activeTab === 'REVIEWS' && styles.tabTextActive]}>
                Reviews ({reviews.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ABOUT' && styles.tabBtnActive]}
              onPress={() => setActiveTab('ABOUT')}
            >
              <Text style={[styles.tabText, { color: themeColors.textMuted }, activeTab === 'ABOUT' && styles.tabTextActive]}>
                About & Skills
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'PORTFOLIO' && (
            <View style={styles.contentSection}>
              {portfolioItems.length === 0 ? (
                <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                  <ImageIcon size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 14, color: themeColors.textMuted, textAlign: 'center' }}>
                    No portfolio projects uploaded by this artisan yet.
                  </Text>
                </View>
              ) : (
                portfolioItems.map((item: any, idx: number) => (
                  <View key={item.id || idx} style={[styles.portfolioCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    {item.imageUrl && (
                      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 160, borderRadius: radius.md, marginBottom: 8 }} />
                    )}
                    <View style={styles.portfolioBanner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Camera size={12} color={isDark ? '#34D399' : colors.primary} />
                        <Text style={[styles.portfolioTag, isDark && { color: '#34D399' }]}>Verified Project</Text>
                      </View>
                    </View>
                    <Text style={[styles.portfolioTitle, { color: themeColors.text }]}>{item.title}</Text>
                    {item.description && <Text style={[styles.portfolioDesc, { color: themeColors.text }]}>{item.description}</Text>}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'REVIEWS' && (
            <View style={styles.contentSection}>
              {loadingReviews ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
              ) : reviews.length === 0 ? (
                <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                  <Star size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 14, color: themeColors.textMuted, textAlign: 'center' }}>
                    No reviews yet. Be the first client to complete a job and review this artisan!
                  </Text>
                </View>
              ) : (
                reviews.map((rev) => (
                  <View key={rev.id} style={[styles.reviewItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewClient, { color: themeColors.text }]}>Verified Client</Text>
                      <Text style={[styles.reviewDate, { color: themeColors.textMuted }]}>
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recently'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 2, marginVertical: 4 }}>
                      {Array.from({ length: Math.min(rev.rating || 5, 5) }).map((_, i) => (
                        <Star key={i} size={11} color="#F59E0B" fill="#F59E0B" />
                      ))}
                    </View>
                    {rev.comment && <Text style={[styles.reviewComment, { color: themeColors.text }]}>"{rev.comment}"</Text>}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'ABOUT' && (
            <View style={styles.contentSection}>
              <View style={[styles.aboutCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Text style={[styles.aboutTitle, { color: themeColors.text }]}>Biography</Text>
                <Text style={[styles.aboutText, { color: themeColors.text }]}>
                  {artisan?.bio ||
                    `Specialized ${tradeName} offering high-precision residential and commercial repair services on the Artifix platform.`}
                </Text>

                <Text style={[styles.aboutTitle, { color: themeColors.text, marginTop: spacing.md }]}>Skills & Equipment</Text>
                <View style={styles.skillPillsWrap}>
                  {(artisan?.skills && artisan.skills.length > 0
                    ? artisan.skills
                    : [tradeName, 'Diagnostic Inspection', 'Site Safety Protocol', 'Zero-Defect Handover']
                  ).map((s: string) => (
                    <View key={s} style={[styles.skillPill, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
                      <Text style={[styles.skillPillText, { color: themeColors.text }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <TouchableOpacity style={[styles.chatBtn, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]} onPress={onChat} activeOpacity={0.8}>
          <MessageSquare size={16} color={themeColors.text} />
          <Text style={[styles.chatBtnText, { color: themeColors.text }]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.inviteBtn, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}
          onPress={() => setIsInviteModalVisible(true)}
          activeOpacity={0.8}
        >
          <Mail size={16} color={isDark ? '#34D399' : colors.primary} />
          <Text style={[styles.inviteBtnText, isDark && { color: '#34D399' }]}>Invite to Job</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hireBtn} onPress={() => onRequestQuote?.(tradeName)} activeOpacity={0.8}>
          <Zap size={16} color="#FFFFFF" />
          <Text style={styles.hireBtnText}>Direct Hire</Text>
        </TouchableOpacity>
      </View>

      {/* Direct Job Invitation Modal */}
      {artisanId && (
        <JobInvitationModal
          visible={isInviteModalVisible}
          artisanId={artisanId}
          artisanName={displayName}
          artisanTrade={tradeName}
          onClose={() => setIsInviteModalVisible(false)}
          onCreateNewJob={() => onRequestQuote?.(tradeName)}
        />
      )}
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
  iconBtn: {
    padding: spacing.xs,
  },
  iconBtnText: {
    fontSize: 22,
    color: colors.text,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  dossierCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  avatarText: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dossierMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    ...typography.h3,
    color: colors.text,
  },
  ninBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  ninBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  trade: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  location: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  hourlyRate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  rateHighlight: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statVal: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLbl: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  contentSection: {
    gap: spacing.sm,
  },
  portfolioCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  portfolioBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  portfolioTag: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },
  portfolioDuration: {
    fontSize: 11,
    color: colors.textMuted,
  },
  portfolioTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  portfolioLoc: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  portfolioDesc: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  ratingSummaryBox: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  ratingBigCol: {
    alignItems: 'center',
    marginRight: spacing.md,
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  ratingBigText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  ratingStars: {
    fontSize: 12,
    marginVertical: 2,
  },
  ratingCount: {
    fontSize: 10,
    color: colors.textMuted,
  },
  ratingPraiseTags: {
    flex: 1,
    gap: 4,
  },
  praiseTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  praiseTagText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '600',
  },
  reviewItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  reviewClient: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  reviewRatingStars: {
    fontSize: 11,
    marginBottom: 4,
  },
  reviewComment: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 18,
  },
  aboutCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aboutTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  aboutText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  skillPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPill: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skillPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    ...shadows.lg,
  },
  chatBtn: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  inviteBtn: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  hireBtn: {
    flex: 1.2,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
