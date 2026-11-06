import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Camera, Scan, Bot, MapPin, Star, Plus, ShieldCheck, CheckCircle2, BadgeCheck, Wrench, ChevronRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { AppHeader } from '../shared/AppHeader';
import { SkeletonPlaceholder } from '../shared/SkeletonPlaceholder';
import { ArtisanTradeIcon, IconContainer } from '../icons';
import { colors, radius, spacing, typography, shadows, touchTargets } from '../../theme';
import { ProfileService } from '../../services/profile.service';
import { ContractService } from '../../services/contract.service';
import { NotificationService } from '../../services/notification.service';
import { LocationProvider, GeoCoordinate } from '../../lib/location-provider';
import { formatCurrency } from '../../lib/formatters';
import { JobService } from '../../services/job.service';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../theme';

interface ClientHomeScreenProps {
  onNavigateToMilestoneReview?: (contractId?: string, milestoneId?: string) => void;
  onNavigateToAiScan?: () => void;
  onNavigateToPostJob?: (initialData?: { title?: string; trade?: string; budget?: number }) => void;
  onSelectArtisan?: (artisanId: string) => void;
  onSelectService?: (serviceName: string) => void;
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
  onNavigateToPopularTrades?: () => void;
  onNavigateToArtisanDirectory?: () => void;
  onNavigateToQrScan?: () => void;
}

export const ClientHomeScreen: React.FC<ClientHomeScreenProps> = ({
  onNavigateToMilestoneReview,
  onNavigateToAiScan,
  onNavigateToPostJob,
  onSelectArtisan,
  onSelectService,
  onAvatarPress,
  onNotificationPress,
  onNavigateToPopularTrades,
  onNavigateToArtisanDirectory,
  onNavigateToQrScan,
}) => {
  const user = useAuthStore((s) => s.user);
  const { colors, isDark } = useTheme();

  const clientName = user?.clientProfile?.firstName
    ? `${user.clientProfile.firstName} ${user.clientProfile.lastName || ''}`.trim()
    : user?.email ? user.email.split('@')[0] : 'Client';
  const clientAvatar = user?.avatarUrl || user?.clientProfile?.avatarUrl;

  const [currentLocation, setCurrentLocation] = useState<GeoCoordinate>(() =>
    LocationProvider.getCachedLocation()
  );

  useEffect(() => {
    LocationProvider.getCurrentLocation()
      .then((loc) => {
        setCurrentLocation((prev) => {
          if (
            prev.latitude === loc.latitude &&
            prev.longitude === loc.longitude &&
            prev.addressName === loc.addressName
          ) {
            return prev;
          }
          return loc;
        });
      })
      .catch(() => {});
  }, []);

  // Live Query: Nearby Artisans (with stabilized coordinate keys)
  const roundedLat = LocationProvider.roundCoord(currentLocation.latitude);
  const roundedLng = LocationProvider.roundCoord(currentLocation.longitude);

  const { data: liveArtisans, isLoading: isLoadingArtisans } = useQuery({
    queryKey: ['artisans', 'nearby', roundedLat, roundedLng],
    queryFn: () =>
      ProfileService.getNearbyArtisans({
        lat: roundedLat,
        lng: roundedLng,
        radiusKm: 15,
      }),
    staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
  });

  // Live Query: Active Client Contracts
  const { data: myContracts } = useQuery({
    queryKey: ['contracts', 'client-active'],
    queryFn: () => ContractService.getMyContracts('CLIENT'),
  });

  // Live Query: Unread Notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => NotificationService.getNotifications(),
  });

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.isRead).length
    : typeof (notifications as any)?.meta?.unreadCount === 'number'
    ? (notifications as any).meta.unreadCount
    : 0;
  const activeContract = myContracts && myContracts.length > 0 ? myContracts[0] : null;

  // Live Query: Database Trade Categories
  const { data: dbCategories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: () => JobService.listCategories(),
  });

  const quickServices = Array.isArray(dbCategories) && dbCategories.length > 0
    ? dbCategories.slice(0, 8).map((cat: any, idx: number) => ({
        id: String(cat.id),
        name: cat.name,
        container: (idx % 2 === 0 ? 'cream' : 'sage') as 'cream' | 'sage',
      }))
    : [
        { id: '1', name: 'Electrical & Solar', container: 'sage' as const },
        { id: '2', name: 'Plumbing & Pipefitting', container: 'cream' as const },
        { id: '3', name: 'Carpentry & Woodwork', container: 'cream' as const },
        { id: '4', name: 'AC & Refrigeration', container: 'sage' as const },
        { id: '5', name: 'Painting & Wall POP', container: 'cream' as const },
        { id: '6', name: 'Masonry & Tiling', container: 'sage' as const },
        { id: '7', name: 'Generator & Power', container: 'cream' as const },
        { id: '8', name: 'Welding & Fabrication', container: 'sage' as const },
      ];

  const displayArtisans = Array.isArray(liveArtisans)
    ? liveArtisans.map((art) => ({
        id: art.id || art.userId,
        name: art.businessName || art.title || 'Verified Artisan',
        trade: art.trade || 'Specialist',
        distance: art.latitude && art.longitude && currentLocation.latitude && currentLocation.longitude
          ? `${LocationProvider.calculateDistanceKm(currentLocation.latitude, currentLocation.longitude, art.latitude, art.longitude).toFixed(1)} km away`
          : '1.5 km away',
        rating: art.rating || 5.0,
        reviewsCount: art.reviewCount || 0,
        startingPrice: `From ${formatCurrency(art.startingPrice || art.hourlyRate || 10000)}`,
        avatarUrl: art.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      }))
    : [];

  const currentArtisanProfile = activeContract?.artisan?.artisanProfile;
  const activeMilestone = activeContract?.milestones?.find((m: any) => m.status === 'SUBMITTED' || m.status === 'IN_PROGRESS');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <AppHeader
        location={currentLocation.addressName || user?.clientProfile?.address || 'Lekki Phase 1, Lagos'}
        unreadCount={unreadCount}
        userAvatarUrl={clientAvatar}
        userName={clientName}
        theme={isDark ? 'dark' : 'light'}
        onAvatarPress={onAvatarPress}
        onNotificationPress={onNotificationPress}
        onScanPress={onNavigateToQrScan}
      />


      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. ACTIVE REPAIR HERO CARD OR WELCOME PROMPT */}
        {activeContract ? (
          <View
            style={[
              styles.activeJobCard,
              isDark && {
                backgroundColor: '#0F261A',
                borderWidth: 1,
                borderColor: 'rgba(52, 211, 153, 0.25)',
              },
            ]}
          >
            {/* Status pill & title */}
            <View style={styles.activeBadgeRow}>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activePillText}>
                  {activeMilestone?.status === 'SUBMITTED' ? 'Work Submitted • Review' : 'Active Repair'}
                </Text>
              </View>
            </View>

            <Text style={styles.jobTitle}>{activeContract.title}</Text>
            <Text style={styles.jobSubtitle}>
              Your contracted artisan is actively working on this repair.
            </Text>

            {/* Work Submitted Alert Banner (Flattened surface, concentric R=6) */}
            {activeMilestone?.status === 'SUBMITTED' && (
              <View style={styles.workSubmittedAlert}>
                <CheckCircle2 size={16} color={colors.brand.emerald} strokeWidth={2.2} />
                <View>
                  <Text style={styles.alertPrimary}>Work Proof Submitted</Text>
                  <Text style={styles.alertSecondary}>Awaiting Your Inspection & Release</Text>
                </View>
              </View>
            )}

            {/* Artisan Profile Mini-row (Concentric R=6) */}
            <View style={styles.artisanRow}>
              <Image
                source={{ uri: currentArtisanProfile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' }}
                style={styles.artisanAvatar}
              />
              <View style={styles.artisanInfo}>
                <View style={styles.artisanNameRow}>
                  <Text style={styles.artisanName}>
                    {currentArtisanProfile?.businessName || currentArtisanProfile?.title || 'Contracted Specialist'}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <BadgeCheck size={12} color="#D1FAE5" />
                    <Text style={styles.verifiedText}>Verified Artisan</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
                  <Star size={10} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.artisanStats}>
                    {currentArtisanProfile?.rating ? currentArtisanProfile.rating : '5.0'} ({currentArtisanProfile?.completedJobsCount || 0} jobs)
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
            </View>

            {/* Release Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onNavigateToMilestoneReview?.(activeContract.id, activeMilestone?.id);
              }}
              style={[styles.reviewButton, isDark && { backgroundColor: colors.primary }]}
            >
              <Text style={styles.reviewButtonText}>
                Review Proof & Release {formatCurrency(activeMilestone?.amount || activeContract.totalAmount)}
              </Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.noActiveJobCard,
              isDark && {
                backgroundColor: '#0F261A',
                borderWidth: 1,
                borderColor: 'rgba(52, 211, 153, 0.25)',
              },
            ]}
          >
            <Text style={styles.noActiveTitle}>Need a Home Repair or Fix?</Text>
            <Text style={styles.noActiveSub}>
              Snap a photo with Oga John AI for instant diagnosis or post a job to receive quotes from certified artisans.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onNavigateToPostJob?.();
              }}
              style={[styles.noActiveBtn, isDark && { backgroundColor: colors.primary }]}
            >
              <Text style={styles.noActiveBtnText}>+ Post a Repair Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. OGA JOHN AI SCAN BANNER */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onNavigateToAiScan?.();
          }}
          style={[
            styles.aiBanner,
            isDark && {
              backgroundColor: '#0D2B1D',
              borderWidth: 1,
              borderColor: 'rgba(52, 211, 153, 0.2)',
            },
          ]}
        >
          <View style={styles.aiContentLeft}>
            <View style={styles.aiHeaderRow}>
              <View style={[styles.cameraIconBox, isDark && { backgroundColor: colors.primary }]}>
                <Camera size={13} color="#FFFFFF" strokeWidth={1.85} />
              </View>
              <Text style={styles.aiTitle}>Oga John AI</Text>
            </View>

            <Text style={styles.aiSubtitle}>
              Something broken? Snap a photo to get an instant diagnosis & cost estimate.
            </Text>

            <View style={[styles.scanButton, isDark && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
              <Scan size={13} color={isDark ? '#34D399' : colors.brand.forest} strokeWidth={1.85} />
              <Text style={[styles.scanText, isDark && { color: '#34D399' }]}>Scan Damage Now</Text>
            </View>
          </View>

          <View style={styles.aiMascotContainer}>
            <Bot size={32} color="#FFFFFF" strokeWidth={1.85} />
          </View>
        </TouchableOpacity>

        {/* 3. QUICK SERVICES - ARCHITECTURAL TRADE SILHOUETTES */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skilled Artisan Trades</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={touchTargets.hitSlop}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onNavigateToPopularTrades?.();
            }}
          >
            <Text style={[styles.viewAllText, { color: isDark ? '#34D399' : colors.brand.emeraldDark }]}>View all trades ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickServicesGrid}>
          {quickServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              activeOpacity={0.75}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onSelectService?.(service.name);
              }}
              style={styles.serviceItem}
            >
              <IconContainer
                variant={isDark ? 'forest' : service.container}
                size="md"
                style={[
                  styles.serviceIconContainer,
                  isDark && { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
                <ArtisanTradeIcon
                  trade={service.name}
                  size={22}
                  color={isDark ? '#34D399' : colors.icons.primary}
                  strokeWidth={1.85}
                />
              </IconContainer>
              <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. NEARBY VERIFIED ARTISANS (Doherty Threshold Skeleton State) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby Verified Artisans</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={touchTargets.hitSlop}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              if (onNavigateToArtisanDirectory) {
                onNavigateToArtisanDirectory();
              } else {
                onNavigateToPopularTrades?.();
              }
            }}
          >
            <Text style={[styles.viewAllText, { color: isDark ? '#34D399' : colors.brand.emeraldDark }]}>View all ›</Text>
          </TouchableOpacity>
        </View>

        {isLoadingArtisans ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.artisansCarousel}
          >
            {[1, 2, 3].map((key) => (
              <View key={key} style={[styles.artisanCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <SkeletonPlaceholder width="100%" height={120} borderRadius={radius.lg} />
                <View style={[styles.cardBody, { gap: 6, paddingHorizontal: 4 }]}>
                  <SkeletonPlaceholder width="75%" height={16} borderRadius={4} />
                  <SkeletonPlaceholder width="50%" height={12} borderRadius={4} />
                  <SkeletonPlaceholder width="40%" height={12} borderRadius={4} />
                  <SkeletonPlaceholder width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
                  <SkeletonPlaceholder width="100%" height={36} borderRadius={radius.full} style={{ marginTop: 8 }} />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : displayArtisans.length === 0 ? (
          <View style={[styles.emptyArtisansCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Wrench size={36} color={colors.textMuted} strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyArtisansTitle, { color: colors.text }]}>No Artisans On Duty Nearby</Text>
            <Text style={[styles.emptyArtisansSub, { color: colors.textMuted }]}>
              Post a custom repair request and verified tradespeople across Lagos will be notified to submit quotes.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.artisansCarousel}
          >
            {displayArtisans.map((artisan) => (
              <View key={artisan.id} style={[styles.artisanCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Image source={{ uri: artisan.avatarUrl }} style={[styles.cardAvatar, { backgroundColor: colors.surfaceSubtle }]} />
                <View style={styles.cardBody}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{artisan.name}</Text>
                  <Text style={[styles.cardTrade, { color: colors.textMuted }]}>{artisan.trade}</Text>
                  <View style={styles.metaIconRow}>
                    <MapPin size={11} color={isDark ? '#34D399' : colors.icons.primary} strokeWidth={1.85} />
                    <Text style={[styles.cardDistance, { color: colors.textMuted }]}>{artisan.distance}</Text>
                  </View>
                  <View style={styles.metaIconRow}>
                    <Star size={11} color="#F59E0B" fill="#F59E0B" strokeWidth={1.85} />
                    <Text style={styles.cardRating}>
                      {artisan.rating} <Text style={styles.ratingCount}>({artisan.reviewsCount})</Text>
                    </Text>
                  </View>
                  <Text style={[styles.cardPrice, { color: colors.text }]}>{artisan.startingPrice}</Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    hitSlop={touchTargets.hitSlop}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      onSelectArtisan?.(artisan.id);
                    }}
                    style={[styles.bookNowButton, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  >
                    <Text style={[styles.bookNowText, { color: isDark ? '#34D399' : colors.text }]}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* STICKY BOTTOM ACTION: POST A CUSTOM JOB (Fitts's Law Thumb Zone) */}
      <View style={[styles.stickyFooter, { backgroundColor: isDark ? 'rgba(17, 28, 21, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderTopColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onNavigateToPostJob?.();
          }}
          style={[styles.postJobButton, { backgroundColor: colors.primary }]}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.postJobText}>Post a Custom Job</Text>
        </TouchableOpacity>
      </View>
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

  /* 1. Active Repair Card */
  activeJobCard: {
    backgroundColor: colors.brand.forest,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.sm,
    ...shadows.base,
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.emerald,
  },
  activePillText: {
    color: '#D1FAE5',
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  jobTitle: {
    color: '#FFFFFF',
    fontSize: typography.size.lg,
    fontWeight: '800',
    marginTop: 4,
  },
  jobSubtitle: {
    color: '#A7F3D0',
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  workSubmittedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
    gap: 8,
  },
  checkGreen: {
    color: colors.brand.emerald,
    fontSize: 16,
    fontWeight: '900',
  },
  alertPrimary: {
    color: '#FFFFFF',
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
  },
  alertSecondary: {
    color: '#D1FAE5',
    fontSize: typography.size.xs,
  },
  artisanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
    gap: 10,
  },
  artisanAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  artisanInfo: {
    flex: 1,
  },
  artisanNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artisanName: {
    color: '#FFFFFF',
    fontSize: typography.size.sm + 1,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 3,
  },
  verifiedCheck: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '900',
  },
  verifiedText: {
    color: '#D1FAE5',
    fontSize: 9,
    fontWeight: '700',
  },
  artisanStats: {
    color: '#D1FAE5',
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  chevronWhite: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '300',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brand.emeraldDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    marginTop: 12,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  reviewArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  /* 2. Oga John AI Banner */
  aiBanner: {
    flexDirection: 'row',
    backgroundColor: '#0F3826',
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.base,
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.base,
  },
  aiContentLeft: {
    flex: 1,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cameraIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.brand.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraEmoji: {
    fontSize: 12,
  },
  aiTitle: {
    color: '#FFFFFF',
    fontSize: typography.size.base,
    fontWeight: '800',
  },
  betaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  betaText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  aiSubtitle: {
    color: '#A7F3D0',
    fontSize: typography.size.xs + 1,
    marginTop: 6,
    lineHeight: 18,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  scanIcon: {
    fontSize: 12,
  },
  scanText: {
    color: colors.brand.forest,
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
  },
  aiMascotContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  botEmoji: {
    fontSize: 36,
  },

  /* 3. Quick Services */
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
  quickServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  serviceItem: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  serviceIconContainer: {
    marginBottom: 6,
  },
  metaIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  serviceIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceEmoji: {
    fontSize: 26,
  },
  serviceName: {
    fontSize: typography.size.xs + 1,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'center',
  },

  /* 4. Nearby Artisans */
  artisansCarousel: {
    gap: 12,
    paddingRight: 10,
  },
  artisanCard: {
    width: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  cardAvatar: {
    width: '100%',
    height: 90,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
  },
  cardBody: {
    marginTop: 8,
  },
  cardName: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  cardTrade: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
  },
  cardDistance: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
  },
  cardRating: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2,
  },
  ratingCount: {
    fontWeight: '400',
    color: colors.neutral[400],
  },
  cardPrice: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.neutral[800],
    marginTop: 4,
  },
  bookNowButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: radius.full,
    paddingVertical: 5,
    alignItems: 'center',
    marginTop: 8,
  },
  bookNowText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[800],
  },

  /* Sticky Footer */
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  postJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.forest,
    paddingVertical: 14,
    borderRadius: radius.full,
    gap: 8,
    ...shadows.base,
  },
  postJobPlus: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  postJobText: {
    color: '#FFFFFF',
    fontSize: typography.size.base,
    fontWeight: '700',
  },
  noActiveJobCard: {
    backgroundColor: '#0F2C1D',
    borderRadius: radius.xl,
    padding: spacing.base,
    marginTop: spacing.sm,
    ...shadows.base,
  },
  noActiveBadgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  noActivePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  noActivePillText: {
    color: '#D1FAE5',
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  noActiveTitle: {
    color: '#FFFFFF',
    fontSize: typography.size.lg,
    fontWeight: '800',
    marginTop: 4,
  },
  noActiveSub: {
    color: '#A7F3D0',
    fontSize: typography.size.xs + 1,
    marginTop: 4,
    lineHeight: 18,
  },
  noActiveBtn: {
    backgroundColor: colors.brand.emerald,
    borderRadius: radius.full,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  noActiveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: typography.size.xs + 1,
  },
  emptyArtisansCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  emptyArtisansIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyArtisansTitle: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  emptyArtisansSub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
});
