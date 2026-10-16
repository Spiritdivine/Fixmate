import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency, formatDistance } from '../../lib/formatters';
import { JobService } from '../../services/job.service';

interface MarketplaceJob {
  id: string;
  title: string;
  trade: string;
  locationName: string;
  distanceKm: number;
  budget: number;
  budgetType: 'FIXED' | 'NEGOTIABLE';
  urgency: 'NORMAL' | 'HIGH' | 'EMERGENCY';
  proposalsCount: number;
  postedTimeAgo: string;
  isSaved?: boolean;
}

interface JobsMarketplaceScreenProps {
  onBack?: () => void;
  onSelectJob?: (jobId: string) => void;
  onToggleSave?: (jobId: string) => void;
}

export const JobsMarketplaceScreen: React.FC<JobsMarketplaceScreenProps> = ({
  onBack,
  onSelectJob,
  onToggleSave,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEARBY' | 'URGENT' | 'HIGH_BUDGET'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobsMap, setSavedJobsMap] = useState<Record<string, boolean>>({});

  const { data: liveJobs, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['marketplace-jobs'],
    queryFn: () => JobService.listJobs(),
  });

  const { data: initialSavedJobs } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: () => JobService.getSavedJobs(),
  });

  React.useEffect(() => {
    if (Array.isArray(initialSavedJobs)) {
      const map: Record<string, boolean> = {};
      initialSavedJobs.forEach((j) => {
        if (j?.id) map[j.id] = true;
      });
      setSavedJobsMap(map);
    }
  }, [initialSavedJobs]);

  const jobsList: MarketplaceJob[] = (liveJobs || []).map((j) => {
    let timeAgo = 'Just now';
    if (j.createdAt) {
      const diffMins = Math.floor((Date.now() - new Date(j.createdAt).getTime()) / (1000 * 60));
      if (diffMins < 60) timeAgo = `${Math.max(1, diffMins)}m ago`;
      else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)}h ago`;
      else timeAgo = `${Math.floor(diffMins / 1440)}d ago`;
    }

    return {
      id: j.id,
      title: j.title,
      trade: j.trade || 'General Artisan',
      locationName: j.location || 'Lagos, Nigeria',
      distanceKm: 2.5,
      budget: Number(j.budget || (j as any).budgetMax || 0),
      budgetType: j.budgetType === 'HOURLY' ? 'NEGOTIABLE' : 'FIXED',
      urgency: j.urgency === 'EMERGENCY' ? 'EMERGENCY' : j.urgency === 'HIGH' ? 'HIGH' : 'NORMAL',
      proposalsCount: (j as any).proposalsCount || (j as any)._count?.proposals || 0,
      postedTimeAgo: timeAgo,
    };
  });

  const handleBookmark = async (id: string) => {
    const isCurrentlySaved = !!savedJobsMap[id];
    setSavedJobsMap((prev) => ({ ...prev, [id]: !isCurrentlySaved }));
    try {
      if (isCurrentlySaved) {
        await JobService.unsaveJob(id);
      } else {
        await JobService.saveJob(id);
      }
      onToggleSave?.(id);
    } catch {
      // Revert on error
      setSavedJobsMap((prev) => ({ ...prev, [id]: isCurrentlySaved }));
    }
  };

  const filteredJobs = jobsList.filter((job) => {
    if (activeFilter === 'NEARBY' && job.distanceKm > 4) return false;
    if (activeFilter === 'URGENT' && job.urgency === 'NORMAL') return false;
    if (activeFilter === 'HIGH_BUDGET' && job.budget < 40000) return false;
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <Text style={styles.backChevron}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Jobs Marketplace</Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{filteredJobs.length} Leads Available</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs by trade or issue..."
          placeholderTextColor={colors.neutral[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
          <TouchableOpacity
            onPress={() => setActiveFilter('ALL')}
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, activeFilter === 'ALL' && styles.filterTextActive]}>All Leads</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('URGENT')}
            style={[styles.filterChip, activeFilter === 'URGENT' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, activeFilter === 'URGENT' && styles.filterTextActive]}>⚡ Emergency Only</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('NEARBY')}
            style={[styles.filterChip, activeFilter === 'NEARBY' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, activeFilter === 'NEARBY' && styles.filterTextActive]}>📍 Within 4 km</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('HIGH_BUDGET')}
            style={[styles.filterChip, activeFilter === 'HIGH_BUDGET' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, activeFilter === 'HIGH_BUDGET' && styles.filterTextActive]}>💰 ₦40k+ Budget</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Job Leads Feed */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, filteredJobs.length === 0 && styles.listEmptyContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand.forest}
            colors={[colors.brand.forest]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.brand.forest} />
              <Text style={styles.emptySub}>Loading jobs marketplace...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No Matching Leads Found</Text>
              <Text style={styles.emptySub}>
                There are currently no active job leads in this filter or search query. Pull down to refresh or check other categories.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isSaved = !!savedJobsMap[item.id];
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onSelectJob?.(item.id)}
              style={styles.jobCard}
            >
              <View style={styles.cardTopRow}>
                <View
                  style={[
                    styles.urgencyTag,
                    item.urgency === 'EMERGENCY'
                      ? styles.urgencyEmergency
                      : item.urgency === 'HIGH'
                      ? styles.urgencyHigh
                      : styles.urgencyNormal,
                  ]}
                >
                  <Text
                    style={[
                      styles.urgencyText,
                      item.urgency === 'EMERGENCY' && styles.urgencyTextEmergency,
                      item.urgency === 'HIGH' && styles.urgencyTextHigh,
                    ]}
                  >
                    {item.urgency === 'EMERGENCY'
                      ? '⚡ Emergency'
                      : item.urgency === 'HIGH'
                      ? '🔥 High Priority'
                      : '✓ Open Lead'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleBookmark(item.id)}
                  activeOpacity={0.7}
                  style={styles.bookmarkButton}
                >
                  <Text style={styles.bookmarkIcon}>{isSaved ? '🔖' : '📑'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.jobTitle}>{item.title}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.locationText}>📍 {item.locationName}</Text>
                <Text style={styles.distanceDot}>•</Text>
                <Text style={styles.distanceText}>{formatDistance(item.distanceKm)}</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.budgetCol}>
                  <Text style={styles.budgetLabel}>Guaranteed Escrow</Text>
                  <View style={styles.budgetValueRow}>
                    <Text style={styles.lockEmoji}>🔒</Text>
                    <Text style={styles.budgetValue}>{formatCurrency(item.budget)}</Text>
                  </View>
                </View>

                <View style={styles.actionsRight}>
                  <Text style={styles.proposalsCount}>
                    {item.proposalsCount} {item.proposalsCount === 1 ? 'Bid' : 'Bids'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onSelectJob?.(item.id)}
                    style={styles.bidButton}
                  >
                    <Text style={styles.bidButtonText}>Review & Bid ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
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
  badgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.brand.emeraldDark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.neutral[900],
  },
  filterBar: {
    marginTop: 10,
    marginBottom: 6,
  },
  filterChips: {
    paddingHorizontal: spacing.base,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  filterText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  urgencyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  urgencyEmergency: {
    backgroundColor: '#FEE2E2',
  },
  urgencyHigh: {
    backgroundColor: '#FEF3C7',
  },
  urgencyNormal: {
    backgroundColor: '#E0F2FE',
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  urgencyTextEmergency: {
    color: '#DC2626',
  },
  urgencyTextHigh: {
    color: '#D97706',
  },
  bookmarkButton: {
    padding: 4,
  },
  bookmarkIcon: {
    fontSize: 16,
  },
  jobTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  locationText: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[600],
  },
  distanceDot: {
    color: colors.neutral[400],
  },
  distanceText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '600',
    color: colors.brand.emeraldDark,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  budgetCol: {},
  budgetLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  budgetValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lockEmoji: {
    fontSize: 12,
  },
  budgetValue: {
    fontSize: typography.size.base,
    fontWeight: '900',
    color: colors.brand.forest,
  },
  actionsRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  proposalsCount: {
    fontSize: 10,
    color: colors.neutral[400],
    fontWeight: '600',
  },
  bidButton: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  bidButtonText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
});
