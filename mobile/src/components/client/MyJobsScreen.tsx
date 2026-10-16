import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { JobService } from '../../services/job.service';

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
}

interface MyJobsScreenProps {
  onBack?: () => void;
  onSelectJob?: (jobId: string) => void;
  onPostNewJob?: () => void;
}

export const MyJobsScreen: React.FC<MyJobsScreenProps> = ({
  onBack,
  onSelectJob,
  onPostNewJob,
}) => {
  const [tab, setTab] = useState<'OPEN_BIDS' | 'IN_PROGRESS' | 'COMPLETED'>('OPEN_BIDS');
  const [jobs, setJobs] = useState<ClientJobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const loadJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await JobService.getMyJobs();
      if (Array.isArray(data)) {
        const transformed: ClientJobItem[] = data.map((j: any) => {
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
            assignedArtisan = activeContract.artisan?.artisanProfile?.businessName ||
              activeContract.artisan?.clientProfile?.firstName ||
              'Assigned Artisan';
            const pendingMilestone = activeContract.milestones?.find((m: any) => m.status === 'SUBMITTED' || m.status === 'IN_PROGRESS');
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
          };
        });
        setJobs(transformed);
      } else {
        setJobs([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const openBidsCount = jobs.filter((j) => j.status === 'OPEN_BIDS').length;
  const inProgressCount = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;

  const filteredJobs = jobs.filter((j) => j.status === tab);

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
          <Text style={styles.headerTitle}>My Jobs & Repairs</Text>
        </View>

        <TouchableOpacity onPress={onPostNewJob} style={styles.postBtnHeader}>
          <Text style={styles.postBtnText}>+ Post Job</Text>
        </TouchableOpacity>
      </View>

      {/* 3-Tab Segment */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setTab('OPEN_BIDS')}
          style={[styles.tabItem, tab === 'OPEN_BIDS' && styles.tabItemActive]}
        >
          <View style={styles.tabPillRow}>
            <Text style={[styles.tabLabel, tab === 'OPEN_BIDS' && styles.tabLabelActive]}>
              Open Bids ({openBidsCount})
            </Text>
            {openBidsCount > 0 && <View style={styles.badgeDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('IN_PROGRESS')}
          style={[styles.tabItem, tab === 'IN_PROGRESS' && styles.tabItemActive]}
        >
          <Text style={[styles.tabLabel, tab === 'IN_PROGRESS' && styles.tabLabelActive]}>
            In Progress ({inProgressCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('COMPLETED')}
          style={[styles.tabItem, tab === 'COMPLETED' && styles.tabItemActive]}
        >
          <Text style={[styles.tabLabel, tab === 'COMPLETED' && styles.tabLabelActive]}>
            History ({completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.forest} />
          <Text style={styles.loadingText}>Fetching your jobs...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load your jobs</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity onPress={() => loadJobs()} style={styles.retryButton}>
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
              onRefresh={() => loadJobs(true)}
              tintColor={colors.brand.forest}
              colors={[colors.brand.forest]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>
                {tab === 'OPEN_BIDS'
                  ? 'No Open Repair Requests'
                  : tab === 'IN_PROGRESS'
                  ? 'No Work Currently In Progress'
                  : 'No Completed Jobs Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
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
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onSelectJob?.(item.id)}
              style={styles.card}
            >
              <View style={styles.topRow}>
                <View style={styles.tradeBadge}>
                  <Text style={styles.tradeText}>{item.trade}</Text>
                </View>
                <Text style={styles.dateText}>{item.postedDate}</Text>
              </View>

              <Text style={styles.jobTitle}>{item.title}</Text>

              {item.status === 'IN_PROGRESS' && (
                <View style={styles.inProgressBox}>
                  {item.assignedArtisan && (
                    <Text style={styles.artisanName}>Assigned: {item.assignedArtisan}</Text>
                  )}
                  {item.activeMilestone && (
                    <Text style={styles.milestoneNotice}>{item.activeMilestone}</Text>
                  )}
                </View>
              )}

              <View style={styles.footerRow}>
                <View>
                  <Text style={styles.budgetLabel}>Target Budget</Text>
                  <Text style={styles.budgetValue}>{formatCurrency(item.budget)}</Text>
                </View>

                {item.status === 'OPEN_BIDS' ? (
                  <View style={styles.proposalsBadge}>
                    <Text style={styles.proposalsText}>
                      Review {item.proposalsCount} {item.proposalsCount === 1 ? 'Bid' : 'Bids'} ›
                    </Text>
                  </View>
                ) : item.status === 'IN_PROGRESS' ? (
                  <View style={styles.trackBadge}>
                    <Text style={styles.trackText}>Track Workspace ›</Text>
                  </View>
                ) : (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓ View Receipt</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tradeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand.emeraldDark,
  },
  dateText: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  jobTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  inProgressBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: radius.md,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  artisanName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  milestoneNotice: {
    fontSize: 10,
    color: colors.neutral[600],
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  budgetLabel: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  budgetValue: {
    fontSize: typography.size.base,
    fontWeight: '900',
    color: colors.brand.forest,
    marginTop: 2,
  },
  proposalsBadge: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  proposalsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  trackBadge: {
    backgroundColor: colors.brand.emerald,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  trackText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  completedBadge: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  completedText: {
    fontSize: 11,
    color: colors.neutral[700],
    fontWeight: '600',
  },
});
