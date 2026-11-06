import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { Camera, ChevronRight, Wrench, X, Eye, Maximize2, AlertCircle, ClipboardList } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { JobService } from '../../services/job.service';
import { SkeletonJobCard } from '../shared';

// High-fidelity fallback defect/work photos by trade category so cards always look authentic
const TRADE_FALLBACK_IMAGES: Record<string, string> = {
  plumbing: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
  electrical: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
  carpentry: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80',
  painting: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80',
  welding: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80',
  mechanic: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
  masonry: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=400&q=80',
  roofing: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=400&q=80',
};

const getTradeFallbackImage = (trade?: string): string => {
  if (!trade) return 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80';
  const lower = trade.toLowerCase();
  for (const [key, url] of Object.entries(TRADE_FALLBACK_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=80';
};

interface ClientJobItem {
  id: string;
  title: string;
  trade: string;
  proposalsCount: number;
  status: 'OPEN_BIDS' | 'IN_PROGRESS' | 'COMPLETED';
  activeMilestone?: string;
  assignedArtisan?: string;
  budget: number;
  postedDate: string;
  attachments?: any[];
}

interface MyJobsScreenProps {
  onBack?: () => void;
  onSelectJob?: (jobId: string) => void;
  onPostNewJob?: () => void;
  onRepostJob?: (jobData: { title?: string; trade?: string; budget?: number; description?: string }) => void;
}

export const MyJobsScreen: React.FC<MyJobsScreenProps> = ({
  onBack,
  onSelectJob,
  onPostNewJob,
  onRepostJob,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [tab, setTab] = useState<'OPEN_BIDS' | 'IN_PROGRESS' | 'COMPLETED'>('OPEN_BIDS');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const formatRelativeTime = (dateStr?: string): string => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return 'Posted just now';
      if (diffHrs < 24) return `Posted ${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return 'Posted yesterday';
      if (diffDays < 7) return `Posted ${diffDays}d ago`;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recently';
    }
  };

  const {
    data: jobs = [],
    isLoading: loading,
    isRefetching: refreshing,
    refetch,
    error: queryError,
  } = useQuery<ClientJobItem[]>({
    queryKey: ['client-my-jobs'],
    queryFn: async () => {
      const data = await JobService.getMyJobs();
      if (!Array.isArray(data)) return [];
      return data
        .filter((j: any) => (j.status || '').toUpperCase() !== 'CANCELLED')
        .map((j: any): ClientJobItem => {
        let mappedStatus: 'OPEN_BIDS' | 'IN_PROGRESS' | 'COMPLETED' = 'OPEN_BIDS';
        const rawStatus = (j.status || '').toUpperCase();
        if (rawStatus === 'IN_PROGRESS' || rawStatus === 'ASSIGNED') {
          mappedStatus = 'IN_PROGRESS';
        } else if (rawStatus === 'COMPLETED' || rawStatus === 'CLOSED') {
          mappedStatus = 'COMPLETED';
        } else {
          mappedStatus = 'OPEN_BIDS';
        }

        const activeContract = j.contracts?.[0];
        let assignedArtisan: string | undefined;
        let activeMilestone: string | undefined;

        if (activeContract) {
          assignedArtisan =
            activeContract.artisan?.artisanProfile?.businessName ||
            activeContract.artisan?.clientProfile?.firstName ||
            'Assigned Artisan';
          const pendingMilestone = activeContract.milestones?.find(
            (m: any) => m.status === 'SUBMITTED' || m.status === 'IN_PROGRESS'
          );
          if (pendingMilestone) {
            activeMilestone = `${pendingMilestone.title} (${pendingMilestone.status})`;
          }
        }

        return {
          id: j.id,
          title: j.title || 'Untitled Job',
          trade: j.category?.name || j.trade || 'General Trade',
          proposalsCount: j.proposals?.length ?? j.proposalsCount ?? 0,
          status: mappedStatus,
          activeMilestone,
          assignedArtisan,
          budget: Number(j.budget || j.budgetMax || j.budgetMin || 0),
          postedDate: formatRelativeTime(j.createdAt),
          attachments: j.attachments || [],
        };
      });
    },
    staleTime: 1000 * 60 * 3, // 3 minutes fresh cache
  });

  const error = queryError ? (queryError as any)?.response?.data?.message || queryError.message || 'Failed to load jobs' : null;

  const openBidsCount = jobs.filter((j) => j.status === 'OPEN_BIDS').length;
  const inProgressCount = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;

  const filteredJobs = jobs
    .filter((j) => j.status === tab)
    .filter((j) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return j.title.toLowerCase().includes(q) || j.trade.toLowerCase().includes(q);
    });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <Text style={[styles.backChevron, { color: themeColors.text }]}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>My Jobs & Repairs</Text>
        </View>

        <TouchableOpacity onPress={onPostNewJob} style={styles.postBtnHeader}>
          <Text style={styles.postBtnText}>+ Post Job</Text>
        </TouchableOpacity>
      </View>

      {/* 3-Tab Segment */}
      <View style={[styles.tabBar, { backgroundColor: themeColors.surfaceSubtle }]}>
        <TouchableOpacity
          onPress={() => setTab('OPEN_BIDS')}
          style={[styles.tabItem, tab === 'OPEN_BIDS' && [styles.tabItemActive, { backgroundColor: isDark ? themeColors.surface : '#FFFFFF' }]]}
        >
          <View style={styles.tabPillRow}>
            <Text style={[styles.tabLabel, { color: themeColors.textMuted }, tab === 'OPEN_BIDS' && [styles.tabLabelActive, { color: isDark ? themeColors.primary : colors.brand.forest }]]}>
              Open Bids ({openBidsCount})
            </Text>
            {openBidsCount > 0 && <View style={styles.badgeDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('IN_PROGRESS')}
          style={[styles.tabItem, tab === 'IN_PROGRESS' && [styles.tabItemActive, { backgroundColor: isDark ? themeColors.surface : '#FFFFFF' }]]}
        >
          <Text style={[styles.tabLabel, { color: themeColors.textMuted }, tab === 'IN_PROGRESS' && [styles.tabLabelActive, { color: isDark ? themeColors.primary : colors.brand.forest }]]}>
            In Progress ({inProgressCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('COMPLETED')}
          style={[styles.tabItem, tab === 'COMPLETED' && [styles.tabItemActive, { backgroundColor: isDark ? themeColors.surface : '#FFFFFF' }]]}
        >
          <Text style={[styles.tabLabel, { color: themeColors.textMuted }, tab === 'COMPLETED' && [styles.tabLabelActive, { color: isDark ? themeColors.primary : colors.brand.forest }]]}>
            History ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Filter Bar */}
      <View style={styles.searchWrap}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.inputBorder,
              color: themeColors.text,
            },
          ]}
          placeholder="Filter my jobs by title or trade..."
          placeholderTextColor={themeColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonJobCard />
          <SkeletonJobCard />
          <SkeletonJobCard />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={36} color="#EF4444" style={{ marginBottom: 8 }} />
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>Could not load your jobs</Text>
          <Text style={[styles.errorSubtitle, { color: themeColors.textMuted }]}>{error}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Jobs Feed */
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { refetch(); }}
              tintColor={isDark ? themeColors.primary : colors.brand.forest}
              colors={[isDark ? themeColors.primary : colors.brand.forest]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ClipboardList size={36} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                {tab === 'OPEN_BIDS'
                  ? 'No Open Repair Requests'
                  : tab === 'IN_PROGRESS'
                  ? 'No Work Currently In Progress'
                  : 'No Completed Jobs Yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                {tab === 'OPEN_BIDS'
                  ? 'Post a new repair to receive competitive bids from verified artisans near you.'
                  : tab === 'IN_PROGRESS'
                  ? 'When you accept an artisan bid and fund the escrow, active work will appear here.'
                  : 'Completed contracts and payment receipts will be archived in this section.'}
              </Text>
              {tab === 'OPEN_BIDS' && (
                <TouchableOpacity onPress={onPostNewJob} style={styles.emptyCta}>
                  <Text style={styles.emptyCtaText}>+ Post a Repair Request</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const rawPhoto = item.attachments?.[0]?.fileUrl || item.attachments?.[0]?.url || null;
            const photoUrl = rawPhoto || getTradeFallbackImage(item.trade);
            const hasUploadedPhoto = !!rawPhoto;

            return (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => onSelectJob?.(item.id)}
                style={[
                  styles.card,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <View style={styles.cardRow}>
                  {/* Left: Uploaded Defect/Job Image (Tap to inspect full resolution) */}
                  <TouchableOpacity
                    style={[styles.thumbnailContainer, { backgroundColor: themeColors.surfaceSubtle }]}
                    activeOpacity={0.85}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setPreviewImage({
                        url: photoUrl,
                        title: item.title,
                      });
                    }}
                  >
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    {hasUploadedPhoto && (
                      <View style={styles.zoomHintBadge}>
                        <Maximize2 size={9} color="#FFFFFF" strokeWidth={2.4} />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Right: Job Information */}
                  <View style={styles.contentCol}>
                    {/* Top Row: Trade Pill & Posted Date */}
                    <View style={styles.cardTopRow}>
                      <View
                        style={[
                          styles.tradeBadge,
                          { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#E6F4EA' },
                        ]}
                      >
                        <Text style={[styles.tradeText, { color: isDark ? '#34D399' : '#15803D' }]}>
                          {item.trade}
                        </Text>
                      </View>
                      <Text style={[styles.dateText, { color: themeColors.textMuted }]}>{item.postedDate}</Text>
                    </View>

                    {/* Job Title */}
                    <Text style={[styles.jobTitle, { color: themeColors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>

                    {/* Bottom Row: Target Budget & Action Pill */}
                    <View style={styles.cardBottomRow}>
                      <View>
                        <Text style={[styles.budgetLabel, { color: themeColors.textMuted }]}>Target Budget</Text>
                        <Text style={[styles.budgetValue, { color: isDark ? '#34D399' : '#064E3B' }]}>
                          {formatCurrency(item.budget)}
                        </Text>
                      </View>

                      {item.status === 'OPEN_BIDS' ? (
                        <View
                          style={[
                            styles.bidsPill,
                            { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#E8F5E9' },
                          ]}
                        >
                          <Text style={[styles.bidsText, { color: isDark ? '#34D399' : '#065F46' }]}>
                            {item.proposalsCount} {item.proposalsCount === 1 ? 'Bid' : 'Bids'}
                          </Text>
                          <ChevronRight
                            size={13}
                            color={isDark ? '#34D399' : '#065F46'}
                            strokeWidth={2.4}
                            style={{ marginLeft: 3 }}
                          />
                        </View>
                      ) : item.status === 'IN_PROGRESS' ? (
                        <View style={styles.trackPill}>
                          <Text style={styles.trackText}>Track Workspace</Text>
                          <ChevronRight size={13} color="#FFFFFF" strokeWidth={2.4} style={{ marginLeft: 3 }} />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.bidsPill,
                            { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#E8F5E9' },
                          ]}
                        >
                          <Text style={[styles.bidsText, { color: isDark ? '#34D399' : '#065F46' }]}>
                            View Details
                          </Text>
                          <ChevronRight
                            size={13}
                            color={isDark ? '#34D399' : '#065F46'}
                            strokeWidth={2.4}
                            style={{ marginLeft: 3 }}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Fullscreen Photo Inspection Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={styles.modalSafeWrap}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {previewImage?.title || 'Defect Photo'}
                </Text>
                <Text style={styles.modalHeaderSubtitle}>Site Inspection Image</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPreviewImage(null)}
                activeOpacity={0.8}
              >
                <X size={16} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 4 }} />
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalImageContainer}>
              {previewImage ? (
                <Image
                  source={{ uri: previewImage.url }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
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
  postBtnHeader: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  postBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: radius.md,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  tabPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  tabLabelActive: {
    color: colors.brand.forest,
    fontWeight: '800',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.emerald,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: 12,
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: typography.size.xs,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCta: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    ...shadows.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 66,
    height: 66,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    height: 66,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tradeBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tradeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  dateText: {
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  jobTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
    marginVertical: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  budgetLabel: {
    fontSize: 9.5,
    color: '#9CA3AF',
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064E3B',
  },
  bidsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
  },
  bidsText: {
    color: '#065F46',
    fontSize: 11.5,
    fontWeight: '800',
  },
  trackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D472D',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
  },
  trackText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  searchWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.neutral[900],
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  repostBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: colors.brand.emerald,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  repostBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  zoomHintBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  modalSafeWrap: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  modalCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  modalCloseText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});
