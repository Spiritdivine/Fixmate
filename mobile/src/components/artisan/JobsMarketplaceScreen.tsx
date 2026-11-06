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
import {
  SlidersHorizontal,
  Bookmark,
  MapPin,
  ShieldCheck,
  Camera,
  Zap,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency, formatDistance } from '../../lib/formatters';
import { JobService } from '../../services/job.service';
import { LocationProvider, GeoCoordinate } from '../../lib/location-provider';
import * as Haptics from 'expo-haptics';
import { SkeletonJobCard } from '../shared';
import { JobsFilterModal } from './JobsFilterModal';
import { useToast } from '../shared/ToastContext';
import { useToggleSaveJob } from '../../hooks';

interface MarketplaceJob {
  id: string;
  title: string;
  trade: string;
  categoryId?: number;
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
  const { showSuccess, showInfo } = useToast();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEARBY' | 'URGENT' | 'HIGH_BUDGET'>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobsMap, setSavedJobsMap] = useState<Record<string, boolean>>({});
  const [userLocation, setUserLocation] = useState<GeoCoordinate | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Advanced Filter Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterRadiusKm, setFilterRadiusKm] = useState<number>(50);
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'EMERGENCY' | 'HIGH' | 'MEDIUM'>('ALL');
  const [filterMinBudget, setFilterMinBudget] = useState<number>(0);

  // Fetch device GPS location
  const refreshLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await LocationProvider.getCurrentLocation();
      setUserLocation(loc);
    } catch {
      // Fallback handled inside provider
    } finally {
      setIsLocating(false);
    }
  };

  React.useEffect(() => {
    refreshLocation();
  }, []);

  const { data: categories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: () => JobService.listCategories(),
  });

  const { data: liveJobs, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['marketplace-jobs', userLocation?.latitude, userLocation?.longitude, selectedCategoryId],
    queryFn: () =>
      JobService.listJobs({
        categoryId: selectedCategoryId || undefined,
        lat: userLocation?.latitude,
        lng: userLocation?.longitude,
        radiusKm: 50,
        limit: 50,
      }),
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

    // Dynamic distance calculation using GPS coordinates
    let calculatedDistance = 2.5;
    if (userLocation && j.latitude && j.longitude) {
      calculatedDistance = LocationProvider.calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        Number(j.latitude),
        Number(j.longitude)
      );
    }

    const tradeName = (j as any).category?.name || j.trade || 'General Artisan';
    const locName = (j as any).address || j.location || ((j as any).lgaCity ? `${(j as any).lgaCity}, ${(j as any).state || 'Lagos'}` : 'Lagos, Nigeria');

    return {
      id: j.id,
      title: j.title,
      trade: tradeName,
      categoryId: j.categoryId,
      locationName: locName,
      distanceKm: calculatedDistance,
      budget: Number(j.budget || (j as any).budgetMax || (j as any).budgetMin || 0),
      budgetType: j.budgetType === 'HOURLY' ? 'NEGOTIABLE' : 'FIXED',
      urgency: j.urgency === 'EMERGENCY' ? 'EMERGENCY' : (j.urgency === 'HIGH' || (j.urgency as string) === 'URGENT') ? 'HIGH' : 'NORMAL',
      proposalsCount: (j as any).proposalsCount || (j as any)._count?.proposals || 0,
      postedTimeAgo: timeAgo,
    };
  });

  const toggleSaveMutation = useToggleSaveJob();

  const handleBookmark = (id: string) => {
    const isCurrentlySaved = !!savedJobsMap[id];
    const targetJob = (liveJobs || []).find((j) => j.id === id);
    if (!targetJob) return;

    setSavedJobsMap((prev) => ({ ...prev, [id]: !isCurrentlySaved }));
    if (isCurrentlySaved) {
      showInfo('Bookmark Removed', 'Job removed from your saved list');
    } else {
      showSuccess('Job Saved', 'Job added to your saved bookmarks');
    }

    toggleSaveMutation.mutate(
      { job: targetJob, isSaved: !isCurrentlySaved },
      {
        onError: () => {
          setSavedJobsMap((prev) => ({ ...prev, [id]: isCurrentlySaved }));
        },
      }
    );
    onToggleSave?.(id);
  };

  const hasAdvancedFilters =
    filterRadiusKm < 50 || filterUrgency !== 'ALL' || filterMinBudget > 0 || selectedCategoryId !== null;

  const filteredJobs = jobsList.filter((job) => {
    if (selectedCategoryId && job.categoryId !== selectedCategoryId) return false;
    if (job.distanceKm > filterRadiusKm) return false;
    if (filterUrgency === 'EMERGENCY' && job.urgency !== 'EMERGENCY') return false;
    if (filterUrgency === 'HIGH' && job.urgency !== 'HIGH' && job.urgency !== 'EMERGENCY') return false;
    if (filterUrgency === 'MEDIUM' && job.urgency !== 'NORMAL') return false;
    if (filterMinBudget > 0 && job.budget < filterMinBudget) return false;

    if (activeFilter === 'NEARBY' && job.distanceKm > 8) return false;
    if (activeFilter === 'URGENT' && job.urgency === 'NORMAL') return false;
    if (activeFilter === 'HIGH_BUDGET' && job.budget < 40000) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = job.title.toLowerCase().includes(q);
      const matchTrade = job.trade.toLowerCase().includes(q);
      const matchLoc = job.locationName.toLowerCase().includes(q);
      if (!matchTitle && !matchTrade && !matchLoc) return false;
    }
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
          <View>
            <Text style={styles.headerTitle}>Jobs Marketplace</Text>
            <TouchableOpacity
              onPress={refreshLocation}
              activeOpacity={0.7}
              style={styles.gpsLocationRow}
            >
              <Text style={styles.gpsIcon}>{isLocating ? '🔄' : '📍'}</Text>
              <Text style={styles.gpsLocationText}>
                {isLocating
                  ? 'Locating GPS...'
                  : userLocation?.addressName || 'Lagos, Nigeria'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{filteredJobs.length} Leads</Text>
        </View>
      </View>

      {/* Search Input & Filter Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs by trade, issue, or location..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFilterModalOpen(true);
          }}
          style={[styles.filterIconButton, hasAdvancedFilters && styles.filterIconButtonActive]}
          activeOpacity={0.8}
        >
          <SlidersHorizontal
            size={18}
            color={hasAdvancedFilters ? '#FFFFFF' : colors.neutral[700]}
          />
          {hasAdvancedFilters && <View style={styles.filterDotBadge} />}
        </TouchableOpacity>
      </View>

      {/* Advanced Filter Modal */}
      <JobsFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={Array.isArray(categories) ? categories : []}
        selectedCategoryId={selectedCategoryId}
        onSelectCategoryId={setSelectedCategoryId}
        selectedRadiusKm={filterRadiusKm}
        onSelectRadiusKm={setFilterRadiusKm}
        selectedUrgency={filterUrgency}
        onSelectUrgency={setFilterUrgency}
        selectedMinBudget={filterMinBudget}
        onSelectMinBudget={setFilterMinBudget}
        onApply={() => {
          setIsFilterModalOpen(false);
          showSuccess('Filters Applied', `Showing ${filteredJobs.length} matching job leads.`);
        }}
        onReset={() => {
          setSelectedCategoryId(null);
          setFilterRadiusKm(50);
          setFilterUrgency('ALL');
          setFilterMinBudget(0);
          setActiveFilter('ALL');
        }}
      />

      {/* Trade Category Horizontal Bar */}
      {Array.isArray(categories) && categories.length > 0 && (
        <View style={styles.categoryBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChips}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategoryId(null);
              }}
              style={[styles.categoryChip, selectedCategoryId === null && styles.categoryChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryChipText, selectedCategoryId === null && styles.categoryChipTextActive]}>
                All Trades
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategoryId(isSelected ? null : cat.id);
                  }}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

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
            onRefresh={() => { refetch(); }}
            tintColor={colors.brand.forest}
            colors={[colors.brand.forest]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ width: '100%', marginTop: 6 }}>
              <SkeletonJobCard />
              <SkeletonJobCard />
              <SkeletonJobCard />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                  <View
                    style={[
                      styles.urgencyTag,
                      item.urgency === 'EMERGENCY'
                        ? styles.urgencyEmergency
                        : item.urgency === 'HIGH' || (item.urgency as string) === 'URGENT'
                        ? styles.urgencyHigh
                        : styles.urgencyNormal,
                    ]}
                  >
                    {item.urgency === 'EMERGENCY' ? (
                      <Zap size={11} color="#DC2626" strokeWidth={2.2} />
                    ) : item.urgency === 'HIGH' || (item.urgency as string) === 'URGENT' ? (
                      <Clock size={11} color="#D97706" strokeWidth={2.2} />
                    ) : null}
                    <Text
                      style={[
                        styles.urgencyText,
                        item.urgency === 'EMERGENCY' && styles.urgencyTextEmergency,
                        (item.urgency === 'HIGH' || (item.urgency as string) === 'URGENT') && styles.urgencyTextHigh,
                      ]}
                    >
                      {item.urgency === 'EMERGENCY'
                        ? 'Emergency'
                        : item.urgency === 'HIGH' || (item.urgency as string) === 'URGENT'
                        ? 'Urgent'
                        : 'Open Lead'}
                    </Text>
                  </View>

                  {Boolean(item.trade) && (
                    <View style={styles.tradePill}>
                      <Text style={styles.tradePillText}>{item.trade}</Text>
                    </View>
                  )}

                  {Boolean((item as any).attachmentsCount > 0 || (item as any).attachments?.length > 0) && (
                    <View style={styles.photoCountBadge}>
                      <Camera size={11} color="#15803D" strokeWidth={2} />
                      <Text style={styles.photoCountText}>
                        {(item as any).attachmentsCount || (item as any).attachments?.length} Photo{((item as any).attachmentsCount || (item as any).attachments?.length) > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleBookmark(item.id)}
                  activeOpacity={0.7}
                  style={styles.bookmarkButton}
                >
                  <Bookmark
                    size={16}
                    color={isSaved ? colors.brand.forest : colors.neutral[400]}
                    fill={isSaved ? colors.brand.forest : 'none'}
                    strokeWidth={1.85}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>

              <View style={styles.metaRow}>
                <MapPin size={12} color={colors.neutral[500]} strokeWidth={1.85} />
                <Text style={styles.locationText} numberOfLines={1}>{item.locationName}</Text>
                {item.distanceKm != null && (
                  <>
                    <Text style={styles.distanceDot}>•</Text>
                    <Text style={styles.distanceText}>{formatDistance(item.distanceKm)}</Text>
                  </>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.budgetCol}>
                  <Text style={styles.budgetLabel}>Target Escrow</Text>
                  <View style={styles.budgetValueRow}>
                    <ShieldCheck size={14} color="#059669" strokeWidth={2} />
                    <Text style={styles.budgetValue}>{formatCurrency(item.budget)}</Text>
                  </View>
                </View>

                <View style={styles.actionsRight}>
                  <Text style={styles.proposalsCount}>
                    {item.proposalsCount} {item.proposalsCount === 1 ? 'Bid' : 'Bids'}
                  </Text>
                  <View style={styles.reviewBidPill}>
                    <Text style={styles.reviewBidText}>Review</Text>
                    <ChevronRight size={13} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
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
  gpsLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  gpsIcon: {
    fontSize: 11,
  },
  gpsLocationText: {
    fontSize: typography.size.xs,
    color: colors.brand.forest,
    fontWeight: '600',
  },
  categoryBar: {
    marginTop: 8,
    marginBottom: 2,
  },
  categoryChips: {
    paddingHorizontal: spacing.base,
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  categoryChipText: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterIconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterIconButtonActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  filterDotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
  photoCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  photoCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
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
  tradePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tradePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  reviewBidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 2,
  },
  reviewBidText: {
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
