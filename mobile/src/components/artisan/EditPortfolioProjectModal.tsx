import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Camera,
  Trash2,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows } from '../../theme';
import { useToast } from '../shared/ToastContext';

export interface PortfolioProjectData {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  trade?: string;
  costEstimate?: string;
  completionDate?: string;
}

interface EditPortfolioProjectModalProps {
  visible: boolean;
  onClose: () => void;
  project: PortfolioProjectData | null;
  onSaveProject: (project: PortfolioProjectData) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
}

export const EditPortfolioProjectModal: React.FC<EditPortfolioProjectModalProps> = ({
  visible,
  onClose,
  project,
  onSaveProject,
  onDeleteProject,
}) => {
  const { showSuccess, showWarning, showError } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (project) {
      setTitle(project.title || '');
      setDescription(project.description || '');
      setImageUrl(project.imageUrl);
      setCategory(project.category || 'General Craftsmanship');
    } else {
      setTitle('');
      setDescription('');
      setImageUrl(undefined);
      setCategory('General Craftsmanship');
    }
  }, [project]);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUrl(result.assets[0].uri);
      }
    } catch {
      showError('Media Error', 'Could not open image library.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showWarning('Title Required', 'Please provide a descriptive title for your project.');
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      showWarning(
        'Description Required',
        'Please describe your work, materials used, and challenges solved (min 15 chars).'
      );
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSaveProject({
        id: project?.id,
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        category: category.trim(),
        completionDate: project?.completionDate || 'Recent',
      });
      showSuccess(
        project?.id ? 'Project Updated' : 'Showcase Project Added',
        'Your portfolio was updated and is visible to clients.'
      );
      onClose();
    } catch (err: any) {
      showError('Save Error', err?.message || 'Could not save portfolio item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!project?.id || !onDeleteProject) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSubmitting(true);
    try {
      await onDeleteProject(project.id);
      showSuccess('Project Removed', 'Showcase project deleted from your portfolio.');
      onClose();
    } catch (err: any) {
      showError('Delete Error', err?.message || 'Could not delete project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.safeContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.topBarTitle}>
                {project?.id ? 'Edit Showcase Project' : 'Add Showcase Project'}
              </Text>
              <Text style={styles.topBarSubtitle}>Demonstrate your highest caliber work</Text>
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
            {/* Project Photo Picker */}
            <View style={styles.photoContainer}>
              {imageUrl ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={styles.changeImageOverlay}
                    activeOpacity={0.8}
                  >
                    <Camera size={16} color="#FFFFFF" />
                    <Text style={styles.changeImageText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={styles.emptyPhotoBox}
                  activeOpacity={0.8}
                >
                  <Camera size={28} color="#10B981" />
                  <Text style={styles.emptyPhotoText}>Upload Project Photo</Text>
                  <Text style={styles.emptyPhotoSub}>High-resolution before/after or finished finish</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Project Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Master Bedroom POP Ceiling & Recessed Spotlights"
                placeholderTextColor={colors.neutral[500]}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Trade / Specialty */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Category / Specialty</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Plumbing, Electrical, Interior Finishing"
                placeholderTextColor={colors.neutral[500]}
                value={category}
                onChangeText={setCategory}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Project Description & Execution Notes *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Describe scope, materials utilized (e.g. conduit pipes, porcelain tiles), and warranty provided..."
                placeholderTextColor={colors.neutral[500]}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {description.length < 15
                  ? `Minimum 15 characters (${15 - description.length} more needed)`
                  : `${description.length} characters`}
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Bar */}
          <View style={styles.bottomBar}>
            {project?.id && onDeleteProject && (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isSubmitting}
                style={styles.deleteBtn}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSubmitting}
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#071A11" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#071A11" />
                  <Text style={styles.saveBtnText}>
                    {project?.id ? 'Save Changes' : 'Publish Project'}
                  </Text>
                </>
              )}
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
    backgroundColor: '#071A11',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#0E291D',
    borderBottomWidth: 1,
    borderBottomColor: '#17402B',
  },
  topBarTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  topBarSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: '#10B981',
    marginTop: 2,
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
    paddingBottom: 40,
    gap: spacing.md,
  },
  photoContainer: {
    marginBottom: spacing.xs,
  },
  imagePreviewWrap: {
    width: '100%',
    height: 180,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1D4E35',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  changeImageText: {
    fontSize: 11,
    fontFamily: typography.fonts.semiBold,
    color: '#FFFFFF',
  },
  emptyPhotoBox: {
    width: '100%',
    height: 140,
    borderRadius: radius.xl,
    backgroundColor: '#0E291D',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#10B98160',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: spacing.md,
  },
  emptyPhotoText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  emptyPhotoSub: {
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[200],
  },
  textInput: {
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    paddingHorizontal: spacing.sm,
    height: 48,
    color: colors.neutral[100],
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
  },
  textArea: {
    backgroundColor: '#0E291D',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#1D4E35',
    padding: spacing.sm,
    height: 100,
    color: colors.neutral[100],
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
  },
  charCount: {
    fontSize: 10,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    textAlign: 'right',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: '#071A11',
    borderTopWidth: 1,
    borderTopColor: '#17402B',
  },
  deleteBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderColor: '#EF444450',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteBtnText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: '#EF4444',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
});
