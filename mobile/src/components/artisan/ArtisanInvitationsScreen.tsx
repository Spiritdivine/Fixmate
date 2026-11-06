import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { JobService } from '../../services/job.service';
import { JobInvitationRecord } from '../../types/api-contracts';
import { useInvitationResponse } from '../../hooks';

interface ArtisanInvitationsScreenProps {
  onBack?: () => void;
  onSelectJob?: (jobId: string) => void;
}

export const ArtisanInvitationsScreen: React.FC<ArtisanInvitationsScreenProps> = ({
  onBack,
  onSelectJob,
}) => {
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['artisan-invitations'],
    queryFn: () => JobService.getMyInvitations(),
  });

  const handleRespond = (invitation: JobInvitationRecord, status: 'ACCEPTED' | 'DECLINED') => {
    const jobTitle = invitation.job?.title || 'this job';
    if (status === 'DECLINED') {
      Alert.alert(
        'Decline Invitation',
        `Are you sure you want to decline the invitation for "${jobTitle}"?`,
        [
          { text: 'Keep', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: () => executeRespond(invitation, status),
          },
        ]
      );
    } else {
      executeRespond(invitation, status);
    }
  };

  const respondMutation = useInvitationResponse();

  const executeRespond = (invitation: JobInvitationRecord, status: 'ACCEPTED' | 'DECLINED') => {
    respondMutation.mutate(
      { invitationId: invitation.id, status },
      {
        onError: (err: any) => {
          Alert.alert('Action Failed', err?.message || 'Could not update invitation.');
        },
      }
    );

    if (status === 'ACCEPTED') {
      Alert.alert(
        'Invitation Accepted! 🎉',
        'You have accepted this client invitation. Would you like to review the job specifications and submit your bid now?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Review & Bid',
            onPress: () => onSelectJob?.(invitation.jobId),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <Text style={styles.backChevron}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Job Invitations</Text>
            <Text style={styles.headerSub}>Direct job offers from clients</Text>
          </View>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{invitations.length} Offers</Text>
        </View>
      </View>

      <FlatList
        data={invitations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, invitations.length === 0 && styles.emptyListContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetch(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptySub}>Loading incoming invitations...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✉️</Text>
              <Text style={styles.emptyTitle}>No Invitations Yet</Text>
              <Text style={styles.emptySub}>
                When clients discover your verified profile or services and invite you directly to their jobs, they will appear here.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isPending = item.status === 'PENDING';
          const isAccepted = item.status === 'ACCEPTED';
          const isDeclined = item.status === 'DECLINED';
          const job = item.job;
          const budget = Number(job?.budgetMax || job?.budgetMin || 0);
          const trade = job?.category?.name || 'Handyman Specialist';
          const clientName =
            job?.client?.clientProfile?.firstName
              ? `${job.client.clientProfile.firstName} ${job.client.clientProfile.lastName || ''}`.trim()
              : job?.client?.clientProfile?.companyName || 'Verified Client';

          return (
            <View style={styles.invitationCard}>
              {/* Card Top: Client Info & Status */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.clientMetaWrap}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {clientName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.clientName}>{clientName}</Text>
                    <Text style={styles.invitationDate}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusTag,
                    isAccepted && styles.statusTagAccepted,
                    isDeclined && styles.statusTagDeclined,
                    isPending && styles.statusTagPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      isAccepted && styles.statusTagTextAccepted,
                      isDeclined && styles.statusTagTextDeclined,
                      isPending && styles.statusTagTextPending,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Job Title & Trade */}
              <TouchableOpacity
                onPress={() => onSelectJob?.(item.jobId)}
                activeOpacity={0.8}
                style={styles.jobInfoSection}
              >
                <Text style={styles.jobTitle}>{job?.title || 'Job Request'}</Text>
                <Text style={styles.tradeBadge}>⚡ {trade}</Text>

                {job?.description ? (
                  <Text style={styles.jobDesc} numberOfLines={3}>
                    {job.description}
                  </Text>
                ) : null}

                {/* Location & Escrow Budget Row */}
                <View style={styles.jobMetaRow}>
                  <Text style={styles.locationText}>
                    📍 {job?.lgaCity ? `${job.lgaCity}, ${job.state || 'Lagos'}` : 'Lagos, Nigeria'}
                  </Text>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>Budget: </Text>
                    <Text style={styles.budgetValue}>{formatCurrency(budget)}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                {isPending && (
                  <>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => handleRespond(item, 'DECLINED')}
                      disabled={respondingId === item.id}
                      activeOpacity={0.7}
                    >
                      {respondingId === item.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Text style={styles.declineBtnText}>✕ Decline</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleRespond(item, 'ACCEPTED')}
                      disabled={respondingId === item.id}
                      activeOpacity={0.85}
                    >
                      {respondingId === item.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.acceptBtnText}>✓ Accept & Bid</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {isAccepted && (
                  <TouchableOpacity
                    style={styles.viewJobBtn}
                    onPress={() => onSelectJob?.(item.jobId)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.viewJobBtnText}>View Specifications & Submit Bid ›</Text>
                  </TouchableOpacity>
                )}

                {isDeclined && (
                  <Text style={styles.declinedNoteText}>You declined this job invitation.</Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backChevron: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  badgePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  invitationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  clientMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.primary,
  },
  clientName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  invitationDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: '#F3F4F6',
  },
  statusTagPending: {
    backgroundColor: '#FEF3C7',
  },
  statusTagAccepted: {
    backgroundColor: '#DEF7EC',
  },
  statusTagDeclined: {
    backgroundColor: '#FEE2E2',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statusTagTextPending: {
    color: '#92400E',
  },
  statusTagTextAccepted: {
    color: '#03543F',
  },
  statusTagTextDeclined: {
    color: '#991B1B',
  },
  jobInfoSection: {
    paddingVertical: spacing.xs,
  },
  jobTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  tradeBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 6,
  },
  jobDesc: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  jobMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  budgetValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  acceptBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewJobBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewJobBtnText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  declinedNoteText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
