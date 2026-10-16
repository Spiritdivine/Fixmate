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
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProfileService } from '../../services/profile.service';
import { ReviewService } from '../../services/review.service';
import { queryClient } from '../../lib/query-client';

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
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'REVIEWS' | 'ABOUT'>('PORTFOLIO');

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

  const handleToggleSave = async () => {
    if (!artisanId) return;
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) {
        await ProfileService.saveArtisan(artisanId);
      } else {
        await ProfileService.unsaveArtisan(artisanId);
      }
      await queryClient.invalidateQueries({ queryKey: ['saved-artisans'] });
    } catch {
      setIsSaved(!next);
      Alert.alert('Bookmark', 'Could not update saved artisan status.');
    }
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
    <SafeAreaView style={styles.safe}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artisan Profile</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleToggleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.iconBtnText}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      {loadingArtisan ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textMuted }}>Loading artisan credentials...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Dossier Hero */}
          <View style={styles.dossierCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                {artisan?.avatarUrl ? (
                  <Image source={{ uri: artisan.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 28 }} />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
                {artisan?.isAvailable !== false && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.dossierMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{displayName}</Text>
                  {artisan?.isVerified && (
                    <View style={styles.ninBadge}>
                      <Text style={styles.ninBadgeText}>✓ NIN Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.trade}>{tradeName}</Text>
                <Text style={styles.location}>📍 {(artisan as any)?.location || (artisan as any)?.address || 'Lagos, Nigeria'}</Text>
                {rateVal > 0 && (
                  <Text style={styles.hourlyRate}>
                    Base rate: <Text style={styles.rateHighlight}>{formatCurrency(rateVal)} / hr</Text>
                  </Text>
                )}
              </View>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{ratingVal.toFixed(1)} ⭐</Text>
                <Text style={styles.statLbl}>Rating ({reviews.length})</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{jobsCount}</Text>
                <Text style={styles.statLbl}>Jobs Done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>99%</Text>
                <Text style={styles.statLbl}>On-Time</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>0</Text>
                <Text style={styles.statLbl}>Disputes</Text>
              </View>
            </View>
          </View>

          {/* Verification & Trust Badges */}
          <View style={styles.trustBadgesRow}>
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeIcon}>🛡️</Text>
              <Text style={styles.trustBadgeText}>Fixmate Escrow Covered</Text>
            </View>
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeIcon}>📜</Text>
              <Text style={styles.trustBadgeText}>Verified Background</Text>
            </View>
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeIcon}>⚡</Text>
              <Text style={styles.trustBadgeText}>Quality Guaranteed</Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'PORTFOLIO' && styles.tabBtnActive]}
              onPress={() => setActiveTab('PORTFOLIO')}
            >
              <Text style={[styles.tabText, activeTab === 'PORTFOLIO' && styles.tabTextActive]}>
                Portfolio ({portfolioItems.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'REVIEWS' && styles.tabBtnActive]}
              onPress={() => setActiveTab('REVIEWS')}
            >
              <Text style={[styles.tabText, activeTab === 'REVIEWS' && styles.tabTextActive]}>
                Reviews ({reviews.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ABOUT' && styles.tabBtnActive]}
              onPress={() => setActiveTab('ABOUT')}
            >
              <Text style={[styles.tabText, activeTab === 'ABOUT' && styles.tabTextActive]}>
                About & Skills
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'PORTFOLIO' && (
            <View style={styles.contentSection}>
              {portfolioItems.length === 0 ? (
                <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🖼️</Text>
                  <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
                    No portfolio projects uploaded by this artisan yet.
                  </Text>
                </View>
              ) : (
                portfolioItems.map((item: any, idx: number) => (
                  <View key={item.id || idx} style={styles.portfolioCard}>
                    {item.imageUrl && (
                      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 160, borderRadius: radius.md, marginBottom: 8 }} />
                    )}
                    <View style={styles.portfolioBanner}>
                      <Text style={styles.portfolioTag}>📸 Verified Project</Text>
                    </View>
                    <Text style={styles.portfolioTitle}>{item.title}</Text>
                    {item.description && <Text style={styles.portfolioDesc}>{item.description}</Text>}
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
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>⭐</Text>
                  <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center' }}>
                    No reviews yet. Be the first client to complete a job and review this artisan!
                  </Text>
                </View>
              ) : (
                reviews.map((rev) => (
                  <View key={rev.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewClient}>Verified Client</Text>
                      <Text style={styles.reviewDate}>
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recently'}
                      </Text>
                    </View>
                    <Text style={styles.reviewRatingStars}>{'⭐'.repeat(Math.min(rev.rating || 5, 5))}</Text>
                    {rev.comment && <Text style={styles.reviewComment}>"{rev.comment}"</Text>}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'ABOUT' && (
            <View style={styles.contentSection}>
              <View style={styles.aboutCard}>
                <Text style={styles.aboutTitle}>Biography</Text>
                <Text style={styles.aboutText}>
                  {artisan?.bio ||
                    `Specialized ${tradeName} offering high-precision residential and commercial repair services on the Fixmate platform.`}
                </Text>

                <Text style={[styles.aboutTitle, { marginTop: spacing.md }]}>Skills & Equipment</Text>
                <View style={styles.skillPillsWrap}>
                  {(artisan?.skills && artisan.skills.length > 0
                    ? artisan.skills
                    : [tradeName, 'Diagnostic Inspection', 'Site Safety Protocol', 'Zero-Defect Handover']
                  ).map((s: string) => (
                    <View key={s} style={styles.skillPill}>
                      <Text style={styles.skillPillText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatBtn} onPress={onChat} activeOpacity={0.8}>
          <Text style={styles.chatBtnText}>💬 Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hireBtn} onPress={() => onRequestQuote?.(tradeName)} activeOpacity={0.8}>
          <Text style={styles.hireBtnText}>Direct Hire / Get Quote</Text>
        </TouchableOpacity>
      </View>
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
  trustBadgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  trustBadge: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  trustBadgeIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
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
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chatBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  hireBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  hireBtnText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
