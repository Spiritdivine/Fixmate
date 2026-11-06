import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Check,
  AlertTriangle,
  Clock,
  Trash2,
  Plus,
  MapPin,
  Calendar,
  Camera,
  Image as ImageIcon,
  Navigation,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets, useTheme } from '../../theme';
import { JobService } from '../../services/job.service';
import { UploadService } from '../../services/upload.service';
import { LocationProvider } from '../../lib/location-provider';
import { JobRecord, JobUrgency, JobAttachment } from '../../types/api-contracts';
import { useToast } from '../shared/ToastContext';
import { formatCurrency } from '../../lib/formatters';
import { LocationSelectorInput } from '../shared/LocationSelectorInput';

interface EditJobModalProps {
  visible: boolean;
  job: JobRecord | null | undefined;
  onClose: () => void;
  onSuccess?: () => void;
}

const normalizeUrgency = (raw?: string): JobUrgency => {
  if (!raw) return 'NORMAL';
  if (raw === 'EMERGENCY') return 'EMERGENCY';
  if (raw === 'URGENT' || raw === 'HIGH') return 'URGENT';
  return 'NORMAL';
};

const normalizeMaterials = (raw?: string): string => {
  if (!raw) return 'Split / Negotiable on site';
  const lower = raw.toLowerCase();
  if (lower.includes('client')) return 'Client supplies all materials';
  if (lower.includes('artisan')) return 'Artisan provides verified parts';
  return 'Split / Negotiable on site';
};

const DEFAULT_CATEGORIES = [
  { id: 2, name: 'Plumbing & Pipefitting' },
  { id: 1, name: 'Electrical & Solar' },
  { id: 3, name: 'Carpentry & Woodwork' },
  { id: 5, name: 'AC & Refrigeration' },
  { id: 6, name: 'Painting & Wall POP' },
  { id: 4, name: 'Masonry & Tiling' },
];

const URGENCY_OPTIONS: Array<{ key: JobUrgency; label: string; sub: string }> = [
  {
    key: 'EMERGENCY',
    label: 'Emergency (Arrive ASAP within 1h)',
    sub: 'Fastest bids from nearest online artisans',
  },
  {
    key: 'URGENT',
    label: 'Urgent (Today)',
    sub: 'Repair needed before end of day',
  },
  {
    key: 'NORMAL',
    label: 'Normal (Next Few Days)',
    sub: 'Schedule at convenient time',
  },
];

const MATERIAL_OPTIONS = [
  { id: 'Artisan provides verified parts', label: 'Procured by Artisan', sub: 'Verified parts' },
  { id: 'Client supplies all materials', label: 'Supplied by Client', sub: 'Materials on site' },
  { id: 'Split / Negotiable on site', label: 'Split / Negotiable', sub: 'To agree on site' },
];

const DEADLINE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: '+3 Days', days: 3 },
  { label: '+1 Week', days: 7 },
  { label: '+2 Weeks', days: 14 },
  { label: 'Flexible', days: null },
];

export const EditJobModal: React.FC<EditJobModalProps> = ({
  visible,
  job,
  onClose,
  onSuccess,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { showSuccess, showError, showInfo } = useToast();

  // Categories query
  const { data: dbCategories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: () => JobService.listCategories(),
  });

  const availableCategories = Array.isArray(dbCategories) && dbCategories.length > 0
    ? dbCategories
    : DEFAULT_CATEGORIES;

  // Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(2);
  const [trade, setTrade] = useState<string>('Plumbing & Pipefitting');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Location State
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Budget State
  const [pricingModel, setPricingModel] = useState<'FIXED' | 'RANGE' | 'HOURLY'>('FIXED');
  const [budgetFixed, setBudgetFixed] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  // Urgency & Deadline
  const [urgency, setUrgency] = useState<JobUrgency>('NORMAL');
  const [deadlineDate, setDeadlineDate] = useState('');

  // Outcome & Materials
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [materials, setMaterials] = useState<string>('Artisan provides verified parts');

  // Attachments State
  const [existingAttachments, setExistingAttachments] = useState<JobAttachment[]>([]);
  const [newAttachments, setNewAttachments] = useState<
    Array<{ localUri: string; fileName: string; fileSizeBytes: number; mimeType: string }>
  >([]);
  const [deletingAttId, setDeletingAttId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  useEffect(() => {
    if (job) {
      setSelectedCategoryId(job.categoryId || 2);
      setTrade(job.trade || job.category?.name || 'Plumbing & Pipefitting');
      setTitle(job.title || '');
      setDescription(job.description || '');

      const loc = job.address || (job.lgaCity && job.state ? `${job.lgaCity}, ${job.state}` : job.location || '');
      setLocationName(loc);
      setCoords({ latitude: job.latitude, longitude: job.longitude });

      const isHourly = (job.budgetType as any) === 'HOURLY';
      const isRange = job.budgetMin != null && job.budgetMax != null && Number(job.budgetMin) !== Number(job.budgetMax);

      if (isHourly) {
        setPricingModel('HOURLY');
        setBudgetFixed(String(job.budget || job.budgetMax || job.budgetMin || ''));
      } else if (isRange) {
        setPricingModel('RANGE');
        setBudgetMin(String(job.budgetMin || ''));
        setBudgetMax(String(job.budgetMax || ''));
      } else {
        setPricingModel('FIXED');
        setBudgetFixed(String(job.budget || job.budgetMax || job.budgetMin || ''));
      }

      setUrgency(normalizeUrgency(job.urgency));
      setDeadlineDate(job.deadlineDate ? String(job.deadlineDate).split('T')[0] : '');
      setExpectedOutcome(job.expectedOutcome || '');
      setMaterials(normalizeMaterials(job.materialsProvidedBy));
      setExistingAttachments(job.attachments || []);
      setNewAttachments([]);
    }
  }, [job, visible]);

  // GPS Location Refresher
  const handleDetectGPS = async () => {
    try {
      setIsDetectingLocation(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const loc = await LocationProvider.getCurrentLocation();
      if (loc.addressName) {
        setLocationName(loc.addressName);
        setCoords({ latitude: loc.latitude, longitude: loc.longitude });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess('Location refreshed via GPS');
      }
    } catch {
      showInfo('Location Notice', 'Could not lock GPS. You can type your neighborhood address manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Photo Pickers
  const handlePickImage = async () => {
    const total = existingAttachments.length + newAttachments.length;
    if (total >= 4) {
      showError('Maximum 4 photos allowed per job request.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const name = asset.fileName || `edit_job_${Date.now()}.jpg`;
      const mime = asset.mimeType || 'image/jpeg';
      const size = asset.fileSize || 450000;
      setNewAttachments((prev) => [
        ...prev,
        { localUri: asset.uri, fileName: name, fileSizeBytes: size, mimeType: mime },
      ]);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTakePhoto = async () => {
    const total = existingAttachments.length + newAttachments.length;
    if (total >= 4) {
      showError('Maximum 4 photos allowed per job request.');
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showError('Camera permission required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const name = `camera_${Date.now()}.jpg`;
      setNewAttachments((prev) => [
        ...prev,
        { localUri: asset.uri, fileName: name, fileSizeBytes: asset.fileSize || 450000, mimeType: 'image/jpeg' },
      ]);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDeleteExistingAttachment = async (attId: string) => {
    if (!job?.id) return;
    try {
      setDeletingAttId(attId);
      await JobService.deleteAttachment(job.id, attId);
      setExistingAttachments((prev) => prev.filter((a) => a.id !== attId));
      await queryClient.invalidateQueries({ queryKey: ['job-details', job.id] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      showSuccess('Photo removed');
    } catch (err: any) {
      showError(err?.message || 'Failed to remove photo');
    } finally {
      setDeletingAttId(null);
    }
  };

  const handleRemoveNewAttachment = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetDeadlineDays = (days: number | null) => {
    Haptics.selectionAsync().catch(() => {});
    if (days === null) {
      setDeadlineDate('');
    } else {
      const d = new Date();
      d.setDate(d.getDate() + days);
      setDeadlineDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSelectUrgency = (itemKey: JobUrgency) => {
    setUrgency(itemKey);
    if (itemKey === 'EMERGENCY') {
      setDeadlineDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleSave = async () => {
    if (!job?.id) return;

    if (!title.trim() || title.trim().length < 5) {
      showError('Title must be at least 5 characters');
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      showError('Description must be at least 20 characters');
      return;
    }

    let parsedMin = 1000;
    let parsedMax = 1000;
    if (pricingModel === 'FIXED' || pricingModel === 'HOURLY') {
      const amt = parseFloat(budgetFixed.replace(/[^0-9.]/g, ''));
      if (isNaN(amt) || amt <= 0) {
        showError('Please enter a valid target budget');
        return;
      }
      parsedMin = amt;
      parsedMax = amt;
    } else {
      const min = parseFloat(budgetMin.replace(/[^0-9.]/g, ''));
      const max = parseFloat(budgetMax.replace(/[^0-9.]/g, ''));
      if (isNaN(min) || min <= 0) {
        showError('Please enter a valid minimum budget');
        return;
      }
      if (isNaN(max) || max < min) {
        showError('Maximum budget must be greater than or equal to minimum budget');
        return;
      }
      parsedMin = min;
      parsedMax = max;
    }

    setIsSubmitting(true);
    setUploadProgressText('');

    try {
      // 1. Upload new attachments if any
      const uploadedAttachments: Array<{ fileUrl: string; fileName: string; fileSizeBytes: number; mimeType: string }> = [];
      if (newAttachments.length > 0) {
        for (let i = 0; i < newAttachments.length; i++) {
          const item = newAttachments[i];
          setUploadProgressText(`Uploading photo ${i + 1} of ${newAttachments.length}...`);
          try {
            const uploadedUrl = await UploadService.uploadImage(
              item.localUri,
              'jobs',
              item.fileName,
              item.mimeType
            );
            uploadedAttachments.push({
              fileUrl: uploadedUrl,
              fileName: item.fileName,
              fileSizeBytes: item.fileSizeBytes,
              mimeType: item.mimeType,
            });
          } catch (uploadErr) {
            console.warn('[EditJobModal] Image upload error:', uploadErr);
          }
        }
      }

      setUploadProgressText('Updating job details...');

      // 2. Parse state and lgaCity from location string
      let derivedState: string | undefined = job.state;
      let derivedLga: string | undefined = job.lgaCity;
      if (locationName.trim()) {
        const parts = locationName.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length === 1) {
          derivedLga = parts[0];
          derivedState = derivedState || 'Lagos';
        } else if (parts.length >= 2) {
          derivedLga = parts[0];
          derivedState = parts[1];
        }
      }

      await JobService.update(job.id, {
        categoryId: selectedCategoryId,
        trade,
        title: title.trim(),
        description: description.trim(),
        state: derivedState,
        lgaCity: derivedLga,
        address: locationName.trim() || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
        budgetMin: parsedMin,
        budgetMax: parsedMax,
        budgetType: pricingModel === 'HOURLY' ? 'HOURLY' : 'FIXED',
        urgency,
        deadlineDate: deadlineDate || (urgency === 'EMERGENCY' ? new Date().toISOString().split('T')[0] : job.deadlineDate),
        expectedOutcome: expectedOutcome.trim() || undefined,
        materialsProvidedBy: materials,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ['job-details', job.id] });
      await queryClient.invalidateQueries({ queryKey: ['client-my-jobs'] });
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      await queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showSuccess('Job request details updated successfully!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update job request';
      showError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgressText('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheetContainer, { backgroundColor: themeColors.surface }]}>
          {/* Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: themeColors.border }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Edit Job Request</Text>
              <Text style={[styles.sheetSub, { color: themeColors.textMuted }]}>Update scope, category, location, budget or photos</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={touchTargets.hitSlop} style={styles.closeBtn}>
              <X size={20} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            {/* Warning Pill if bids received */}
            <View style={[styles.warningPill, isDark && { backgroundColor: '#451A03' }]}>
              <AlertTriangle size={15} color={isDark ? '#F59E0B' : '#B45309'} />
              <Text style={[styles.warningPillText, isDark && { color: '#FCD34D' }]}>
                Active artisan bidders will be notified if you change the scope, budget, or urgency.
              </Text>
            </View>

            {/* Feature 1: Category & Trade Selector */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>CATEGORY / TRADE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {availableCategories.map((cat: any) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                      isSelected && [styles.categoryChipActive, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: themeColors.primary }],
                    ]}
                    onPress={() => {
                      setSelectedCategoryId(cat.id);
                      setTrade(cat.name);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: themeColors.text },
                        isSelected && [styles.categoryChipTextActive, { color: isDark ? '#34D399' : colors.brand.forest }],
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Title Input */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>JOB TITLE</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Leaking pipe under kitchen sink"
              placeholderTextColor={themeColors.textMuted}
            />

            {/* Description Input */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide a detailed description of the fault..."
              placeholderTextColor={themeColors.textMuted}
              multiline
              numberOfLines={4}
            />

            {/* Feature 2: Dual-Mode Location Selector */}
            <LocationSelectorInput
              label="JOB LOCATION"
              initialAddress={locationName}
              initialCoords={coords}
              onChangeLocation={(loc) => {
                setLocationName(loc.address);
                if (loc.latitude && loc.longitude) {
                  setCoords({ latitude: loc.latitude, longitude: loc.longitude });
                }
              }}
            />

            {/* Feature 4: Budget Type & Range Selector */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted, marginTop: 16 }]}>BUDGET STRUCTURE</Text>
            <View style={[styles.pricingModelRow, { backgroundColor: themeColors.surfaceSubtle }]}>
              {[
                { key: 'FIXED', label: 'Fixed (₦)' },
                { key: 'RANGE', label: 'Range (₦ - ₦)' },
                { key: 'HOURLY', label: 'Hourly (₦/hr)' },
              ].map((model) => (
                <TouchableOpacity
                  key={model.key}
                  style={[styles.pricingTab, pricingModel === model.key && [styles.pricingTabActive, { backgroundColor: themeColors.surface }]]}
                  onPress={() => {
                    setPricingModel(model.key as any);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                >
                  <Text
                    style={[
                      styles.pricingTabText,
                      { color: themeColors.textMuted },
                      pricingModel === model.key && [styles.pricingTabTextActive, { color: isDark ? '#34D399' : colors.brand.forest }],
                    ]}
                  >
                    {model.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {pricingModel === 'RANGE' ? (
              <View style={styles.rangeRow}>
                <View style={styles.rangeCol}>
                  <Text style={[styles.subInputLabel, { color: themeColors.textMuted }]}>MIN BUDGET (₦)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
                    value={budgetMin}
                    onChangeText={setBudgetMin}
                    placeholder="e.g. 15000"
                    placeholderTextColor={themeColors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rangeCol}>
                  <Text style={[styles.subInputLabel, { color: themeColors.textMuted }]}>MAX BUDGET (₦)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
                    value={budgetMax}
                    onChangeText={setBudgetMax}
                    placeholder="e.g. 30000"
                    placeholderTextColor={themeColors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            ) : (
              <TextInput
                style={[styles.textInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
                value={budgetFixed}
                onChangeText={setBudgetFixed}
                placeholder={pricingModel === 'HOURLY' ? 'e.g. 3500 (per hour)' : 'e.g. 25000'}
                placeholderTextColor={themeColors.textMuted}
                keyboardType="numeric"
              />
            )}

            {/* Urgency Selector */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted, marginTop: 16 }]}>URGENCY LEVEL</Text>
            <View style={styles.urgencyCol}>
              {URGENCY_OPTIONS.map((item) => {
                const isActive = urgency === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => handleSelectUrgency(item.key)}
                    style={[
                      styles.urgencyCard,
                      { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                      isActive && [styles.urgencyCardActive, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: themeColors.primary }],
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.urgencyHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {item.key === 'EMERGENCY' ? (
                          <AlertTriangle size={15} color="#EF4444" strokeWidth={2} />
                        ) : item.key === 'URGENT' ? (
                          <Clock size={15} color="#F59E0B" strokeWidth={2} />
                        ) : (
                          <Calendar size={15} color="#10B981" strokeWidth={2} />
                        )}
                        <Text
                          style={[
                            styles.urgencyLabel,
                            { color: themeColors.text },
                            isActive && [styles.urgencyLabelActive, { color: isDark ? '#34D399' : colors.brand.forest }],
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                      {isActive && <Check size={16} color={isDark ? '#34D399' : colors.brand.forest} />}
                    </View>
                    <Text style={[styles.urgencySub, { color: themeColors.textMuted }]}>{item.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feature 5: Target Deadline Schedule */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted, marginTop: 16 }]}>TARGET DEADLINE</Text>
            <View style={styles.deadlinesRow}>
              {DEADLINE_PRESETS.map((p) => {
                const isSelected =
                  p.days === null
                    ? !deadlineDate
                    : deadlineDate &&
                      deadlineDate ===
                        new Date(Date.now() + p.days * 86400000).toISOString().split('T')[0];
                return (
                  <TouchableOpacity
                    key={p.label}
                    style={[
                      styles.deadlineChip,
                      { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                      isSelected && [styles.deadlineChipActive, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: themeColors.primary }],
                    ]}
                    onPress={() => handleSetDeadlineDays(p.days)}
                  >
                    <Text
                      style={[
                        styles.deadlineChipText,
                        { color: themeColors.text },
                        isSelected && [styles.deadlineChipTextActive, { color: isDark ? '#34D399' : colors.brand.forest }],
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {deadlineDate ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Calendar size={12} color={isDark ? '#34D399' : colors.brand.forest} />
                <Text style={[styles.deadlineHelperText, { color: isDark ? '#34D399' : colors.brand.forest, marginTop: 0 }]}>
                  Scheduled Target: {deadlineDate}
                </Text>
              </View>
            ) : (
              <Text style={[styles.deadlineHelperText, { color: themeColors.textMuted }]}>Flexible timeline</Text>
            )}

            {/* Materials Provided */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted, marginTop: 16 }]}>MATERIALS & PARTS RESPONSIBILITY</Text>
            <View style={styles.materialsRow}>
              {MATERIAL_OPTIONS.map((m) => {
                const isSelected = materials === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.materialChip,
                      { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                      isSelected && [styles.materialChipActive, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: themeColors.primary }],
                    ]}
                    onPress={() => setMaterials(m.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {isSelected && <Check size={13} color={isDark ? '#34D399' : colors.brand.forest} />}
                      <Text
                        style={[
                          styles.materialChipText,
                          { color: themeColors.text },
                          isSelected && [styles.materialChipTextActive, { color: isDark ? '#34D399' : colors.brand.forest }],
                        ]}
                      >
                        {m.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.materialChipSub,
                        { color: themeColors.textMuted },
                        isSelected && [styles.materialChipSubActive, { color: isDark ? '#A7F3D0' : colors.brand.forest }],
                      ]}
                    >
                      {m.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feature 3: Photo & Defect Attachments */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.inputLabel, { color: themeColors.textMuted }]}>PHOTOS & ATTACHMENTS (MAX 4)</Text>
              <Text style={[styles.countText, { color: themeColors.textMuted }]}>
                {existingAttachments.length + newAttachments.length}/4
              </Text>
            </View>

            {/* Thumbnails row */}
            <View style={styles.attachmentsContainer}>
              {/* Existing Attachments with Delete Action */}
              {existingAttachments.map((att) => (
                <View key={att.id} style={styles.attachmentWrapper}>
                  <Image source={{ uri: att.url || att.fileUrl }} style={styles.attachmentThumb} />
                  <TouchableOpacity
                    style={styles.deleteAttBtn}
                    onPress={() => handleDeleteExistingAttachment(att.id)}
                    disabled={deletingAttId === att.id}
                  >
                    {deletingAttId === att.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Trash2 size={13} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              {/* Newly Picked Attachments */}
              {newAttachments.map((item, idx) => (
                <View key={idx} style={styles.attachmentWrapper}>
                  <Image source={{ uri: item.localUri }} style={styles.attachmentThumb} />
                  <TouchableOpacity
                    style={styles.deleteAttBtn}
                    onPress={() => handleRemoveNewAttachment(idx)}
                  >
                    <X size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
              ))}

              {/* Add Photo Buttons */}
              {existingAttachments.length + newAttachments.length < 4 && (
                <View style={styles.photoActionsRow}>
                  <TouchableOpacity
                    style={[styles.addPhotoBtn, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}
                    onPress={handlePickImage}
                  >
                    <ImageIcon size={18} color={isDark ? '#34D399' : colors.brand.forest} />
                    <Text style={[styles.addPhotoText, { color: isDark ? '#34D399' : colors.brand.forest }]}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addPhotoBtn, { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border }]}
                    onPress={handleTakePhoto}
                  >
                    <Camera size={18} color={isDark ? '#34D399' : colors.brand.forest} />
                    <Text style={[styles.addPhotoText, { color: isDark ? '#34D399' : colors.brand.forest }]}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Expected Outcome */}
            <Text style={[styles.inputLabel, { color: themeColors.textMuted, marginTop: 16 }]}>EXPECTED OUTCOME (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
              value={expectedOutcome}
              onChangeText={setExpectedOutcome}
              placeholder="e.g. Zero leaks and clean pipe replacement"
              placeholderTextColor={themeColors.textMuted}
            />
          </ScrollView>

          {/* Sticky Actions */}
          <View style={[styles.sheetFooter, { borderTopColor: themeColors.border }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: themeColors.surfaceSubtle }]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelBtnText, { color: themeColors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: themeColors.primary }, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <View style={styles.submittingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  {uploadProgressText ? (
                    <Text style={styles.progressText}>{uploadProgressText}</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 33, 22, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '92%',
    padding: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sheetSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    paddingBottom: 24,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  warningPillText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  subInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.brand.forest,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gpsButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
  },
  locationIcon: {
    marginRight: 6,
  },
  locationTextInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  pricingModelRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: 3,
    gap: 4,
    marginBottom: 8,
  },
  pricingTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  pricingTabActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  pricingTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pricingTabTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rangeCol: {
    flex: 1,
  },
  urgencyCol: {
    gap: 8,
  },
  urgencyCard: {
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  urgencyCardActive: {
    borderColor: colors.brand.forest,
    backgroundColor: '#ECFDF5',
  },
  urgencyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  urgencyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  urgencyLabelActive: {
    color: colors.brand.forest,
  },
  urgencySub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  deadlinesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  deadlineChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deadlineChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.brand.forest,
  },
  deadlineChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  deadlineChipTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
  deadlineHelperText: {
    fontSize: 11,
    color: colors.brand.forest,
    fontWeight: '600',
  },
  materialsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  materialChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  materialChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.brand.forest,
  },
  materialChipText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  materialChipTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
  materialChipSub: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  materialChipSubActive: {
    color: colors.brand.forest,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  attachmentWrapper: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    position: 'relative',
    overflow: 'hidden',
  },
  attachmentThumb: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
  deleteAttBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: colors.brand.forest,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addPhotoBtn: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand.forest,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.forest,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
