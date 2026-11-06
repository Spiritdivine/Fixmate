import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  X,
  ShieldCheck,
  Star,
  MapPin,
  CheckCircle2,
  Briefcase,
  Award,
  Clock,
  ExternalLink,
  Edit3,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets } from '../../theme';
import { formatCurrency } from '../../lib/formatters';

export interface ArtisanProfilePreviewData {
  fullName: string;
  avatarUrl?: string | null;
  trade: string;
  rating: number;
  reviewCount: number;
  completedJobsCount: number;
  locationCity: string;
  bio?: string;
  hourlyRate?: number;
  yearsExperience?: number;
  isKycVerified?: boolean;
  skills?: string[];
  portfolio?: Array<{
    id: string;
    title: string;
    imageUrl?: string;
    description?: string;
  }>;
}

interface ArtisanPublicProfilePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onEditProfile?: () => void;
  artisan?: ArtisanProfilePreviewData;
  data?: ArtisanProfilePreviewData;
}

export const ArtisanPublicProfilePreviewModal: React.FC<ArtisanPublicProfilePreviewModalProps> = ({
  visible,
  onClose,
  onEditProfile,
  artisan: artisanProp,
  data: dataProp,
}) => {
  const artisan = artisanProp || dataProp || ({} as ArtisanProfilePreviewData);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.safeContainer}>
          {/* Top Bar Preview Banner */}
          <View style={styles.previewBanner}>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeIcon}>👁️</Text>
              <Text style={styles.bannerBadgeText}>Client Perspective Preview</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.closeIconButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={colors.neutral[300]} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarContainer}>
                  {artisan.avatarUrl ? (
                    <Image source={{ uri: artisan.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitials}>
                        {artisan.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {artisan.isKycVerified && (
                    <View style={styles.verifiedBadgeBubble}>
                      <ShieldCheck size={14} color={colors.status.success} />
                    </View>
                  )}
                </View>

                <View style={styles.headerInfo}>
                  <Text style={styles.artisanName}>{artisan.fullName}</Text>
                  <Text style={styles.artisanTrade}>{artisan.trade}</Text>
                  <View style={styles.locationRow}>
                    <MapPin size={13} color={colors.neutral[400]} />
                    <Text style={styles.locationText}>{artisan.locationCity || 'Lagos, Nigeria'}</Text>
                  </View>
                </View>
              </View>

              {/* Metric stats row */}
              <View style={styles.metricsContainer}>
                <View style={styles.metricBox}>
                  <View style={styles.metricValRow}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.metricValue}>{artisan.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.metricLabel}>{artisan.reviewCount} Reviews</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{artisan.completedJobsCount}</Text>
                  <Text style={styles.metricLabel}>Completed</Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>
                    {artisan.hourlyRate ? formatCurrency(artisan.hourlyRate) : '₦15,000'}
                  </Text>
                  <Text style={styles.metricLabel}>Starting rate</Text>
                </View>
              </View>
            </View>

            {/* Trust & Verification Badges */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Verification & Trust Badges</Text>
              <View style={styles.trustBadgesGrid}>
                <View style={styles.trustBadgeItem}>
                  <View style={[styles.trustIconCircle, { backgroundColor: '#10B98120' }]}>
                    <ShieldCheck size={18} color="#10B981" />
                  </View>
                  <View style={styles.trustTextCol}>
                    <Text style={styles.trustItemTitle}>Identity Verified</Text>
                    <Text style={styles.trustItemSubtitle}>NIN / Govt ID verified</Text>
                  </View>
                </View>

                <View style={styles.trustBadgeItem}>
                  <View style={[styles.trustIconCircle, { backgroundColor: '#3B82F620' }]}>
                    <Award size={18} color="#3B82F6" />
                  </View>
                  <View style={styles.trustTextCol}>
                    <Text style={styles.trustItemTitle}>Escrow Insured</Text>
                    <Text style={styles.trustItemSubtitle}>100% Guaranteed payment</Text>
                  </View>
                </View>

                <View style={styles.trustBadgeItem}>
                  <View style={[styles.trustIconCircle, { backgroundColor: '#8B5CF620' }]}>
                    <Briefcase size={18} color="#8B5CF6" />
                  </View>
                  <View style={styles.trustTextCol}>
                    <Text style={styles.trustItemTitle}>
                      {artisan.yearsExperience || 5}+ Years Experience
                    </Text>
                    <Text style={styles.trustItemSubtitle}>Vetted professional</Text>
                  </View>
                </View>

                <View style={styles.trustBadgeItem}>
                  <View style={[styles.trustIconCircle, { backgroundColor: '#F59E0B20' }]}>
                    <Clock size={18} color="#F59E0B" />
                  </View>
                  <View style={styles.trustTextCol}>
                    <Text style={styles.trustItemTitle}>98% On-Time</Text>
                    <Text style={styles.trustItemSubtitle}>Milestone delivery</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* About / Pitch */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Professional Bio</Text>
              <Text style={styles.bioText}>
                {artisan.bio ||
                  'Professional and reliable artisan committed to top-tier craftsmanship, transparent pricing, and punctual delivery. Fully equipped with modern diagnostic tools and safety equipment.'}
              </Text>

              {artisan.skills && artisan.skills.length > 0 && (
                <View style={styles.skillsWrapper}>
                  <Text style={styles.skillsHeader}>Specialties & Skills</Text>
                  <View style={styles.skillChipsRow}>
                    {artisan.skills.map((skill, idx) => (
                      <View key={idx} style={styles.skillChip}>
                        <Text style={styles.skillChipText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Portfolio Showcase */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Work Portfolio</Text>
                <Text style={styles.portfolioCount}>
                  {artisan.portfolio?.length || 3} Projects
                </Text>
              </View>

              {artisan.portfolio && artisan.portfolio.length > 0 ? (
                <View style={styles.portfolioGrid}>
                  {artisan.portfolio.map((item) => (
                    <View key={item.id} style={styles.portfolioCard}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.portfolioImg} />
                      ) : (
                        <View style={styles.portfolioImgFallback}>
                          <Briefcase size={24} color={colors.neutral[500]} />
                        </View>
                      )}
                      <View style={styles.portfolioInfo}>
                        <Text style={styles.portfolioTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.description ? (
                          <Text style={styles.portfolioDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyPortfolioBox}>
                  <Text style={styles.emptyPortfolioText}>
                    Standard showcase projects are active in client view.
                  </Text>
                </View>
              )}
            </View>

            {/* Homeowner Call-to-action preview mock */}
            <View style={styles.clientMockActionCard}>
              <Text style={styles.clientMockTitle}>How clients contact you</Text>
              <Text style={styles.clientMockDesc}>
                Homeowners can send you direct private invitations or hire you from proposal submissions.
              </Text>
              <View style={styles.mockButtonsRow}>
                <View style={styles.mockHireButton}>
                  <Text style={styles.mockHireText}>Invite to Job</Text>
                </View>
                <View style={styles.mockChatButton}>
                  <Text style={styles.mockChatText}>Message</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.bottomFooter}>
            {onEditProfile && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onClose();
                  onEditProfile();
                }}
                style={styles.editProfileButton}
                activeOpacity={0.8}
              >
                <Edit3 size={18} color="#10B981" />
                <Text style={styles.editProfileText}>Edit My Profile</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={styles.closeDoneButton}
              activeOpacity={0.8}
            >
              <Text style={styles.closeDoneText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  safeContainer: {
    flex: 1,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#0A2718',
    borderBottomWidth: 1,
    borderBottomColor: '#1A4D30',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B98125',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#10B98150',
  },
  bannerBadgeIcon: {
    fontSize: 13,
  },
  bannerBadgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: '#163E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1C4B35',
    ...shadows.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[900],
  },
  verifiedBadgeBubble: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0E291D',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1.5,
    borderColor: colors.status.success,
  },
  headerInfo: {
    flex: 1,
  },
  artisanName: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
    marginBottom: 2,
  },
  artisanTrade: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: '#10B981',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#1B4631',
  },
  metricBox: {
    alignItems: 'center',
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1B4631',
  },
  sectionCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1C4B35',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  portfolioCount: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: '#10B981',
  },
  trustBadgesGrid: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  trustBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#071A11',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#19422C',
  },
  trustIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextCol: {
    flex: 1,
  },
  trustItemTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[200],
  },
  trustItemSubtitle: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    marginTop: 1,
  },
  bioText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[300],
    lineHeight: 20,
  },
  skillsWrapper: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#1B4631',
  },
  skillsHeader: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[400],
    marginBottom: spacing.xs,
  },
  skillChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: '#163E26',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#235D3B',
  },
  skillChipText: {
    fontSize: 11,
    fontFamily: typography.fonts.medium,
    color: '#A7F3D0',
  },
  portfolioGrid: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  portfolioCard: {
    backgroundColor: '#071A11',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#19422C',
  },
  portfolioImg: {
    width: '100%',
    height: 140,
    backgroundColor: '#0E291D',
  },
  portfolioImgFallback: {
    width: '100%',
    height: 100,
    backgroundColor: '#0E291D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioInfo: {
    padding: spacing.sm,
  },
  portfolioTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[100],
  },
  portfolioDesc: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    marginTop: 2,
  },
  emptyPortfolioBox: {
    backgroundColor: '#071A11',
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  emptyPortfolioText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  clientMockActionCard: {
    backgroundColor: '#0A2517',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#1E5837',
  },
  clientMockTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  clientMockDesc: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[300],
    marginBottom: spacing.sm,
  },
  mockButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mockHireButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#10B981',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockHireText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[900],
  },
  mockChatButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#163E26',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#235D3B',
  },
  mockChatText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: '#A7F3D0',
  },
  bottomFooter: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#173B28',
  },
  editProfileButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#10B98115',
    borderWidth: 1,
    borderColor: '#10B98150',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editProfileText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  closeDoneButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDoneText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[900],
  },
});
