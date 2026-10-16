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
import { AppHeader } from '../shared/AppHeader';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { useQuery } from '@tanstack/react-query';
import { ProfileService } from '../../services/profile.service';
import { JobService } from '../../services/job.service';
import { formatCurrency } from '../../lib/formatters';

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

  const handleToggleSave = async (id: string) => {
    const isSaved = savedIds.includes(id);
    if (isSaved) {
      setSavedIds((prev) => prev.filter((x) => x !== id));
      try {
        await ProfileService.unsaveArtisan(id);
      } catch {
        setSavedIds((prev) => [...prev, id]);
      }
    } else {
      setSavedIds((prev) => [...prev, id]);
      try {
        await ProfileService.saveArtisan(id);
      } catch {
        setSavedIds((prev) => prev.filter((x) => x !== id));
      }
    }
  };

  const getCategoryEmoji = (catName: string): { icon: string; bg: string } => {
    const lower = catName.toLowerCase();
    if (lower.includes('electr') || lower.includes('solar')) return { icon: '⚡', bg: '#FEF3C7' };
    if (lower.includes('plumb') || lower.includes('pipe')) return { icon: '🚰', bg: '#E0F2FE' };
    if (lower.includes('carpent') || lower.includes('wood')) return { icon: '🪚', bg: '#FFF7ED' };
    if (lower.includes('ac') || lower.includes('cool') || lower.includes('refrig')) return { icon: '❄️', bg: '#E0F2FE' };
    if (lower.includes('paint') || lower.includes('pop')) return { icon: '🎨', bg: '#FDF4FF' };
    if (lower.includes('mason') || lower.includes('tile')) return { icon: '🧱', bg: '#FCE7F3' };
    if (lower.includes('generator') || lower.includes('power')) return { icon: '🔌', bg: '#FEF9C3' };
    if (lower.includes('weld') || lower.includes('metal')) return { icon: '👨‍🏭', bg: '#F1F5F9' };
    if (lower.includes('auto') || lower.includes('mechanic')) return { icon: '🚗', bg: '#FEE2E2' };
    return { icon: '🔧', bg: '#F0FDF4' };
  };

  const popularServices = Array.isArray(dbCategories) && dbCategories.length > 0
    ? dbCategories.map((c: any) => {
        const { icon, bg } = getCategoryEmoji(c.name);
        return {
          id: String(c.id),
          name: c.name,
          icon,
          bg,
        };
      })
    : [
        { id: '1', name: 'Electrical & Solar', icon: '⚡', bg: '#FEF3C7' },
        { id: '2', name: 'Plumbing & Pipefitting', icon: '🚰', bg: '#E0F2FE' },
        { id: '3', name: 'Carpentry & Woodwork', icon: '🪚', bg: '#FFF7ED' },
        { id: '4', name: 'AC & Refrigeration', icon: '❄️', bg: '#E0F2FE' },
        { id: '5', name: 'Painting & Wall POP', icon: '🎨', bg: '#FDF4FF' },
        { id: '6', name: 'Masonry & Tiling', icon: '🧱', bg: '#FCE7F3' },
        { id: '7', name: 'Generator & Power', icon: '🔌', bg: '#FEF9C3' },
        { id: '8', name: 'Welding & Metalwork', icon: '👨‍🏭', bg: '#F1F5F9' },
      ];

  const filteredServices = popularServices.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <View style={styles.searchBarContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a service or artisan..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 3. POPULAR SERVICES GRID */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
        </View>

        <View style={styles.servicesGrid}>
          {filteredServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              activeOpacity={0.8}
              onPress={() => onSelectService?.(service.name.replace('\n', ' '))}
              style={styles.serviceItem}
            >
              <View style={[styles.serviceIconCard, { backgroundColor: service.bg }]}>
                <Text style={styles.serviceEmoji}>{service.icon}</Text>
              </View>
              <Text style={styles.serviceLabel}>{service.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. FEATURED ARTISANS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Verified Artisans</Text>
        </View>

        {Array.isArray(featuredArtisans) && featuredArtisans.length > 0 ? (
          featuredArtisans.map((artisan) => {
            const isSaved = savedIds.includes(artisan.id);
            const name = artisan.businessName || artisan.title || 'Master Artisan';
            const rate = artisan.startingPrice || artisan.hourlyRate || 10000;
            return (
              <View key={artisan.id} style={styles.featuredCard}>
                <Image
                  source={{
                    uri: artisan.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
                  }}
                  style={styles.artisanPhoto}
                />

                <View style={styles.featuredInfo}>
                  <View style={styles.featuredHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameVerifiedRow}>
                        <Text style={styles.artisanName}>{name}</Text>
                        <View style={styles.verifiedCheckPill}>
                          <Text style={styles.verifiedCheckText}>✓</Text>
                        </View>
                      </View>
                      <Text style={styles.artisanTrade}>{artisan.trade || 'Professional Specialist'}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleToggleSave(artisan.id)}
                      activeOpacity={0.7}
                      style={styles.heartButton}
                    >
                      <Text style={[styles.heartIcon, isSaved && styles.heartActive]}>
                        {isSaved ? '❤️' : '🤍'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.statsRow}>
                    <Text style={styles.ratingText}>★ {artisan.rating || 5.0}</Text>
                    <Text style={styles.reviewCount}>({artisan.reviewCount || 0})</Text>
                    <Text style={styles.distanceDot}>•</Text>
                    <Text style={styles.distanceText}>Verified Profile</Text>
                  </View>

                  <Text style={styles.priceText}>From {formatCurrency(rate)}</Text>

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
          <View style={styles.emptyFeaturedCard}>
            <Text style={styles.emptyFeaturedText}>No featured artisans currently listed.</Text>
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
    borderRadius: radius.lg,
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
