import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Edit3, Trash2, Plus, ArrowLeft } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ProfileService } from '../../services/profile.service';
import { useAuthStore } from '../../stores/authStore';
import { EditPortfolioProjectModal, PortfolioProjectData } from './EditPortfolioProjectModal';
import { useToast } from '../shared/ToastContext';
import { usePortfolioMutation } from '../../hooks';
import { generateTempId } from '../../lib/optimistic-helpers';

interface PortfolioCase {
  id: string;
  title: string;
  description?: string;
  trade?: string;
  imageUrl?: string;
  mediaUrls?: string[];
  costEstimate?: string;
}

interface PortfolioEditorScreenProps {
  onBack?: () => void;
}

export const PortfolioEditorScreen: React.FC<PortfolioEditorScreenProps> = ({ onBack }) => {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useToast();
  const [projects, setProjects] = useState<PortfolioCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeProject, setActiveProject] = useState<PortfolioProjectData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    const artisanId = user?.artisanProfile?.id;
    if (!artisanId) {
      setLoading(false);
      return;
    }
    try {
      const data = await ProfileService.getArtisanDetails(artisanId);
      const items = (data as any)?.portfolios || (data as any)?.portfolio || [];
      setProjects(items);
    } catch (err) {
      console.warn('[PortfolioEditorScreen] Failed to fetch portfolio:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPortfolio();
  };

  const handleOpenAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PortfolioCase) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveProject({
      id: item.id,
      title: item.title,
      description: item.description || '',
      trade: item.trade,
      imageUrl: item.imageUrl || (item.mediaUrls && item.mediaUrls[0]),
      costEstimate: item.costEstimate,
    });
    setIsModalOpen(true);
  };

  const portfolioMutations = usePortfolioMutation(user?.artisanProfile?.id);

  const handleSaveProject = async (data: PortfolioProjectData): Promise<void> => {
    // Immediate sensory and modal feedback (<16ms)
    setIsModalOpen(false);
    setActiveProject(null);

    if (data.id) {
      // Optimistic update
      const previous = [...projects];
      setProjects((prev) =>
        prev.map((p) =>
          p.id === data.id
            ? {
                ...p,
                title: data.title,
                description: data.description,
                trade: data.trade,
                imageUrl: data.imageUrl,
                costEstimate: data.costEstimate,
              }
            : p
        )
      );
      showSuccess('Showcase project updated successfully');

      portfolioMutations.updateProject(
        {
          id: data.id,
          data: {
            title: data.title.trim(),
            description: data.description?.trim() || undefined,
            imageUrl: data.imageUrl || '',
            ...({ mediaUrls: data.imageUrl ? [data.imageUrl] : [] } as any),
          },
        },
        {
          onError: () => {
            setProjects(previous);
            showError('Failed to update showcase project');
          },
        }
      );
    } else {
      // Optimistic create with temp ID
      const tempId = generateTempId('proj');
      const optimisticProject: PortfolioCase = {
        id: tempId,
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        trade: data.trade,
        imageUrl: data.imageUrl || '',
        costEstimate: data.costEstimate,
      };

      const previous = [...projects];
      setProjects((prev) => [optimisticProject, ...prev]);
      showSuccess('Showcase project added to your verified portfolio!');

      portfolioMutations.addProject(
        {
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          imageUrl: data.imageUrl || '',
          ...({ mediaUrls: data.imageUrl ? [data.imageUrl] : [] } as any),
        },
        {
          onSuccess: (created) => {
            setProjects((prev) =>
              prev.map((p) => (p.id === tempId ? { ...p, id: created.id } : p))
            );
          },
          onError: () => {
            setProjects(previous);
            showError('Failed to save showcase project');
          },
        }
      );
    }
  };

  const handleDeleteProject = async (id: string): Promise<void> => {
    const previous = [...projects];
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setIsModalOpen(false);
    setActiveProject(null);
    showSuccess('Project removed from portfolio');

    portfolioMutations.deleteProject(id, {
      onError: () => {
        setProjects(previous);
        showError('Failed to delete portfolio item');
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Work Portfolio</Text>
        </View>
        <TouchableOpacity
          onPress={handleOpenAddModal}
          style={styles.addBtnHeader}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Work</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brand.emerald} />
        }
      >
        <Text style={styles.subHeading}>
          Show clients real proof of your craftsmanship and repairs to win higher-budget bids.
        </Text>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={colors.brand.emerald} />
            <Text style={styles.loadingText}>Loading portfolio showcase...</Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🛠️</Text>
            <Text style={styles.emptyTitle}>No Showcase Projects Yet</Text>
            <Text style={styles.emptySub}>
              Artisans with photos of completed projects win up to 3x more bids on Artifix.
            </Text>
            <TouchableOpacity
              onPress={handleOpenAddModal}
              style={styles.emptyAddBtn}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddBtnText}>Add Your First Project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          projects.map((item) => {
            const imgUrl =
              item.imageUrl ||
              (item.mediaUrls && item.mediaUrls[0]) ||
              'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800';

            return (
              <View key={item.id} style={styles.caseCard}>
                <View style={styles.caseTop}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.caseTitle}>{item.title}</Text>
                    {item.trade && (
                      <View style={styles.tradeTag}>
                        <Text style={styles.tradeTagText}>{item.trade}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.caseActionsRow}>
                    <TouchableOpacity
                      onPress={() => handleOpenEditModal(item)}
                      style={styles.actionIconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Edit3 size={16} color={colors.neutral[300]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteProject(item.id)}
                      style={[styles.actionIconBtn, styles.deleteActionBtn]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.caseDesc}>{item.description}</Text>
                ) : null}

                {/* Photo Comparison or Showcase Image */}
                <View style={styles.singlePhotoContainer}>
                  <Image source={{ uri: imgUrl }} style={styles.singlePhoto} resizeMode="cover" />
                  <View style={styles.verifiedStampPill}>
                    <Text style={styles.verifiedStampText}>✓ Artifix Verified Craft</Text>
                  </View>
                  {item.costEstimate && (
                    <View style={styles.costBadge}>
                      <Text style={styles.costBadgeText}>{item.costEstimate}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit / Add Modal */}
      <EditPortfolioProjectModal
        visible={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveProject(null);
        }}
        onSaveProject={handleSaveProject}
        onDeleteProject={handleDeleteProject}
        project={activeProject}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071A11',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#133E2B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0E291D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.size.base + 2,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand.emerald,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 40,
  },
  subHeading: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[400],
    marginTop: spacing.md,
    marginBottom: spacing.base,
    lineHeight: 18,
  },
  caseCard: {
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#1A4D36',
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  caseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  caseTitle: {
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tradeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tradeTagText: {
    color: colors.brand.emerald,
    fontSize: 10,
    fontWeight: '700',
  },
  caseActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  caseDesc: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[300],
    lineHeight: 18,
    marginBottom: 10,
  },
  singlePhotoContainer: {
    height: 190,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#071A11',
  },
  singlePhoto: {
    width: '100%',
    height: '100%',
  },
  verifiedStampPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(7, 26, 17, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedStampText: {
    color: colors.brand.emerald,
    fontSize: 10,
    fontWeight: '700',
  },
  costBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(7, 26, 17, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  costBadgeText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '700',
  },
  centerWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: typography.size.sm,
    color: colors.neutral[400],
    fontWeight: '600',
  },
  emptyWrap: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E291D',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#1A4D36',
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: typography.size.base + 1,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: colors.brand.emerald,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: typography.size.xs + 1,
  },
});
