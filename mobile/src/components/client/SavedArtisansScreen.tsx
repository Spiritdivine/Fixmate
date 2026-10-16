import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProfileService } from '../../services/profile.service';
import { ArtisanProfileData } from '../../types/api-contracts';

interface SavedArtisansScreenProps {
  onBack?: () => void;
  onSelectArtisan?: (id: string) => void;
  onChat?: (id: string) => void;
  onRehire?: (id: string) => void;
  onExplore?: () => void;
}

export const SavedArtisansScreen: React.FC<SavedArtisansScreenProps> = ({
  onBack,
  onSelectArtisan,
  onChat,
  onRehire,
  onExplore,
}) => {
  const [search, setSearch] = useState('');
  const [artisans, setArtisans] = useState<ArtisanProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedArtisans = useCallback(async () => {
    try {
      const data = await ProfileService.getSavedArtisans();
      setArtisans(data || []);
    } catch (err) {
      console.warn('[SavedArtisansScreen] Failed to fetch saved artisans:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedArtisans();
  }, [fetchSavedArtisans]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSavedArtisans();
  };

  const handleRemove = async (id: string) => {
    Alert.alert('Remove Bookmark', 'Are you sure you want to remove this artisan from your saved list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const previous = [...artisans];
          setArtisans((prev) => prev.filter((a) => a.id !== id));
          try {
            await ProfileService.unsaveArtisan(id);
          } catch (err) {
            console.error('[SavedArtisansScreen] Unsave failed:', err);
            setArtisans(previous);
            Alert.alert('Error', 'Failed to remove artisan from bookmarks.');
          }
        },
      },
    ]);
  };

  const filtered = artisans.filter((a) => {
    const name = a.businessName || (a as any).user?.email?.split('@')[0] || '';
    const trade = a.trade || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || trade.toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Favorite Artisans</Text>
          <Text style={styles.headerSubtitle}>Trusted pros for quick re-hiring</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{artisans.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search saved artisans by name or skill..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved artisans...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyTitle}>
                {search ? 'No matching artisans' : 'No Saved Artisans Yet'}
              </Text>
              <Text style={styles.emptySub}>
                {search
                  ? `No bookmarked artisans matching "${search}".`
                  : 'Bookmark reliable artisans when exploring the marketplace to quickly rehire or chat with them later.'}
              </Text>
              {onExplore && !search && (
                <TouchableOpacity style={styles.exploreBtn} onPress={onExplore} activeOpacity={0.8}>
                  <Text style={styles.exploreBtnText}>Browse Artisans</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const displayName = item.businessName || (item as any).user?.email?.split('@')[0] || 'Artisan Specialist';
            const initials = displayName.slice(0, 2).toUpperCase();
            const ratingVal = item.rating || 5.0;
            const reviewsCount = item.reviewCount || 0;
            const rate = item.hourlyRate || item.startingPrice || 0;
            const isOnline = item.isAvailable ?? true;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => onSelectArtisan?.(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                    {isOnline && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.meta}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{displayName}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemove(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.favIcon}>❤️</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.trade}>{item.trade || 'Professional Artisan'}</Text>
                    <View style={styles.statsRow}>
                      <Text style={styles.ratingText}>⭐ {ratingVal.toFixed(1)}</Text>
                      <Text style={styles.subDot}>•</Text>
                      <Text style={styles.reviewsText}>({reviewsCount} reviews)</Text>
                      {rate > 0 && (
                        <>
                          <Text style={styles.subDot}>•</Text>
                          <Text style={styles.rateText}>{formatCurrency(rate)}/hr</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => onChat?.(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chatBtnText}>💬 Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rehireBtn}
                    onPress={() => onRehire?.(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rehireBtnText}>Direct Re-hire</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  backBtnText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },
  searchBarWrap: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    position: 'relative',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  meta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  favIcon: {
    fontSize: 16,
  },
  trade: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  subDot: {
    marginHorizontal: 4,
    color: colors.textMuted,
  },
  reviewsText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  rateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  hiredBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  hiredBadgeText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chatBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  rehireBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  rehireBtnText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.base + 2,
    fontWeight: '800',
    color: colors.neutral[900],
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
    maxWidth: 280,
  },
  exploreBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.brand.forest,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: typography.size.sm,
  },
});
