import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  Search,
  MapPin,
  Star,
  SlidersHorizontal,
  ShieldCheck,
  Heart,
  ChevronLeft,
  X,
  Zap,
  Check,
  Compass,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProfileService } from '../../services/profile.service';
import { LocationProvider, GeoCoordinate } from '../../lib/location-provider';
import { useToast } from '../shared/ToastContext';
import { SkeletonPlaceholder } from '../shared/SkeletonPlaceholder';
import { useToggleSaveArtisan } from '../../hooks';

interface ArtisanDirectoryScreenProps {
  onBack?: () => void;
  onSelectArtisan?: (artisanId: string) => void;
  onPostJob?: (initialData?: { trade?: string }) => void;
  initialTrade?: string;
}

type SortOption = 'NEAREST' | 'RATING' | 'COMPLETED_JOBS' | 'PRICE_LOW';

export const ArtisanDirectoryScreen: React.FC<ArtisanDirectoryScreenProps> = ({
  onBack,
  onSelectArtisan,
  onPostJob,
  initialTrade,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>(initialTrade || 'ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEAREST');
  const [minRating, setMinRating] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(25);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const [currentLocation] = useState<GeoCoordinate>(() =>
    LocationProvider.getCachedLocation()
  );

  const trades = [
    { id: 'ALL', label: 'All Trades' },
    { id: 'Electrical & Solar', label: 'Electrical & Solar' },
    { id: 'Plumbing & Pipefitting', label: 'Plumbing' },
    { id: 'AC & Refrigeration', label: 'AC & HVAC' },
    { id: 'Carpentry & Woodwork', label: 'Carpentry' },
    { id: 'Painting & Wall POP', label: 'Painting' },
    { id: 'Masonry & Tiling', label: 'Masonry & Tiling' },
    { id: 'Generator & Power', label: 'Generators' },
    { id: 'Welding & Fabrication', label: 'Welding' },
  ];

  // Fetch artisans
  const {
    data: rawArtisans = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['artisan-directory-all'],
    queryFn: async () => {
      const data = await ProfileService.listArtisans({ limit: 50 });
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 3,
  });

  // Fetch saved status
  useQuery({
    queryKey: ['saved-artisans'],
    queryFn: async () => {
      const saved = await ProfileService.getSavedArtisans();
      if (Array.isArray(saved)) {
        setSavedIds(saved.map((s: any) => s.id));
      }
      return saved;
    },
  });

  const toggleSaveMutation = useToggleSaveArtisan();

  const handleToggleSave = (artisanId: string, artisanName: string) => {
    const isSaved = savedIds.includes(artisanId);
    const targetArtisan = (rawArtisans || []).find((a: any) => (a.id === artisanId || a.artisanId === artisanId));

    // Instant optimistic toggle
    if (isSaved) {
      setSavedIds((prev) => prev.filter((id) => id !== artisanId));
      showSuccess(`Removed ${artisanName} from saved favorites`);
    } else {
      setSavedIds((prev) => [...prev, artisanId]);
      showSuccess(`Saved ${artisanName} to favorites`);
    }

    toggleSaveMutation.mutate(
      { artisanId, artisan: targetArtisan, isSaved: !isSaved },
      {
        onError: () => {
          setSavedIds((prev) =>
            isSaved ? [...prev, artisanId] : prev.filter((id) => id !== artisanId)
          );
          showError('Could not update saved status');
        },
      }
    );
  };

  // Filter & Sort Logic
  const filteredArtisans = useMemo(() => {
    return rawArtisans
      .filter((artisan: any) => {
        // Trade filter
        if (selectedTrade !== 'ALL') {
          const artisanTrade = (artisan.trade || '').toLowerCase();
          const target = selectedTrade.toLowerCase();
          if (!artisanTrade.includes(target) && !target.includes(artisanTrade)) {
            return false;
          }
        }

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const name = (artisan.businessName || artisan.title || '').toLowerCase();
          const tradeName = (artisan.trade || '').toLowerCase();
          const bio = (artisan.bio || '').toLowerCase();
          if (!name.includes(q) && !tradeName.includes(q) && !bio.includes(q)) {
            return false;
          }
        }

        // Rating filter
        const rating = Number(artisan.rating || 5.0);
        if (minRating > 0 && rating < minRating) {
          return false;
        }

        // Verified filter
        if (verifiedOnly && !artisan.isVerified) {
          return false;
        }

        // Distance filter
        if (artisan.latitude && artisan.longitude && currentLocation.latitude && currentLocation.longitude) {
          const dist = LocationProvider.calculateDistanceKm(
            currentLocation.latitude,
            currentLocation.longitude,
            artisan.latitude,
            artisan.longitude
          );
          if (dist > maxDistanceKm) {
            return false;
          }
        }

        return true;
      })
      .sort((a: any, b: any) => {
        if (sortBy === 'RATING') {
          return Number(b.rating || 0) - Number(a.rating || 0);
        }
        if (sortBy === 'COMPLETED_JOBS') {
          return Number(b.completedJobsCount || 0) - Number(a.completedJobsCount || 0);
        }
        if (sortBy === 'PRICE_LOW') {
          const priceA = Number(a.startingPrice || a.hourlyRate || 10000);
          const priceB = Number(b.startingPrice || b.hourlyRate || 10000);
          return priceA - priceB;
        }
        // Default NEAREST
        const distA = a.latitude && a.longitude
          ? LocationProvider.calculateDistanceKm(currentLocation.latitude, currentLocation.longitude, a.latitude, a.longitude)
          : 999;
        const distB = b.latitude && b.longitude
          ? LocationProvider.calculateDistanceKm(currentLocation.latitude, currentLocation.longitude, b.latitude, b.longitude)
          : 999;
        return distA - distB;
      });
  }, [rawArtisans, selectedTrade, searchQuery, minRating, verifiedOnly, maxDistanceKm, sortBy, currentLocation]);

  const activeFilterCount =
    (selectedTrade !== 'ALL' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (maxDistanceKm < 50 ? 1 : 0) +
    (sortBy !== 'NEAREST' ? 1 : 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={touchTargets.hitSlop}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={themeColors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Find Artisans</Text>
          <View style={styles.locationChip}>
            <MapPin size={11} color={isDark ? '#34D399' : colors.primary} />
            <Text style={[styles.locationText, { color: themeColors.textMuted }]} numberOfLines={1}>
              {currentLocation.addressName || 'Lekki Phase 1, Lagos'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: themeColors.surfaceSubtle }, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setShowFilterModal(true);
          }}
          activeOpacity={0.8}
        >
          <SlidersHorizontal
            size={18}
            color={activeFilterCount > 0 ? '#FFFFFF' : themeColors.text}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBarWrap}>
        <View style={[styles.searchBar, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, borderWidth: 1 }]}>
          <Search size={18} color={themeColors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search by name, skill, or equipment..."
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={touchTargets.hitSlop}>
              <X size={16} color={themeColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Trade Pills Horizontal Carousel */}
      <View style={styles.tradesWrap}>
        <FlatList
          horizontal
          data={trades}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tradesList}
          renderItem={({ item }) => {
            const isSelected = selectedTrade === item.id;
            return (
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelectedTrade(item.id);
                }}
                style={[
                  styles.tradePill,
                  { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                  isSelected && styles.tradePillSelected,
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.tradePillText, { color: themeColors.text }, isSelected && styles.tradePillTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Artisan Cards List */}
      {isLoading ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3].map((k) => (
            <View key={k} style={[styles.skeletonCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <SkeletonPlaceholder width={72} height={72} borderRadius={36} />
              <View style={{ flex: 1, marginLeft: 16, gap: 6 }}>
                <SkeletonPlaceholder width="75%" height={16} borderRadius={4} />
                <SkeletonPlaceholder width="50%" height={12} borderRadius={4} />
                <SkeletonPlaceholder width="40%" height={12} borderRadius={4} />
                <SkeletonPlaceholder width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredArtisans}
          keyExtractor={(item) => String(item.id || item.userId)}
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
          ListHeaderComponent={
            <View style={styles.resultsMetaRow}>
              <Text style={[styles.resultsCount, { color: themeColors.textMuted }]}>
                Showing <Text style={{ fontWeight: '700', color: themeColors.text }}>{filteredArtisans.length}</Text> verified artisans
              </Text>
              <Text style={[styles.activeSortLabel, isDark && { color: '#34D399' }]}>
                Sorted by: {sortBy === 'NEAREST' ? 'Nearest' : sortBy === 'RATING' ? 'Highest Rating' : sortBy === 'COMPLETED_JOBS' ? 'Most Jobs' : 'Lowest Price'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Compass size={36} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No Artisans Match Your Filters</Text>
              <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>
                Try expanding your search radius or selecting a different trade category.
              </Text>
              <View style={styles.emptyActions}>
                <TouchableOpacity
                  style={[styles.resetFilterBtn, { backgroundColor: themeColors.surfaceSubtle }]}
                  onPress={() => {
                    setSelectedTrade('ALL');
                    setSearchQuery('');
                    setMinRating(0);
                    setVerifiedOnly(false);
                    setMaxDistanceKm(50);
                    setSortBy('NEAREST');
                  }}
                >
                  <Text style={[styles.resetFilterBtnText, { color: themeColors.text }]}>Reset All Filters</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.postJobEmptyBtn}
                  onPress={() => onPostJob?.({ trade: selectedTrade !== 'ALL' ? selectedTrade : undefined })}
                >
                  <Text style={styles.postJobEmptyBtnText}>+ Post a Custom Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isSaved = savedIds.includes(item.id);
            const name = item.businessName || item.title || 'Verified Specialist';
            const rate = Number(item.startingPrice || item.hourlyRate || 10000);
            const distance = item.latitude && item.longitude && currentLocation.latitude && currentLocation.longitude
              ? `${LocationProvider.calculateDistanceKm(currentLocation.latitude, currentLocation.longitude, item.latitude, item.longitude).toFixed(1)} km away`
              : 'Within service zone';

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onSelectArtisan?.(item.id)}
                style={[styles.artisanCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
              >
                <View style={styles.cardTopRow}>
                  {/* Avatar with verified dot */}
                  <View style={styles.avatarWrap}>
                    <Image
                      source={{
                        uri:
                          item.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                      }}
                      style={[styles.avatarImg, { backgroundColor: themeColors.surfaceSubtle }]}
                    />
                    <View style={styles.onlineDot} />
                  </View>

                  {/* Meta details */}
                  <View style={styles.artisanDetails}>
                    <View style={styles.nameHeaderRow}>
                      <Text style={[styles.artisanName, { color: themeColors.text }]} numberOfLines={1}>
                        {name}
                      </Text>
                      {item.isVerified && (
                        <View style={styles.ninBadge}>
                          <ShieldCheck size={11} color="#15803D" strokeWidth={2.2} />
                          <Text style={styles.ninText}>NIN</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.artisanTrade, isDark && { color: '#34D399' }]}>{item.trade || 'Professional Artisan'}</Text>

                    <View style={styles.metaRow}>
                      <View style={styles.ratingBadge}>
                        <Star size={11} color="#F59E0B" fill="#F59E0B" />
                        <Text style={[styles.ratingVal, { color: themeColors.text }]}>
                          {Number(item.rating || 5.0).toFixed(1)}
                        </Text>
                        <Text style={[styles.reviewCount, { color: themeColors.textMuted }]}>({item.reviewCount || item.completedJobsCount || 12})</Text>
                      </View>

                      <Text style={[styles.dotSeparator, { color: themeColors.textMuted }]}>•</Text>

                      <View style={styles.distanceBadge}>
                        <MapPin size={11} color={themeColors.textMuted} />
                        <Text style={[styles.distanceText, { color: themeColors.textMuted }]}>{distance}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bookmark Button */}
                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={() => handleToggleSave(item.id, name)}
                    hitSlop={touchTargets.hitSlop}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={20}
                      color={isSaved ? '#EF4444' : isDark ? '#4B5563' : colors.neutral[300]}
                      fill={isSaved ? '#EF4444' : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Footer with Price and CTA */}
                <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
                  <View>
                    <Text style={[styles.rateLabel, { color: themeColors.textMuted }]}>Base Service Rate</Text>
                    <Text style={[styles.rateAmount, { color: themeColors.text }]}>From {formatCurrency(rate)}</Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.viewProfileBtn, { backgroundColor: themeColors.surfaceSubtle }]}
                      onPress={() => onSelectArtisan?.(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.viewProfileText, { color: themeColors.text }]}>View Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.hireNowBtn}
                      onPress={() => onSelectArtisan?.(item.id)}
                      activeOpacity={0.8}
                    >
                      <Zap size={14} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.hireNowText}>Hire Pro</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Filter Bottom Sheet Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: themeColors.border }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Filter & Sort Artisans</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                hitSlop={touchTargets.hitSlop}
              >
                <X size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {/* Sort Options */}
            <Text style={[styles.sectionHeaderTitle, { color: themeColors.text }]}>Sort By</Text>
            <View style={styles.sortRow}>
              {[
                { id: 'NEAREST', label: 'Nearest' },
                { id: 'RATING', label: 'Rating (High to Low)' },
                { id: 'COMPLETED_JOBS', label: 'Most Jobs' },
                { id: 'PRICE_LOW', label: 'Lowest Rate' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sortChip, { backgroundColor: themeColors.surfaceSubtle }, sortBy === s.id && styles.sortChipActive]}
                  onPress={() => setSortBy(s.id as SortOption)}
                >
                  <Text style={[styles.sortChipText, { color: themeColors.text }, sortBy === s.id && styles.sortChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rating Filter */}
            <Text style={[styles.sectionHeaderTitle, { color: themeColors.text, marginTop: 16 }]}>Minimum Rating</Text>
            <View style={styles.ratingFilterRow}>
              {[0, 4.0, 4.5, 4.8].map((stars) => (
                <TouchableOpacity
                  key={stars}
                  style={[styles.ratingChip, { backgroundColor: themeColors.surfaceSubtle }, minRating === stars && styles.ratingChipActive]}
                  onPress={() => setMinRating(stars)}
                >
                  <Text style={[styles.ratingChipText, { color: themeColors.text }, minRating === stars && styles.ratingChipTextActive]}>
                    {stars === 0 ? 'Any Rating' : `⭐ ${stars}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Verification Toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleTitle, { color: themeColors.text }]}>NIN Government Verified Only</Text>
                <Text style={[styles.toggleSub, { color: themeColors.textMuted }]}>Show only artisans with verified national identity</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkbox, { borderColor: themeColors.border }, verifiedOnly && styles.checkboxActive]}
                onPress={() => setVerifiedOnly(!verifiedOnly)}
              >
                {verifiedOnly && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </TouchableOpacity>
            </View>

            {/* Distance Slider */}
            <Text style={[styles.sectionHeaderTitle, { color: themeColors.text, marginTop: 16 }]}>
              Maximum Radius: {maxDistanceKm} km
            </Text>
            <View style={styles.radiusRow}>
              {[5, 10, 25, 50].map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusChip, { backgroundColor: themeColors.surfaceSubtle }, maxDistanceKm === km && styles.radiusChipActive]}
                  onPress={() => setMaxDistanceKm(km)}
                >
                  <Text style={[styles.radiusChipText, { color: themeColors.text }, maxDistanceKm === km && styles.radiusChipTextActive]}>
                    {km} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modal Bottom Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: themeColors.surfaceSubtle }]}
                onPress={() => {
                  setMinRating(0);
                  setVerifiedOnly(false);
                  setMaxDistanceKm(50);
                  setSortBy('NEAREST');
                }}
              >
                <Text style={[styles.clearBtnText, { color: themeColors.text }]}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
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
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: colors.brand.forest,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  searchBarWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  tradesWrap: {
    paddingVertical: spacing.sm,
  },
  tradesList: {
    paddingHorizontal: spacing.base,
    gap: 8,
  },
  tradePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tradePillSelected: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  tradePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  tradePillTextSelected: {
    color: '#FFFFFF',
  },
  resultsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  resultsCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  activeSortLabel: {
    fontSize: 11,
    color: colors.brand.forest,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
  },
  artisanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  artisanDetails: {
    flex: 1,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artisanName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  ninBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  ninText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  artisanTrade: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.brand.forest,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  reviewCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dotSeparator: {
    color: colors.textMuted,
    fontSize: 10,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bookmarkBtn: {
    padding: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rateLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rateAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  hireNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.brand.forest,
  },
  hireNowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skeletonList: {
    padding: spacing.base,
    gap: 12,
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  emptyActions: {
    marginTop: 20,
    gap: 10,
    width: '100%',
  },
  resetFilterBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  resetFilterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  postJobEmptyBtn: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  postJobEmptyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
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
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
  },
  sortChipActive: {
    backgroundColor: colors.brand.forest,
  },
  sortChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ratingFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  ratingChipActive: {
    backgroundColor: colors.brand.forest,
  },
  ratingChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  ratingChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  toggleSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  radiusChipActive: {
    backgroundColor: colors.brand.forest,
  },
  radiusChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.forest,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
