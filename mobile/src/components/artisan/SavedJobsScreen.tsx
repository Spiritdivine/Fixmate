import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency, formatDistance } from '../../lib/formatters';
import { JobService } from '../../services/job.service';
import { JobRecord } from '../../types/api-contracts';
import { useToggleSaveJob } from '../../hooks';

interface SavedJobsScreenProps {
  onBack?: () => void;
  onBidNow?: (jobId: string) => void;
}

export const SavedJobsScreen: React.FC<SavedJobsScreenProps> = ({
  onBack,
  onBidNow,
}) => {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedJobs = useCallback(async () => {
    try {
      const data = await JobService.getSavedJobs();
      setJobs(data || []);
    } catch (err) {
      console.warn('[SavedJobsScreen] Failed to fetch saved jobs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSavedJobs();
  };

  const toggleSaveMutation = useToggleSaveJob();

  const handleRemove = (id: string) => {
    const targetJob = jobs.find((j) => j.id === id);
    if (!targetJob) return;

    // Instant optimistic removal from list
    const previous = [...jobs];
    setJobs((prev) => prev.filter((j) => j.id !== id));

    toggleSaveMutation.mutate(
      { job: targetJob, isSaved: false },
      {
        onError: () => {
          setJobs(previous);
          Alert.alert('Error', 'Failed to remove job from saved leads.');
        },
      }
    );
  };

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
          <Text style={styles.headerTitle}>Saved Jobs</Text>
        </View>
        <Text style={styles.countText}>{jobs.length} Bookmarks</Text>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={colors.brand.forest} />
          <Text style={styles.loadingText}>Loading saved job leads...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.brand.forest]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📑</Text>
              <Text style={styles.emptyTitle}>No saved jobs yet</Text>
              <Text style={styles.emptySub}>
                Tap the bookmark icon on any job in the lead radar to save it for quick review and quoting.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.tradeBadge}>
                  <Text style={styles.tradeText}>{item.trade}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.title}>{item.title}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaLocation}>📍 {item.location || 'Client Location'}</Text>
                {item.urgency === 'EMERGENCY' && (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.emergencyTag}>⚡ Emergency</Text>
                  </>
                )}
              </View>

              <View style={styles.footerRow}>
                <View>
                  <Text style={styles.budgetLabel}>Budget ({item.budgetType})</Text>
                  <Text style={styles.budgetValue}>{formatCurrency(item.budget)}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => onBidNow?.(item.id)}
                  style={styles.bidBtn}
                >
                  <Text style={styles.bidText}>Bid Now ›</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  countText: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
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
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tradeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  removeBtn: {
    padding: 4,
  },
  removeText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  title: {
    fontSize: typography.size.base,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metaLocation: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[600],
  },
  metaDot: {
    color: colors.neutral[400],
  },
  metaDistance: {
    fontSize: typography.size.xs + 1,
    fontWeight: '600',
    color: colors.brand.emeraldDark,
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
  bidBtn: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  bidText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: typography.size.base,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  emptySub: {
    fontSize: typography.size.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: typography.size.sm,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  emergencyTag: {
    fontSize: typography.size.xs,
    fontWeight: '800',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
});
