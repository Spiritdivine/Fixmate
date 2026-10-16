import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { ProfileService } from '../../services/profile.service';
import { useAuthStore } from '../../stores/authStore';

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
  const [projects, setProjects] = useState<PortfolioCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTrade, setNewTrade] = useState(user?.artisanProfile?.trade || 'Electrical');
  const [newImageUrl, setNewImageUrl] = useState(
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddProject = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a project title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await ProfileService.addPortfolio({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        imageUrl: newImageUrl.trim(),
        ...( { mediaUrls: [newImageUrl.trim()] } as any ),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProjects((prev) => [created as any, ...prev]);
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      Alert.alert('Success', 'Showcase project added to your verified portfolio!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save portfolio project.';
      Alert.alert('Upload Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    Alert.alert('Delete Project', 'Are you sure you want to remove this case study from your portfolio?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const previous = [...projects];
          setProjects((prev) => prev.filter((p) => p.id !== id));
          try {
            await ProfileService.deletePortfolio(id);
          } catch (err) {
            console.error('[PortfolioEditorScreen] Delete failed:', err);
            setProjects(previous);
            Alert.alert('Error', 'Failed to delete portfolio item.');
          }
        },
      },
    ]);
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
          <Text style={styles.headerTitle}>Work Portfolio</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsAddModalOpen(true)}
          style={styles.addBtnHeader}
        >
          <Text style={styles.addBtnText}>+ Add Work</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.brand.forest]} />
        }
      >
        <Text style={styles.subHeading}>
          Show clients real proof of your craftsmanship and repairs to win higher-budget bids.
        </Text>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={colors.brand.forest} />
            <Text style={styles.loadingText}>Loading portfolio showcase...</Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🛠️</Text>
            <Text style={styles.emptyTitle}>No Showcase Projects Yet</Text>
            <Text style={styles.emptySub}>
              Artisans with photos of completed projects win up to 3x more bids on Fixmate.
            </Text>
            <TouchableOpacity
              onPress={() => setIsAddModalOpen(true)}
              style={styles.emptyAddBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyAddBtnText}>+ Add Your First Project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          projects.map((item) => {
            const imgUrl =
              item.imageUrl ||
              (item.mediaUrls && item.mediaUrls[0]) ||
              (item as any).afterUrl ||
              'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800';

            return (
              <View key={item.id} style={styles.caseCard}>
                <View style={styles.caseTop}>
                  <Text style={styles.caseTitle}>{item.title}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteProject(item.id)}
                    style={styles.deleteIconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.deleteIconText}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {item.description ? (
                  <Text style={styles.caseDesc}>{item.description}</Text>
                ) : null}

                {/* Photo Comparison or Showcase Image */}
                <View style={styles.singlePhotoContainer}>
                  <Image source={{ uri: imgUrl }} style={styles.singlePhoto} resizeMode="cover" />
                  <View style={styles.verifiedStampPill}>
                    <Text style={styles.verifiedStampText}>✓ Fixmate Verified Craft</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Project Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Add New Work Showcase</Text>

            <Text style={styles.inputLabel}>Project Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Inverter Wiring & Battery Balancing"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Description & Scope</Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Explain the problem and what repair or installation you performed..."
              multiline
              numberOfLines={3}
              value={newDescription}
              onChangeText={setNewDescription}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Photo URL</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://images.unsplash.com/photo-..."
              value={newImageUrl}
              onChangeText={setNewImageUrl}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                style={styles.cancelBtn}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddProject}
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Save Case Study</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtnHeader: {
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    color: colors.neutral[500],
    marginTop: spacing.md,
    marginBottom: spacing.base,
    lineHeight: 18,
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: colors.neutral[900],
    flex: 1,
    marginRight: 8,
  },
  tradeTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tradeTagText: {
    color: colors.brand.emeraldDark,
    fontSize: 10,
    fontWeight: '700',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoContainer: {
    flex: 1,
    height: 120,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoTagAfter: {
    backgroundColor: 'rgba(6, 95, 70, 0.9)',
  },
  photoTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  costText: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  verifiedStamp: {
    fontSize: 10,
    color: colors.brand.emeraldDark,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
  },
  modalHeading: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.size.sm,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  slotBox: {
    flex: 1,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.brand.emerald,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  submitBtn: {
    flex: 1.5,
    backgroundColor: colors.brand.forest,
    paddingVertical: 12,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  submitText: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  centerWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: typography.size.sm,
    color: colors.neutral[500],
    fontWeight: '600',
  },
  emptyWrap: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: typography.size.base + 1,
    fontWeight: '800',
    color: colors.neutral[900],
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyAddBtn: {
    marginTop: 16,
    backgroundColor: colors.brand.forest,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: typography.size.xs + 1,
  },
  deleteIconBtn: {
    padding: 4,
  },
  deleteIconText: {
    fontSize: 16,
  },
  caseDesc: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: 10,
  },
  singlePhotoContainer: {
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  singlePhoto: {
    width: '100%',
    height: '100%',
  },
  verifiedStampPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(14, 53, 36, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  verifiedStampText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
