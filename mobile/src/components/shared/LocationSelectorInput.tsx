import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { Navigation, MapPin, RotateCw, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react-native';
import { colors, radius, spacing, typography, useTheme } from '../../theme';
import { LocationProvider, GeoCoordinate } from '../../lib/location-provider';

export interface LocationSelection {
  address: string;
  state?: string;
  lgaCity?: string;
  latitude?: number;
  longitude?: number;
  source: 'GPS' | 'MANUAL';
  accuracy?: number;
}

interface LocationSelectorInputProps {
  initialAddress?: string;
  initialCoords?: { latitude?: number; longitude?: number };
  initialSource?: 'GPS' | 'MANUAL';
  onChangeLocation: (location: LocationSelection) => void;
  label?: string;
  required?: boolean;
}

const NIGERIAN_STATES = [
  'Lagos',
  'Abuja FCT',
  'Rivers',
  'Ogun',
  'Oyo',
  'Kano',
  'Kaduna',
  'Edo',
  'Delta',
  'Enugu',
  'Anambra',
  'Akwa Ibom',
  'Cross River',
  'Ondo',
  'Kwara',
  'Plateau',
  'Imo',
  'Abia',
];

const LGAS_BY_STATE: Record<string, string[]> = {
  'Lagos': [
    'Ikeja',
    'Eti-Osa (Lekki / V.I / Ikoyi)',
    'Surulere',
    'Alimosho',
    'Kosofe (Gbagada / Ogudu)',
    'Lagos Island',
    'Lagos Mainland (Yaba)',
    'Oshodi-Isolo',
    'Ikorodu',
    'Agege',
    'Ifako-Ijaiye',
    'Amuwo-Odofin (Festac)',
    'Apapa',
    'Shomolu',
    'Mushin',
    'Ojo',
    'Badagry',
    'Epe',
  ],
  'Abuja FCT': [
    'Municipal (AMAC / Central / Garki / Wuse / Maitama)',
    'Bwari (Kubwa / Dutse)',
    'Gwagwalada',
    'Kuje',
    'Kwali',
    'Abaji',
  ],
  'Rivers': [
    'Port Harcourt',
    'Obio-Akpor',
    'Eleme',
    'Ikwerre',
    'Oyigbo',
    'Okrika',
  ],
  'Oyo': [
    'Ibadan North',
    'Ibadan North-East',
    'Ibadan North-West',
    'Ibadan South-East',
    'Ibadan South-West',
    'Oyo East',
    'Ogbomosho North',
  ],
  'Ogun': [
    'Abeokuta South',
    'Abeokuta North',
    'Ado-Odo/Ota',
    'Sagamu',
    'Ijebu Ode',
    'Obafemi Owode (Mowe / Ibafo)',
  ],
};

const DEFAULT_STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Lagos': { lat: 6.5244, lng: 3.3792 },
  'Abuja FCT': { lat: 9.0765, lng: 7.3986 },
  'Rivers': { lat: 4.8156, lng: 7.0498 },
  'Oyo': { lat: 7.3775, lng: 3.9470 },
  'Ogun': { lat: 7.1557, lng: 3.3451 },
  'Kano': { lat: 12.0022, lng: 8.5919 },
  'Kaduna': { lat: 10.5105, lng: 7.4165 },
  'Edo': { lat: 6.3350, lng: 5.6037 },
  'Delta': { lat: 5.5325, lng: 5.8987 },
  'Enugu': { lat: 6.4584, lng: 7.5464 },
};

export const LocationSelectorInput: React.FC<LocationSelectorInputProps> = ({
  initialAddress = '',
  initialCoords,
  initialSource = 'GPS',
  onChangeLocation,
  label = 'Job Site Location',
  required = true,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [mode, setMode] = useState<'GPS' | 'MANUAL'>(initialSource);
  const [detectingGps, setDetectingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // GPS State
  const [detectedLocation, setDetectedLocation] = useState<GeoCoordinate | null>(null);

  // Manual State
  const [selectedState, setSelectedState] = useState<string>('Lagos');
  const [selectedLga, setSelectedLga] = useState<string>('Ikeja');
  const [areaLandmark, setAreaLandmark] = useState<string>(initialAddress);

  // Picker Modals
  const [showStatePicker, setShowStatePicker] = useState<boolean>(false);
  const [showLgaPicker, setShowLgaPicker] = useState<boolean>(false);

  // Initial trigger for GPS if mode is GPS and no initialAddress
  useEffect(() => {
    if (initialAddress && initialSource === 'MANUAL') {
      setAreaLandmark(initialAddress);
      setMode('MANUAL');
    }
  }, [initialAddress, initialSource]);

  const handleDetectGps = useCallback(async () => {
    try {
      setDetectingGps(true);
      setGpsError(null);
      const loc = await LocationProvider.getCurrentLocation(true);
      if (loc && loc.addressName) {
        setDetectedLocation(loc);
        onChangeLocation({
          address: loc.addressName,
          state: loc.state,
          lgaCity: loc.city,
          latitude: loc.latitude,
          longitude: loc.longitude,
          source: 'GPS',
          accuracy: loc.accuracy,
        });
      } else {
        throw new Error('Location coordinates resolved without address name');
      }
    } catch (err: any) {
      setGpsError('Could not lock accurate GPS signal. Switched to manual input.');
      setMode('MANUAL');
    } finally {
      setDetectingGps(false);
    }
  }, [onChangeLocation]);

  const emitManualLocation = useCallback((state: string, lga: string, landmark: string) => {
    const cleanLandmark = landmark.trim();
    const fullAddress = cleanLandmark
      ? `${cleanLandmark}, ${lga}, ${state} State`
      : `${lga}, ${state} State`;

    const fallbackCoord = DEFAULT_STATE_COORDS[state] || DEFAULT_STATE_COORDS['Lagos'];

    onChangeLocation({
      address: fullAddress,
      state,
      lgaCity: lga,
      latitude: fallbackCoord.lat,
      longitude: fallbackCoord.lng,
      source: 'MANUAL',
    });
  }, [onChangeLocation]);

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    const availableLgas = LGAS_BY_STATE[state] || ['Central District', 'Metropolis'];
    const defaultLga = availableLgas[0];
    setSelectedLga(defaultLga);
    setShowStatePicker(false);
    emitManualLocation(state, defaultLga, areaLandmark);
  };

  const handleLgaSelect = (lga: string) => {
    setSelectedLga(lga);
    setShowLgaPicker(false);
    emitManualLocation(selectedState, lga, areaLandmark);
  };

  const handleLandmarkChange = (text: string) => {
    setAreaLandmark(text);
    emitManualLocation(selectedState, selectedLga, text);
  };

  const availableLgas = LGAS_BY_STATE[selectedState] || [
    'Central District',
    'North District',
    'South District',
    'East District',
    'West District',
  ];

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: themeColors.text }]}>
          {label} {required && <Text style={styles.requiredAsterisk}>*</Text>}
        </Text>
        <Text style={[styles.subtext, { color: themeColors.textMuted }]}>Used to match nearby certified artisans</Text>
      </View>

      {/* Segmented Mode Switcher */}
      <View style={[styles.modeTabs, { backgroundColor: themeColors.surfaceSubtle }]}>
        <TouchableOpacity
          style={[styles.tabButton, mode === 'GPS' && [styles.tabButtonActive, { backgroundColor: themeColors.primary }]]}
          onPress={() => {
            setMode('GPS');
            if (!detectedLocation) {
              handleDetectGps();
            } else {
              onChangeLocation({
                address: detectedLocation.addressName || 'Detected GPS Location',
                state: detectedLocation.state,
                lgaCity: detectedLocation.city,
                latitude: detectedLocation.latitude,
                longitude: detectedLocation.longitude,
                source: 'GPS',
                accuracy: detectedLocation.accuracy,
              });
            }
          }}
          activeOpacity={0.8}
        >
          <Navigation size={15} color={mode === 'GPS' ? '#FFFFFF' : themeColors.textMuted} strokeWidth={1.85} />
          <Text style={[styles.tabButtonText, { color: themeColors.textMuted }, mode === 'GPS' && styles.tabButtonTextActive]}>
            Pinpoint GPS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, mode === 'MANUAL' && [styles.tabButtonActive, { backgroundColor: themeColors.primary }]]}
          onPress={() => {
            setMode('MANUAL');
            emitManualLocation(selectedState, selectedLga, areaLandmark);
          }}
          activeOpacity={0.8}
        >
          <MapPin size={15} color={mode === 'MANUAL' ? '#FFFFFF' : themeColors.textMuted} strokeWidth={1.85} />
          <Text style={[styles.tabButtonText, { color: themeColors.textMuted }, mode === 'MANUAL' && styles.tabButtonTextActive]}>
            Manual Entry
          </Text>
        </TouchableOpacity>
      </View>

      {gpsError && (
        <View style={[styles.errorNoticeBox, isDark && { backgroundColor: '#451A03', borderColor: '#78350F' }]}>
          <AlertCircle size={14} color={isDark ? '#F59E0B' : '#B45309'} strokeWidth={1.85} />
          <Text style={[styles.errorNoticeText, isDark && { color: '#FCD34D' }]}>{gpsError}</Text>
        </View>
      )}

      {/* Mode A: GPS Auto-Detect */}
      {mode === 'GPS' && (
        <View style={styles.gpsContainer}>
          {detectingGps ? (
            <View style={[styles.detectingBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <ActivityIndicator color={themeColors.primary} size="small" />
              <Text style={[styles.detectingText, { color: themeColors.textMuted }]}>Connecting to satellite signal & reverse geocoding...</Text>
            </View>
          ) : detectedLocation ? (
            <View style={[styles.resolvedGpsCard, { backgroundColor: themeColors.surface, borderColor: isDark ? '#059669' : '#A7F3D0' }]}>
              <View style={styles.gpsCardHeader}>
                <View style={[styles.gpsVerifiedBadge, isDark && { backgroundColor: '#064E3B' }]}>
                  <CheckCircle2 size={13} color={isDark ? '#34D399' : '#059669'} strokeWidth={2} />
                  <Text style={[styles.gpsVerifiedText, isDark && { color: '#34D399' }]}>GPS Locked</Text>
                </View>
                {detectedLocation.accuracy != null && (
                  <Text style={[styles.accuracyPill, { color: themeColors.textMuted }]}>
                    ±{Math.round(detectedLocation.accuracy)}m accuracy
                  </Text>
                )}
              </View>

              <Text style={[styles.resolvedAddressTitle, { color: themeColors.text }]}>
                {detectedLocation.addressName || 'Current Location'}
              </Text>
              <Text style={[styles.resolvedAddressMeta, { color: themeColors.textMuted }]}>
                Lat: {detectedLocation.latitude?.toFixed(4)}, Lng: {detectedLocation.longitude?.toFixed(4)}
              </Text>

              <TouchableOpacity
                style={styles.reDetectButton}
                onPress={handleDetectGps}
                activeOpacity={0.8}
              >
                <RotateCw size={13} color={isDark ? '#34D399' : colors.brand.forest} strokeWidth={1.85} />
                <Text style={[styles.reDetectButtonText, { color: isDark ? '#34D399' : colors.brand.forest }]}>Re-detect GPS Coordinates</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.detectTriggerBtn, { backgroundColor: themeColors.primary }]}
              onPress={handleDetectGps}
              activeOpacity={0.85}
            >
              <Navigation size={18} color="#FFFFFF" strokeWidth={1.85} />
              <Text style={styles.detectTriggerBtnText}>Detect Current Location via GPS</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Mode B: Manual Selection */}
      {mode === 'MANUAL' && (
        <View style={styles.manualContainer}>
          {/* State & LGA Row */}
          <View style={styles.cascadeRow}>
            {/* State Picker */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.miniLabel, { color: themeColors.textMuted }]}>State</Text>
              <TouchableOpacity
                style={[styles.dropdownBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                onPress={() => setShowStatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownBtnText, { color: themeColors.text }]}>{selectedState}</Text>
                <ChevronDown size={14} color={themeColors.textMuted} strokeWidth={1.85} />
              </TouchableOpacity>
            </View>

            {/* LGA Picker */}
            <View style={{ flex: 1.3 }}>
              <Text style={[styles.miniLabel, { color: themeColors.textMuted }]}>LGA / District</Text>
              <TouchableOpacity
                style={[styles.dropdownBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                onPress={() => setShowLgaPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownBtnText, { color: themeColors.text }]} numberOfLines={1}>
                  {selectedLga}
                </Text>
                <ChevronDown size={14} color={themeColors.textMuted} strokeWidth={1.85} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Granular Area / Landmark / Street Input */}
          <View style={{ marginTop: spacing.sm }}>
            <Text style={[styles.miniLabel, { color: themeColors.textMuted }]}>Specific Landmark, Estate, or Street</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: themeColors.inputBg, borderColor: themeColors.inputBorder, color: themeColors.text }]}
              placeholder="e.g., Admiralty Way, Opposite Ebeano Supermarket"
              placeholderTextColor={themeColors.textMuted}
              value={areaLandmark}
              onChangeText={handleLandmarkChange}
            />
          </View>
        </View>
      )}

      {/* State Picker Modal */}
      <Modal visible={showStatePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatePicker(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#34D399' : colors.brand.forest, borderBottomColor: themeColors.border }]}>Select State</Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {NIGERIAN_STATES.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.modalItem, { borderBottomColor: themeColors.border }, selectedState === st && [styles.modalItemActive, isDark && { backgroundColor: '#064E3B' }]]}
                  onPress={() => handleStateSelect(st)}
                >
                  <Text style={[styles.modalItemText, { color: themeColors.text }, selectedState === st && [styles.modalItemTextActive, isDark && { color: '#34D399' }]]}>
                    {st}
                  </Text>
                  {selectedState === st && <CheckCircle2 size={16} color={isDark ? '#34D399' : colors.brand.forest} strokeWidth={2} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* LGA Picker Modal */}
      <Modal visible={showLgaPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLgaPicker(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#34D399' : colors.brand.forest, borderBottomColor: themeColors.border }]}>Select LGA / District in {selectedState}</Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {availableLgas.map((lga) => (
                <TouchableOpacity
                  key={lga}
                  style={[styles.modalItem, { borderBottomColor: themeColors.border }, selectedLga === lga && [styles.modalItemActive, isDark && { backgroundColor: '#064E3B' }]]}
                  onPress={() => handleLgaSelect(lga)}
                >
                  <Text style={[styles.modalItemText, { color: themeColors.text }, selectedLga === lga && [styles.modalItemTextActive, isDark && { color: '#34D399' }]]}>
                    {lga}
                  </Text>
                  {selectedLga === lga && <CheckCircle2 size={16} color={isDark ? '#34D399' : colors.brand.forest} strokeWidth={2} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  headerRow: {
    marginBottom: 6,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  requiredAsterisk: {
    color: colors.status.danger,
  },
  subtext: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.sm,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radius.sm,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.brand.forest,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: spacing.sm,
    gap: 6,
  },
  errorNoticeText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  gpsContainer: {
    marginTop: 2,
  },
  detectingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  detectingText: {
    fontSize: 12,
    color: colors.neutral[600],
    flex: 1,
  },
  resolvedGpsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  gpsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gpsVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  gpsVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  accuracyPill: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  resolvedAddressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    lineHeight: 20,
  },
  resolvedAddressMeta: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
    marginBottom: 8,
  },
  reDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 4,
  },
  reDetectButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.forest,
  },
  detectTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.forest,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 8,
  },
  detectTriggerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manualContainer: {
    marginTop: 2,
  },
  cascadeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 4,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownBtnText: {
    fontSize: 13,
    color: colors.neutral[900],
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.neutral[900],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.base,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brand.forest,
    marginBottom: spacing.sm,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemActive: {
    backgroundColor: '#ECFDF5',
    borderRadius: radius.sm,
  },
  modalItemText: {
    fontSize: 13,
    color: colors.neutral[800],
    fontWeight: '500',
  },
  modalItemTextActive: {
    color: colors.brand.forest,
    fontWeight: '700',
  },
});
