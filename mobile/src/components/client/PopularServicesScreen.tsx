import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
} from 'react-native';
import {
  Search,
  Zap,
  Droplets,
  Hammer,
  Snowflake,
  Paintbrush,
  Layers,
  Plug,
  Wrench,
  Truck,
  Heart,
  Star,
  Check,
} from 'lucide-react-native';
import { AppHeader } from '../shared/AppHeader';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { useQuery } from '@tanstack/react-query';
import { ProfileService } from '../../services/profile.service';
import { JobService } from '../../services/job.service';
import { formatCurrency } from '../../lib/formatters';
import { useToggleSaveArtisan } from '../../hooks';

interface PopularServicesScreenProps {
  onSelectService?: (serviceName: string) => void;
  onSelectArtisan?: (artisanId: string) => void;
  onBookArtisan?: (artisanId: string) => void;
}

export const PopularServicesScreen: React.FC<PopularServicesScreenProps> = ({
  onSelectService,
  onSelectArtisan,
  onBookArtisan,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const { data: dbCategories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: () => JobService.listCategories(),
  });

  const { data: featuredArtisans, isLoading } = useQuery({
    queryKey: ['featured-artisans'],
    queryFn: () => ProfileService.listArtisans({ minRating: 4.0, limit: 5 }),
  });

  const toggleSaveMutation = useToggleSaveArtisan();

  const handleToggleSave = (id: string) => {
    const isSaved = savedIds.includes(id);
    if (isSaved) {
      setSavedIds((prev) => prev.filter((x) => x !== id));
    } else {
      setSavedIds((prev) => [...prev, id]);
    }

    toggleSaveMutation.mutate(
      { artisanId: id, isSaved: !isSaved },
      {
        onError: () => {
          setSavedIds((prev) =>
            isSaved ? [...prev, id] : prev.filter((x) => x !== id)
          );
        },
      }
    );
  };

  const getCategoryMeta = (catName: string): { Icon: React.ComponentType<any>; bg: string; color: string } => {
    const lower = catName.toLowerCase();
    if (lower.includes('electr') || lower.includes('solar')) return { Icon: Zap, bg: '#FEF3C7', color: '#D97706' };
    if (lower.includes('plumb') || lower.includes('pipe')) return { Icon: Droplets, bg: '#E0F2FE', color: '#0284C7' };
    if (lower.includes('carpent') || lower.includes('wood')) return { Icon: Hammer, bg: '#FFF7ED', color: '#EA580C' };
    if (lower.includes('ac') || lower.includes('cool') || lower.includes('refrig')) return { Icon: Snowflake, bg: '#E0F2FE', color: '#0284C7' };
    if (lower.includes('paint') || lower.includes('pop')) return { Icon: Paintbrush, bg: '#FDF4FF', color: '#A855F7' };
    if (lower.includes('mason') || lower.includes('tile')) return { Icon: Layers, bg: '#FCE7F3', color: '#DB2777' };
    if (lower.includes('generator') || lower.includes('power')) return { Icon: Plug, bg: '#FEF9C3', color: '#CA8A04' };
    if (lower.includes('weld') || lower.includes('metal')) return { Icon: Wrench, bg: '#F1F5F9', color: '#475569' };
    if (lower.includes('auto') || lower.includes('mechanic')) return { Icon: Truck, bg: '#FEE2E2', color: '#DC2626' };
    return { Icon: Wrench, bg: '#F0FDF4', color: '#16A34A' };
  };

  const popularServices = Array.isArray(dbCategories) && dbCategories.length > 0
    ? dbCategories.map((c: any) => {
        const { Icon, bg, color } = getCategoryMeta(c.name);
        return {
          id: String(c.id),
          name: c.name,
          Icon,
          bg,
          color,
        };
      })
    : [
        { id: '1', name: 'Electrical & Solar', ...getCategoryMeta('Electrical & Solar') },
        { id: '2', name: 'Plumbing & Pipefitting', ...getCategoryMeta('Plumbing & Pipefitting') },
        { id: '3', name: 'Carpentry & Woodwork', ...getCategoryMeta('Carpentry & Woodwork') },
        { id: '4', name: 'AC & Refrigeration', ...getCategoryMeta('AC & Refrigeration') },
        { id: '5', name: 'Painting & Wall POP', ...getCategoryMeta('Painting & Wall POP') },
        { id: '6', name: 'Masonry & Tiling', ...getCategoryMeta('Masonry & Tiling') },
        { id: '7', name: 'Generator & Power', ...getCategoryMeta('Generator & Power') },
        { id: '8', name: 'Welding & Metalwork', ...getCategoryMeta('Welding & Metalwork') },
      ];

  const filteredServices = popularServices.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <AppHeader location="Lekki Phase 1, Lagos" unreadCount={0} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO BRAND BANNER */}
        <View style={styles.heroBanner}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
            }}
            style={styles.heroBackground}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Trusted Artisans.</Text>
            <Text style={styles.heroTitle}>Quality Work.</Text>
            <Text style={styles.heroTitle}>Secure Payments.</Text>
          </View>
        </View>

        {/* 2. SEARCH INPUT WITH FILTER ICON */}
        <View style={[styles.searchBarContainer, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
          <Search size={18} color={themeColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search for a service or artisan..."
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 3. POPULAR SERVICES GRID */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Popular Services</Text>
        </View>

        <View style={styles.servicesGrid}>
          {filteredServices.map((service) => {
            const ServiceIcon = service.Icon;
            return (
              <TouchableOpacity
                key={service.id}
                activeOpacity={0.8}
                onPress={() => onSelectService?.(service.name.replace('\n', ' '))}
                style={styles.serviceItem}
              >
                <View style={[styles.serviceIconCard, {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : service.bg,
                  borderColor: themeColors.border,
                }]}>
                  <ServiceIcon size={24} color={isDark ? '#34D399' : service.color} />
                </View>
                <Text style={[styles.serviceLabel, { color: themeColors.text }]}>{service.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. FEATURED ARTISANS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Top Verified Artisans</Text>
        </View>

        {Array.isArray(featuredArtisans) && featuredArtisans.length > 0 ? (
          featuredArtisans.map((artisan) => {
            const isSaved = savedIds.includes(artisan.id);
            const name = artisan.businessName || artisan.title || 'Master Artisan';
            const rate = artisan.startingPrice || artisan.hourlyRate || 10000;
            return (
              <View key={artisan.id} style={[styles.featuredCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Image
                  source={{
                    uri: artisan.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
                  }}
                  style={[styles.artisanPhoto, { backgroundColor: themeColors.surfaceSubtle }]}
                />

                <View style={styles.featuredInfo}>
                  <View style={styles.featuredHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameVerifiedRow}>
                        <Text style={[styles.artisanName, { color: themeColors.text }]}>{name}</Text>
                        <View style={styles.verifiedCheckPill}>
                          <Check size={9} strokeWidth={3} color="#FFFFFF" />
                        </View>
                      </View>
                      <Text style={[styles.artisanTrade, { color: themeColors.textMuted }]}>{artisan.trade || 'Professional Specialist'}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleToggleSave(artisan.id)}
                      activeOpacity={0.7}
                      style={styles.heartButton}
                    >
                      <Heart
                        size={18}
                        color={isSaved ? '#EF4444' : themeColors.textMuted}
                        fill={isSaved ? '#EF4444' : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.statsRow}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={[styles.ratingText, { marginLeft: 2 }]}>{artisan.rating || 5.0}</Text>
                    <Text style={[styles.reviewCount, { color: themeColors.textMuted }]}>({artisan.reviewCount || 0})</Text>
                    <Text style={[styles.distanceDot, { color: themeColors.textMuted }]}>•</Text>
                    <Text style={[styles.distanceText, { color: themeColors.textMuted }]}>Verified Profile</Text>
                  </View>

                  <Text style={[styles.priceText, { color: themeColors.text }]}>From {formatCurrency(rate)}</Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      onSelectArtisan?.(artisan.id);
                    }}
                    style={styles.bookButton}
                  >
                    <Text style={styles.bookButtonText}>View Profile & Hire</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={[styles.emptyFeaturedCard, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}>
            <Text style={[styles.emptyFeaturedText, { color: themeColors.textMuted }]}>No featured artisans currently listed.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 90,
  },

  /* Hero Banner */
  heroBanner: {
    height: 150,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.sm,
    position: 'relative',
    ...shadows.base,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 37, 24, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: typography.size.lg + 1,
    fontWeight: '900',
    lineHeight: 25,
    letterSpacing: -0.3,
  },

  /* Search Bar */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.neutral[900],
  },
  filterButton: {
    padding: 4,
  },
  filterIcon: {
    fontSize: 18,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  viewAllText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.brand.emeraldDark,
  },

  /* Services Grid */
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  serviceItem: {
    width: '23%',
    alignItems: 'center',
  },
  serviceIconCard: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  serviceEmoji: {
    fontSize: 26,
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'center',
    lineHeight: 14,
  },

  /* Featured Artisan Card */
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 12,
    ...shadows.sm,
  },
  artisanPhoto: {
    width: 105,
    height: 125,
    borderRadius: radius.sm,
    backgroundColor: '#F3F4F6',
  },
  featuredInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  featuredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  artisanName: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  verifiedCheckPill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheckText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  artisanTrade: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  heartButton: {
    padding: 2,
  },
  heartIcon: {
    fontSize: 18,
  },
  heartActive: {
    color: '#EF4444',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewCount: {
    fontSize: typography.size.xs,
    color: colors.neutral[400],
  },
  distanceDot: {
    fontSize: typography.size.xs,
    color: colors.neutral[400],
  },
  distanceText: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
  priceText: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: colors.neutral[900],
    marginTop: 4,
  },
  bookButton: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 9,
    borderRadius: radius.full,
    alignItems: 'center',
    marginTop: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
  },
  emptyFeaturedCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyFeaturedText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
