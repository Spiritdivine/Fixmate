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
import { ChevronLeft, Bookmark, Heart, Star, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { ProfileService } from '../../services/profile.service';
import { ArtisanProfileData } from '../../types/api-contracts';
import { SkeletonArtisanCard } from '../shared';
import { useToast } from '../shared/ToastContext';
import { useToggleSaveArtisan } from '../../hooks';

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
  const { colors: themeColors, isDark } = useTheme();
  const { showSuccess, showError } = useToast();
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

  const toggleSaveMutation = useToggleSaveArtisan();

  const handleRemove = (id: string) => {
    const previous = [...artisans];
    setArtisans((prev) => prev.filter((a) => a.id !== id));
    showSuccess('Bookmark Removed', 'Artisan removed from your saved list.');

    toggleSaveMutation.mutate(
      { artisanId: id, isSaved: false },
      {
        onError: () => {
          setArtisans(previous);
          showError('Error', 'Failed to remove artisan from bookmarks.');
        },
      }
    );
  };

  const filtered = artisans.filter((a) => {
    const name = a.businessName || (a as any).user?.email?.split('@')[0] || '';
    const trade = a.trade || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || trade.toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={22} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Favorite Artisans</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>Trusted pros for quick re-hiring</Text>
        </View>
        <View style={[styles.countBadge, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
          <Text style={[styles.countBadgeText, isDark && { color: '#34D399' }]}>{artisans.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBarWrap, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TextInput
          style={[styles.searchInput, {
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.inputBorder,
            color: themeColors.text,
          }]}
          placeholder="Search saved artisans by name or skill..."
          placeholderTextColor={themeColors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonArtisanCard />
          <SkeletonArtisanCard />
          <SkeletonArtisanCard />
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
              <Bookmark size={40} color={themeColors.textMuted} style={{ marginBottom: spacing.md }} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                {search ? 'No matching artisans' : 'No Saved Artisans Yet'}
              </Text>
              <Text style={[styles.emptySub, { color: themeColors.textMuted }]}>
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
                style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                onPress={() => onSelectArtisan?.(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={[styles.avatarText, isDark && { color: '#34D399' }]}>{initials}</Text>
                    {isOnline && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.meta}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.name, { color: themeColors.text }]}>{displayName}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemove(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Heart size={18} color="#EF4444" fill="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.trade, { color: themeColors.textMuted }]}>{item.trade || 'Professional Artisan'}</Text>
                    <View style={styles.statsRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>{ratingVal.toFixed(1)}</Text>
                      </View>
                      <Text style={[styles.subDot, { color: themeColors.textMuted }]}>•</Text>
                      <Text style={[styles.reviewsText, { color: themeColors.textMuted }]}>({reviewsCount} reviews)</Text>
                      {rate > 0 && (
                        <>
                          <Text style={[styles.subDot, { color: themeColors.textMuted }]}>•</Text>
                          <Text style={[styles.rateText, isDark && { color: '#34D399' }]}>{formatCurrency(rate)}/hr</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={[styles.actionsRow, { borderTopColor: themeColors.border }]}>
                  <TouchableOpacity
                    style={[styles.chatBtn, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}
                    onPress={() => onChat?.(item.id)}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={14} color={themeColors.text} />
                    <Text style={[styles.chatBtnText, { color: themeColors.text }]}>Chat</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
