import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { CountdownTimer } from '../shared/CountdownTimer';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { JobService } from '../../services/job.service';

interface IncomingJobScreenProps {
  jobId?: string;
  onBack?: () => void;
  onAccept?: (jobId?: string) => void;
  onDecline?: (jobId?: string) => void;
}

export const IncomingJobScreen: React.FC<IncomingJobScreenProps> = ({
  jobId: initialJobId,
  onBack,
  onAccept,
  onDecline,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        if (initialJobId) {
          const data = await JobService.getById(initialJobId);
          if (isMounted) setJob(data);
        } else {
          const jobs = await JobService.listJobs({ limit: 5 });
          if (Array.isArray(jobs) && jobs.length > 0) {
            const emergencyOrOpen = jobs.find((j: any) => j.status === 'OPEN' || j.urgency === 'EMERGENCY' || j.urgency === 'HIGH') || jobs[0];
            if (isMounted) setJob(emergencyOrOpen);
          }
        }
      } catch (err) {
        console.warn('Failed to load incoming job lead:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialJobId]);

  const jobTitle = job?.title || 'Open Work Lead';
  const location = job?.location || 'Lagos, Nigeria';
  const trade = job?.trade || job?.category?.name || 'General Artisan';
  const description = job?.description ||
    'Client requested an immediate response for this project. Review details and submit your quote.';
  const budget = Number(job?.budget || job?.budgetMax || 0);

  const clientProfile = job?.client?.clientProfile;
  const clientName = clientProfile?.firstName
    ? `${clientProfile.firstName} ${clientProfile.lastName || ''}`.trim()
    : 'Verified Client';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Text style={styles.backChevron}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Incoming Radar Lead</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.forest} />
          <Text style={styles.loadingText}>Loading lead details...</Text>
        </View>
      ) : !job ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.radarIcon}>📡</Text>
          <Text style={styles.emptyTitle}>Radar Active: No Leads Right Now</Text>
          <Text style={styles.emptySub}>
            Your lead radar is actively scanning within your operating area. You will receive an immediate push alert and sound notification once a client requests emergency or standard repairs nearby.
          </Text>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.returnBtn} activeOpacity={0.85}>
              <Text style={styles.returnBtnText}>Return to Cockpit</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Priority & Countdown Row */}
            <View style={styles.priorityRow}>
              <View style={styles.highPriorityPill}>
                <Text style={styles.zapIcon}>⚡</Text>
                <Text style={styles.highPriorityText}>
                  {job?.urgency === 'EMERGENCY' ? 'Emergency Dispatch' : 'High Priority Lead'}
                </Text>
              </View>

              <CountdownTimer initialSeconds={180} label="to respond" />
            </View>

            {/* Job Title */}
            <Text style={styles.jobTitle}>{jobTitle}</Text>

            {/* Location & Trade Category */}
            <View style={styles.metaRow}>
              <Text style={styles.locationText}>📍 {location}</Text>
              <Text style={styles.distanceText}>• Nearby Lead</Text>
            </View>

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>⚡</Text>
              <Text style={styles.categoryText}>{trade}</Text>
            </View>

            {/* Client Profile Card */}
            <View style={styles.clientCard}>
              <Text style={styles.sectionHeader}>Client</Text>
              <View style={styles.clientProfileRow}>
                <Image
                  source={{
                    uri: (job?.client as any)?.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                  }}
                  style={styles.clientAvatar}
                />
                <View style={styles.clientInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.clientName}>{clientName}</Text>
                    <View style={styles.verifiedClientPill}>
                      <Text style={styles.verifiedCheck}>✓</Text>
                      <Text style={styles.verifiedClientText}>Verified Client</Text>
                    </View>
                  </View>
                  <Text style={styles.ratingText}>
                    ★ 4.9 <Text style={styles.reviewsCount}>(Verified Property Owner)</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Job Details Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionHeader}>Job Description & Scope</Text>
              <Text style={styles.detailsParagraph}>{description}</Text>
            </View>

            {/* Guaranteed Escrow Budget Card */}
            <View style={styles.escrowCard}>
              <View style={styles.escrowTopRow}>
                <View style={styles.lockBox}>
                  <Text style={styles.lockEmoji}>🔒</Text>
                </View>
                <View style={styles.escrowTextCol}>
                  <Text style={styles.escrowSub}>Target Escrow Budget</Text>
                  <Text style={styles.escrowAmount}>{formatCurrency(budget)}</Text>
                </View>
                <View style={styles.fundedPill}>
                  <Text style={styles.fundedCheck}>✓</Text>
                  <Text style={styles.fundedText}>Escrow Protected</Text>
                </View>
              </View>

              <View style={styles.escrowInfoRow}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  Funds are held in smart escrow and will only be released after you complete
                  the job and the client approves the milestone deliverable.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Actions: Decline / Accept */}
          <View style={styles.stickyFooter}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onDecline?.(job?.id || initialJobId)}
              style={styles.declineButton}
            >
              <Text style={styles.declineText}>✕ Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onAccept?.(job?.id || initialJobId)}
              style={styles.acceptButton}
            >
              <Text style={styles.acceptText}>✓ Submit Quote ›</Text>
            </TouchableOpacity>
          </View>
        </>
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: 110,
    gap: 14,
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
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highPriorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 5,
  },
  zapIcon: {
    fontSize: 12,
  },
  highPriorityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  jobTitle: {
    fontSize: typography.size.lg,
    fontWeight: '900',
    color: colors.neutral[900],
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[600],
  },
  distanceText: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[400],
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.emeraldDark,
  },
  clientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  sectionHeader: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  clientProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  clientInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientName: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  verifiedClientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 3,
  },
  verifiedCheck: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.brand.emeraldDark,
  },
  verifiedClientText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brand.emeraldDark,
  },
  ratingText: {
    fontSize: typography.size.xs,
    color: '#D97706',
    fontWeight: '700',
    marginTop: 2,
  },
  reviewsCount: {
    color: colors.neutral[400],
    fontWeight: 'normal',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  detailsParagraph: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  escrowCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  escrowTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  lockBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: {
    fontSize: 16,
  },
  escrowTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  escrowSub: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[600],
    textTransform: 'uppercase',
  },
  escrowAmount: {
    fontSize: typography.size.lg,
    fontWeight: '900',
    color: colors.brand.forest,
  },
  fundedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 3,
  },
  fundedCheck: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.brand.emeraldDark,
  },
  fundedText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brand.emeraldDark,
  },
  escrowInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#DCFCE7',
  },
  infoIcon: {
    fontSize: 12,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 10,
    color: colors.neutral[600],
    lineHeight: 14,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  declineText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  acceptButton: {
    flex: 1.5,
    backgroundColor: colors.brand.forest,
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginHorizontal: spacing.base,
  },
  radarIcon: {
    fontSize: 54,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  returnBtn: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.size.sm,
  },
});
