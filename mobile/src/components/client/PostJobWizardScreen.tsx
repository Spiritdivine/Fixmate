import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Calendar, Check, Camera, Trash2, ShieldCheck, Image as ImageIcon, X } from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, useTheme } from '../../theme';
import { formatCurrency } from '../../lib/formatters';
import { JobService } from '../../services/job.service';
import { UploadService } from '../../services/upload.service';
import { JobUrgency, BudgetType } from '../../types/api-contracts';
import { LocationProvider } from '../../lib/location-provider';
import { useToast } from '../shared/ToastContext';
import { LocationSelectorInput } from '../shared/LocationSelectorInput';

interface PostJobWizardScreenProps {
  onBack?: () => void;
  onJobPublished?: (jobId: string) => void;
  initialData?: {
    title?: string;
    trade?: string;
    budget?: number;
    description?: string;
  };
}

interface LocalAttachment {
  localUri: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export const PostJobWizardScreen: React.FC<PostJobWizardScreenProps> = ({
  onBack,
  onJobPublished,
  initialData,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  // Live Categories Query
  const { data: dbCategories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: () => JobService.listCategories(),
  });

  const availableCategories = Array.isArray(dbCategories) && dbCategories.length > 0
    ? dbCategories
    : [
        { id: 2, name: 'Plumbing & Pipefitting' },
        { id: 1, name: 'Electrical & Solar' },
        { id: 3, name: 'Carpentry & Woodwork' },
        { id: 5, name: 'AC & Refrigeration' },
        { id: 6, name: 'Painting & Wall POP' },
        { id: 4, name: 'Masonry & Tiling' },
      ];

  // Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(2);
  const [trade, setTrade] = useState<string>(initialData?.trade || 'Plumbing & Pipefitting');
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [locationName, setLocationName] = useState<string>('Detecting location...');
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [locationSource, setLocationSource] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');

  // Budget & Outcome State
  const [pricingModel, setPricingModel] = useState<'FIXED' | 'RANGE' | 'HOURLY'>('FIXED');
  const [budgetAmount, setBudgetAmount] = useState<string>(
    initialData?.budget ? String(initialData.budget) : ''
  );
  const [budgetMinInput, setBudgetMinInput] = useState<string>('');
  const [budgetMaxInput, setBudgetMaxInput] = useState<string>('');
  const [expectedOutcome, setExpectedOutcome] = useState<string>('');
  const [materialsChoice, setMaterialsChoice] = useState<string>('Artisan provides verified parts');

  // Synchronize initial trade with category selection
  useEffect(() => {
    if (initialData?.trade) {
      const lower = initialData.trade.toLowerCase();
      if (lower.includes('electric') || lower.includes('solar') || lower.includes('wire')) {
        setSelectedCategoryId(1);
        setTrade('Electrical & Solar');
      } else if (lower.includes('plumb') || lower.includes('pipe') || lower.includes('drain')) {
        setSelectedCategoryId(2);
        setTrade('Plumbing & Pipefitting');
      } else if (lower.includes('carpent') || lower.includes('wood')) {
        setSelectedCategoryId(3);
        setTrade('Carpentry & Woodwork');
      } else if (lower.includes('mason') || lower.includes('tile') || lower.includes('screed')) {
        setSelectedCategoryId(4);
        setTrade('Masonry & Tiling');
      } else if (lower.includes('ac') || lower.includes('hvac') || lower.includes('condition') || lower.includes('cool')) {
        setSelectedCategoryId(5);
        setTrade('AC & Refrigeration');
      } else if (lower.includes('paint') || lower.includes('pop')) {
        setSelectedCategoryId(6);
        setTrade('Painting & Wall POP');
      }
    }
  }, [initialData?.trade]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const loc = await LocationProvider.getCurrentLocation();
        if (isMounted && loc.addressName) {
          setLocationName(loc.addressName);
          setCoords({ latitude: loc.latitude, longitude: loc.longitude });
          setLocationSource(loc.source || 'AUTO');
        }
      } catch (e) {
        // GPS detection failed: keep locationName empty or user-entered without silently overriding to Ikeja
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDetectGPS = async () => {
    try {
      setDetectingLocation(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const loc = await LocationProvider.getCurrentLocation();
      if (loc.addressName) {
        setLocationName(loc.addressName);
        setCoords({ latitude: loc.latitude, longitude: loc.longitude });
        setLocationSource(loc.source || 'GPS');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      showInfo('Location Notice', 'Could not lock GPS signal. You can type your address manually.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handlePickImage = async () => {
    if (attachments.length >= 4) {
      showWarning('Limit Reached', 'You can attach up to 4 photos to your job request.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const name = asset.fileName || `defect_${Date.now()}.jpg`;
      const mime = asset.mimeType || 'image/jpeg';
      const size = asset.fileSize || 450000;
      setAttachments((prev) => [
        ...prev,
        { localUri: asset.uri, fileName: name, fileSizeBytes: size, mimeType: mime },
      ]);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTakePhoto = async () => {
    if (attachments.length >= 4) {
      showWarning('Limit Reached', 'You can attach up to 4 photos to your job request.');
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showWarning('Camera Permission Required', 'Please enable camera permissions in settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const name = `camera_${Date.now()}.jpg`;
      setAttachments((prev) => [
        ...prev,
        { localUri: asset.uri, fileName: name, fileSizeBytes: asset.fileSize || 450000, mimeType: 'image/jpeg' },
      ]);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const parseFlexibleBudget = (val: string): number => {
    if (!val) return 0;
    const clean = val.toLowerCase().replace(/[^0-9.k]/g, '').trim();
    if (clean.endsWith('k')) {
      const num = parseFloat(clean.replace('k', ''));
      return isNaN(num) ? 0 : num * 1000;
    }
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep === 1) {
      if (!title.trim() || title.trim().length < 5) {
        showWarning('Job Title Required', 'Please provide a clear title of at least 5 characters describing what needs repair.');
        return;
      }
      if (!description.trim() || description.trim().length < 20) {
        showWarning('Description Required', 'Please give a short explanation of the fault (minimum 20 characters) so artisans can prepare quotes.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!locationName.trim()) {
        showWarning('Location Required', 'Please enter the repair address or area.');
        return;
      }
      setCurrentStep(3);
    } else {
      if (pricingModel === 'FIXED' || pricingModel === 'HOURLY') {
        const budgetNum = parseFlexibleBudget(budgetAmount);
        if (!budgetNum || budgetNum <= 0) {
          showWarning('Budget Required', 'Please enter your estimated budget or target rate.');
          return;
        }
      } else {
        const min = parseFlexibleBudget(budgetMinInput);
        const max = parseFlexibleBudget(budgetMaxInput);
        if (!min || !max || min <= 0 || max < min) {
          showWarning('Valid Range Required', 'Please enter valid minimum and maximum budget bounds.');
          return;
        }
      }
      handlePublish();
    }
  };


  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Upload Attachments if any
      const uploadedAttachments: Array<{ fileUrl: string; fileName: string; fileSizeBytes: number; mimeType: string }> = [];
      if (attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
          const item = attachments[i];
          setUploadProgressText(`Uploading photo ${i + 1} of ${attachments.length}...`);
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
          } catch (uploadErr: any) {
            console.error('[PostJobWizard] Image upload error:', uploadErr);
            const errorMsg = uploadErr?.response?.data?.message || uploadErr?.message || 'Network error during photo upload';
            showError('Photo Upload Failed', `Could not upload photo ${i + 1} (${item.fileName}): ${errorMsg}. Please check your connection or retry.`);
            setIsSubmitting(false);
            setUploadProgressText('');
            return;
          }
        }
      }

      setUploadProgressText('Publishing job request...');

      let budgetMin = 1000;
      let budgetMax = 1000;
      if (pricingModel === 'FIXED' || pricingModel === 'HOURLY') {
        const amt = parseFlexibleBudget(budgetAmount) || 1000;
        budgetMin = amt;
        budgetMax = amt;
      } else {
        budgetMin = parseFlexibleBudget(budgetMinInput) || 1000;
        budgetMax = parseFlexibleBudget(budgetMaxInput) || budgetMin;
      }

      const created = await JobService.create({
        categoryId: selectedCategoryId,
        title: title.trim(),
        description: description.trim(),
        trade,
        location: locationName.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        budget: budgetMax,
        budgetMin,
        budgetMax,
        budgetType: pricingModel === 'HOURLY' ? 'HOURLY' : 'FIXED',
        urgency: urgency as JobUrgency,
        expectedOutcome: expectedOutcome.trim() || undefined,
        materialsProvidedBy: materialsChoice || undefined,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccess(
        'Job Request Broadcasted!',
        'Your repair request is live. Verified artisans nearby will submit quotes with milestone breakdowns.'
      );
      if (created?.id) {
        onJobPublished?.(created.id);
      } else {
        onBack?.();
      }
    } catch (err: unknown) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = apiErr.response?.data?.message || apiErr.message || 'Failed to post job. Please check your connection and try again.';
      showError('Could Not Post Job', msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgressText('');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          onPress={currentStep > 1 ? () => setCurrentStep((prev) => prev - 1) : onBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Text style={[styles.backChevron, { color: themeColors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Post a Job Request</Text>
        <Text style={[styles.stepIndicatorText, isDark && { color: themeColors.primary }]}>
          Step {currentStep}/3 • {currentStep === 1 ? '35%' : currentStep === 2 ? '70%' : '95%'}
        </Text>
      </View>

      {/* Progress Track (Goal-Gradient Effect) */}
      <View style={[styles.progressTrack, { backgroundColor: themeColors.surfaceSubtle }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${currentStep === 1 ? 35 : currentStep === 2 ? 70 : 95}%` },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: SERVICE TRADE, DESCRIPTION & DEFECT PHOTOS */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepHeading, { color: themeColors.text }]}>What needs fixing?</Text>
            <Text style={[styles.stepSubtitle, { color: themeColors.textMuted }]}>
              Select the service trade and describe the problem in detail.
            </Text>

            {/* Dynamic Trade Categories Selector */}
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Trade Category</Text>
            <View style={styles.tradeGrid}>
              {availableCategories.map((item: any) => {
                const isSelected = selectedCategoryId === item.id || trade === item.name;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setSelectedCategoryId(item.id);
                      setTrade(item.name);
                    }}
                    style={[
                      styles.tradePill,
                      { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                      isSelected && styles.tradePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tradePillText,
                        { color: themeColors.textMuted },
                        isSelected && styles.tradePillTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title */}
            <Text style={[styles.inputLabel, { marginTop: 16, color: themeColors.text }]}>Job Title</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Inverter battery not holding charge"
              placeholderTextColor={themeColors.textMuted}
            />

            {/* Description */}
            <Text style={[styles.inputLabel, { marginTop: 16, color: themeColors.text }]}>Detailed Description</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                },
              ]}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe symptoms, when it started, and materials on site..."
              placeholderTextColor={themeColors.textMuted}
            />

            {/* Attach Defect Photos */}
            <Text style={[styles.inputLabel, { marginTop: 18, color: themeColors.text }]}>
              Defect Photos (Optional, {attachments.length}/4)
            </Text>
            <Text style={[styles.photoHint, { color: themeColors.textMuted }]}>
              Adding clear photos of the damage helps verified artisans diagnose and quote accurately.
            </Text>

            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={[
                  styles.photoActionBtn,
                  { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
                ]}
                activeOpacity={0.8}
              >
                <Camera size={16} color={themeColors.text} />
                <Text style={[styles.photoActionText, { color: themeColors.text }]}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickImage}
                style={[
                  styles.photoActionBtn,
                  { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
                ]}
                activeOpacity={0.8}
              >
                <ImageIcon size={16} color={themeColors.text} />
                <Text style={[styles.photoActionText, { color: themeColors.text }]}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* Attached Thumbnails Preview */}
            {attachments.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentsRow}>
                {attachments.map((item, idx) => (
                  <View key={idx} style={[styles.photoThumbWrap, { backgroundColor: themeColors.surfaceSubtle }]}>
                    <Image source={{ uri: item.localUri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      onPress={() => handleRemoveAttachment(idx)}
                      style={styles.removePhotoBadge}
                      activeOpacity={0.8}
                    >
                      <X size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* STEP 2: LOCATION & URGENCY */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepHeading, { color: themeColors.text }]}>Location & Timing</Text>
            <Text style={[styles.stepSubtitle, { color: themeColors.textMuted }]}>
              Set the repair address and how soon you need the artisan on site.
            </Text>

            {/* Dual-Mode High Precision Location Engine */}
            <LocationSelectorInput
              initialAddress={locationName && locationName !== 'Detecting location...' ? locationName : ''}
              initialCoords={coords}
              initialSource={locationSource === 'GPS' ? 'GPS' : 'MANUAL'}
              onChangeLocation={(loc) => {
                setLocationName(loc.address);
                if (loc.latitude && loc.longitude) {
                  setCoords({ latitude: loc.latitude, longitude: loc.longitude });
                }
                setLocationSource(loc.source);
              }}
            />

            {/* Urgency */}
            <Text style={[styles.inputLabel, { marginTop: 20, color: themeColors.text }]}>Urgency Level</Text>
            <View style={styles.urgencyCol}>
              {[
                {
                  key: 'EMERGENCY',
                  label: 'Emergency (Arrive ASAP within 1h)',
                  sub: 'Fastest bids from nearest online artisans',
                  icon: <AlertTriangle size={15} color="#EF4444" strokeWidth={2} />,
                },
                {
                  key: 'URGENT',
                  label: 'Urgent (Today)',
                  sub: 'Repair needed before end of day',
                  icon: <Clock size={15} color="#F59E0B" strokeWidth={2} />,
                },
                {
                  key: 'NORMAL',
                  label: 'Normal (Next Few Days)',
                  sub: 'Schedule at convenient time',
                  icon: <Calendar size={15} color="#10B981" strokeWidth={2} />,
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setUrgency(item.key as any)}
                  style={[
                    styles.urgencyCard,
                    { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                    urgency === item.key && [
                      styles.urgencyCardActive,
                      isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: themeColors.primary },
                    ],
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {item.icon}
                    <Text
                      style={[
                        styles.urgencyLabel,
                        { color: themeColors.text },
                        urgency === item.key && [
                          styles.urgencyLabelActive,
                          isDark && { color: themeColors.primary },
                        ],
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <Text style={[styles.urgencySub, { color: themeColors.textMuted }]}>{item.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 3: BUDGET & ESCROW SETUP */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepHeading, { color: themeColors.text }]}>Budget & Escrow Protection</Text>
            <Text style={[styles.stepSubtitle, { color: themeColors.textMuted }]}>
              Set your target budget. Funds will only be locked in escrow when you approve a bid.
            </Text>

            {/* Budget Type Selector */}
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Pricing Model</Text>
            <View style={styles.budgetTypeTabs}>
              {[
                { key: 'FIXED', label: 'Fixed Price' },
                { key: 'RANGE', label: 'Price Range' },
                { key: 'HOURLY', label: 'Hourly Rate' },
              ].map((b) => (
                <TouchableOpacity
                  key={b.key}
                  onPress={() => setPricingModel(b.key as any)}
                  style={[
                    styles.budgetTypeTab,
                    { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                    pricingModel === b.key && styles.budgetTypeTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.budgetTypeTabText,
                      { color: themeColors.textMuted },
                      pricingModel === b.key && styles.budgetTypeTabTextActive,
                    ]}
                  >
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conditional Budget Inputs */}
            {pricingModel === 'RANGE' ? (
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>Estimated Budget Range (NGN)</Text>
                <View style={styles.budgetRangeRow}>
                  <View style={[styles.rangeInputWrap, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder }]}>
                    <Text style={[styles.rangeLabel, { color: themeColors.textMuted }]}>Min (₦)</Text>
                    <TextInput
                      style={[styles.rangeInput, isDark && { color: themeColors.primary }]}
                      keyboardType="numeric"
                      value={budgetMinInput}
                      onChangeText={setBudgetMinInput}
                      placeholder="e.g. 15000"
                      placeholderTextColor={themeColors.textMuted}
                    />
                  </View>
                  <Text style={[styles.rangeDivider, { color: themeColors.textMuted }]}>to</Text>
                  <View style={[styles.rangeInputWrap, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder }]}>
                    <Text style={[styles.rangeLabel, { color: themeColors.textMuted }]}>Max (₦)</Text>
                    <TextInput
                      style={[styles.rangeInput, isDark && { color: themeColors.primary }]}
                      keyboardType="numeric"
                      value={budgetMaxInput}
                      onChangeText={setBudgetMaxInput}
                      placeholder="e.g. 35000"
                      placeholderTextColor={themeColors.textMuted}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                  {pricingModel === 'HOURLY' ? 'Target Hourly Rate (NGN/hr)' : 'Target Fixed Budget (NGN)'}
                </Text>
                <View style={[styles.budgetInputBox, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder }]}>
                  <Text style={[styles.nairaPrefix, isDark && { color: themeColors.primary }]}>₦</Text>
                  <TextInput
                    style={[styles.budgetInput, isDark && { color: themeColors.primary }]}
                    keyboardType="numeric"
                    value={budgetAmount}
                    onChangeText={setBudgetAmount}
                    placeholder="e.g. 25000"
                    placeholderTextColor={themeColors.textMuted}
                  />
                </View>

                {/* Quick Budget Presets (Parkinson's Law / Postel's Law) */}
                <View style={styles.quickBudgetChipsRow}>
                  {['15000', '25000', '50000', '100000'].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setBudgetAmount(amt);
                      }}
                      style={[
                        styles.quickBudgetChip,
                        { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                        budgetAmount === amt && [
                          styles.quickBudgetChipActive,
                          isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: themeColors.primary },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickBudgetChipText,
                          { color: themeColors.textMuted },
                          budgetAmount === amt && [
                            styles.quickBudgetChipTextActive,
                            isDark && { color: themeColors.primary },
                          ],
                        ]}
                      >
                        {formatCurrency(Number(amt))}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Materials Supply Responsibility */}
            <Text style={[styles.inputLabel, { marginTop: 20, color: themeColors.text }]}>Materials & Replacement Parts</Text>
            <View style={styles.materialsRow}>
              {[
                'Artisan provides verified parts',
                'Client supplies all materials',
                'Split / Negotiable on site',
              ].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setMaterialsChoice(opt)}
                  style={[
                    styles.materialChip,
                    { backgroundColor: themeColors.surfaceSubtle, borderColor: themeColors.border },
                    materialsChoice === opt && [
                      styles.materialChipActive,
                      isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)', borderColor: themeColors.primary },
                    ],
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {materialsChoice === opt && <Check size={12} color={isDark ? themeColors.primary : colors.brand.forest} strokeWidth={2.8} />}
                    <Text
                      style={[
                        styles.materialChipText,
                        { color: themeColors.textMuted },
                        materialsChoice === opt && [
                          styles.materialChipTextActive,
                          isDark && { color: themeColors.primary },
                        ],
                      ]}
                    >
                      {opt}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Expected Outcome */}
            <Text style={[styles.inputLabel, { marginTop: 20, color: themeColors.text }]}>Expected Outcome (Optional)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  minHeight: 60,
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                },
              ]}
              value={expectedOutcome}
              onChangeText={setExpectedOutcome}
              placeholder="e.g. Tested leak-free, clean workspace handover"
              placeholderTextColor={themeColors.textMuted}
            />

            {/* Escrow Guarantee Notice */}
            <View
              style={[
                styles.escrowNoticeCard,
                isDark && {
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  borderColor: 'rgba(52, 211, 153, 0.25)',
                },
              ]}
            >
              <ShieldCheck size={20} color={isDark ? '#34D399' : '#10B981'} style={{ marginTop: 2 }} />
              <View style={styles.escrowTextCol}>
                <Text style={[styles.escrowNoticeTitle, isDark && { color: '#34D399' }]}>Zero-Trust Smart Escrow</Text>
                <Text style={[styles.escrowNoticeSub, { color: themeColors.textMuted }]}>
                  You do not pay anything right now. Once artisans submit proposals, you select your
                  preferred bid and fund the first milestone into secure escrow.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Next / Publish Button */}
      <View style={[styles.stickyFooter, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        {uploadProgressText ? (
          <View style={styles.uploadProgressNotice}>
            <ActivityIndicator size="small" color={isDark ? themeColors.primary : colors.brand.forest} />
            <Text style={[styles.uploadProgressText, isDark && { color: themeColors.primary }]}>{uploadProgressText}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSubmitting}
          onPress={handleNext}
          style={[styles.nextBtn, isSubmitting && { opacity: 0.7 }]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.nextBtnText}>
              {currentStep === 3 ? 'Publish Job to Marketplace ›' : 'Continue to Next Step ›'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  stepIndicatorText: {
    fontSize: typography.size.xs,
    color: colors.brand.emeraldDark,
    fontWeight: '700',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.emerald,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 100,
  },
  stepContainer: {
    marginTop: spacing.base,
  },
  stepHeading: {
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  stepSubtitle: {
    fontSize: typography.size.xs + 1,
    color: colors.neutral[500],
    marginTop: 4,
    marginBottom: spacing.base,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: typography.size.xs + 1,
    fontWeight: '700',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  tradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tradePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tradePillActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  tradePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  tradePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.size.sm,
    color: colors.neutral[900],
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  gpsIconText: {
    fontSize: 11,
  },
  gpsDetectText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  locationSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  locationSourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.forest,
  },
  locationSourceText: {
    fontSize: 10,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  locationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
  },
  pinEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: typography.size.sm,
    color: colors.neutral[900],
  },
  urgencyCol: {
    gap: 10,
  },
  urgencyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urgencyCardActive: {
    borderColor: colors.brand.forest,
    backgroundColor: '#F0FDF4',
  },
  urgencyLabel: {
    fontSize: typography.size.sm,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  urgencyLabelActive: {
    color: colors.brand.forest,
  },
  urgencySub: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  budgetInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brand.forest,
    paddingHorizontal: 14,
  },
  nairaPrefix: {
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.brand.forest,
    marginRight: 6,
  },
  budgetInput: {
    flex: 1,
    fontSize: typography.size.xl,
    fontWeight: '900',
    color: colors.brand.forest,
    paddingVertical: 12,
  },
  escrowNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: spacing.base,
    borderRadius: radius.xl,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 12,
  },
  shieldEmoji: {
    fontSize: 24,
  },
  escrowTextCol: {
    flex: 1,
  },
  escrowNoticeTitle: {
    fontSize: typography.size.xs + 1,
    fontWeight: '800',
    color: colors.brand.forest,
  },
  escrowNoticeSub: {
    fontSize: 11,
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: 16,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  nextBtn: {
    backgroundColor: colors.brand.forest,
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    ...shadows.base,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm + 1,
    fontWeight: '800',
  },
  photoHint: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 8,
    lineHeight: 16,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photoActionIcon: {
    fontSize: 14,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  attachmentsRow: {
    gap: 10,
    marginTop: 6,
    paddingBottom: 4,
  },
  photoThumbWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  budgetTypeTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  budgetTypeTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  budgetTypeTabActive: {
    backgroundColor: colors.brand.forest,
    borderColor: colors.brand.forest,
  },
  budgetTypeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  budgetTypeTabTextActive: {
    color: '#FFFFFF',
  },
  budgetRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeInputWrap: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rangeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.neutral[500],
    marginBottom: 2,
  },
  rangeInput: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.brand.forest,
    paddingVertical: 4,
  },
  rangeDivider: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[400],
  },
  materialsRow: {
    gap: 8,
  },
  materialChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  materialChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.brand.forest,
  },
  materialChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  materialChipTextActive: {
    color: colors.brand.forest,
    fontWeight: '800',
  },
  uploadProgressNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  uploadProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand.forest,
  },
  quickBudgetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickBudgetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickBudgetChipActive: {
    backgroundColor: colors.brand.emeraldLight,
    borderColor: colors.brand.emerald,
  },
  quickBudgetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  quickBudgetChipTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
});

