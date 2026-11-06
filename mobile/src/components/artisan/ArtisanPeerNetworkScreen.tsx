import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Image,
  Linking,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Search,
  MapPin,
  Star,
  ShieldCheck,
  UserPlus,
  PhoneCall,
  Briefcase,
  Users,
  X,
  FileText,
  Send,
} from 'lucide-react-native';
import { colors, radius, spacing, typography, shadows, touchTargets } from '../../theme';
import { useToast } from '../shared/ToastContext';
import { LocationProvider } from '../../lib/location-provider';
import { PeerService, PeerArtisan } from '../../services/peer.service';
import { ContractService } from '../../services/contract.service';
import { ContractRecord } from '../../types/api-contracts';
import { usePeerSubcontract } from '../../hooks';

const FALLBACK_PEERS: PeerArtisan[] = [
  {
    id: 'peer-1',
    fullName: 'Babatunde Fashola',
    trade: 'Master Plumber & Pipefitter',
    rating: 4.9,
    completedJobs: 142,
    locationCity: 'Surulere, Lagos',
    distanceKm: 3.2,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isKycVerified: true,
    isAvailableForSubcontract: true,
    phone: '+2348012345678',
  },
  {
    id: 'peer-2',
    fullName: 'Emeka Nwosu',
    trade: 'Industrial & Solar Electrician',
    rating: 4.8,
    completedJobs: 98,
    locationCity: 'Ikeja, Lagos',
    distanceKm: 5.6,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    isKycVerified: true,
    isAvailableForSubcontract: true,
    phone: '+2348023456789',
  },
  {
    id: 'peer-3',
    fullName: 'Kehinde Adeleke',
    trade: 'HVAC & Refrigeration Tech',
    rating: 5.0,
    completedJobs: 115,
    locationCity: 'Lekki Phase 1, Lagos',
    distanceKm: 8.4,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    isKycVerified: true,
    isAvailableForSubcontract: false,
    phone: '+2348034567890',
  },
  {
    id: 'peer-4',
    fullName: 'Chidi Okonkwo',
    trade: 'Carpentry & Roofing Specialist',
    rating: 4.7,
    completedJobs: 76,
    locationCity: 'Yaba, Lagos',
    distanceKm: 4.1,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isKycVerified: true,
    isAvailableForSubcontract: true,
    phone: '+2348045678901',
  },
  {
    id: 'peer-5',
    fullName: 'Saheed Balogun',
    trade: 'Masonry & Tiling Expert',
    rating: 4.8,
    completedJobs: 89,
    locationCity: 'Gbagada, Lagos',
    distanceKm: 6.0,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    isKycVerified: false,
    isAvailableForSubcontract: true,
    phone: '+2348056789012',
  },
];

const TRADE_FILTERS = ['All Peers', 'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Masonry'];

interface ArtisanPeerNetworkScreenProps {
  onBack?: () => void;
  onSelectPeer?: (peerId: string) => void;
}

export const ArtisanPeerNetworkScreen: React.FC<ArtisanPeerNetworkScreenProps> = ({
  onBack,
  onSelectPeer,
}) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('All Peers');
  const [peers, setPeers] = useState<PeerArtisan[]>(FALLBACK_PEERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subcontract modal state
  const [selectedPeerForSubcontract, setSelectedPeerForSubcontract] = useState<PeerArtisan | null>(null);
  const [myContracts, setMyContracts] = useState<ContractRecord[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [subcontractTitle, setSubcontractTitle] = useState('');
  const [subcontractScope, setSubcontractScope] = useState('');
  const [subcontractAmount, setSubcontractAmount] = useState('');
  const [isSubmittingSubcontract, setIsSubmittingSubcontract] = useState(false);
  const peerSubcontractMutation = usePeerSubcontract();

  const fetchPeers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const geo = await LocationProvider.getCurrentLocation().catch(() => null);
      const res = await PeerService.getPeerDirectory({
        search: searchQuery.trim() || undefined,
        trade: selectedTrade !== 'All Peers' ? selectedTrade : undefined,
        lat: geo?.latitude,
        lng: geo?.longitude,
      });

      if (res && res.peers && res.peers.length > 0) {
        setPeers(res.peers);
      } else if (!searchQuery.trim() && selectedTrade === 'All Peers') {
        // Fallback to initial verified peers if database has few seed items
        setPeers(FALLBACK_PEERS);
      } else {
        setPeers([]);
      }
    } catch {
      // Offline fallback
      if (!searchQuery.trim() && selectedTrade === 'All Peers') {
        setPeers(FALLBACK_PEERS);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedTrade]);

  useEffect(() => {
    fetchPeers();
  }, [fetchPeers]);

  const handleRefresh = () => {
    fetchPeers(true);
  };

  const openSubcontractModal = async (peer: PeerArtisan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPeerForSubcontract(peer);
    setSubcontractTitle(`Subcontract: ${peer.trade}`);
    setSubcontractScope('');
    setSubcontractAmount('');

    try {
      const contracts = await ContractService.getMyContracts('ARTISAN');
      const activeContracts = (contracts || []).filter(
        (c) => c.status === 'ACTIVE'
      );
      setMyContracts(activeContracts);
      if (activeContracts.length > 0) {
        setSelectedContractId(activeContracts[0].id);
      }
    } catch {
      setMyContracts([]);
    }
  };

  const handleSendSubcontract = async () => {
    if (!selectedPeerForSubcontract) return;
    if (!subcontractTitle.trim()) {
      showError('Missing Information', 'Please provide a title for the subcontract task.');
      return;
    }
    if (!subcontractScope.trim()) {
      showError('Missing Information', 'Please describe the scope of work for the peer artisan.');
      return;
    }
    const parsedAmount = parseFloat(subcontractAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showError('Invalid Amount', 'Please provide a valid compensation amount in ₦.');
      return;
    }

    const contractId = selectedContractId || (myContracts.length > 0 ? myContracts[0].id : 'temp-contract');
    const peerName = selectedPeerForSubcontract.fullName;

    // Instant modal dismissal and confirmation (Doherty Threshold <50ms)
    setSelectedPeerForSubcontract(null);
    showSuccess(
      'Subcontract Sent!',
      `Proposal delivered to ${peerName}. You will be notified when accepted.`
    );

    peerSubcontractMutation.mutate(
      {
        contractId,
        subArtisanId: selectedPeerForSubcontract.id,
        title: subcontractTitle.trim(),
        scope: subcontractScope.trim(),
        agreedAmount: parsedAmount,
      },
      {
        onError: (err: any) => {
          showError('Subcontract Error', err?.message || 'Could not send subcontract.');
        },
      }
    );
  };

  const handleCall = (peer: PeerArtisan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (peer.phone) {
      Linking.openURL(`tel:${peer.phone}`);
    } else {
      showInfo('Contact Info', 'Contact details are available once connection or subcontract is accepted.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack();
            }}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={colors.neutral[100]} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Peer Network</Text>
          <Text style={styles.headerSubtitle}>Subcontract & collaborate with verified artisans</Text>
        </View>
        <View style={styles.networkBadge}>
          <Users size={14} color="#10B981" />
          <Text style={styles.networkBadgeText}>{peers.length}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={18} color={colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search peers by trade, name, or area..."
          placeholderTextColor={colors.neutral[500]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Trade Filter Bar */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          data={TRADE_FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedTrade === item;
            return (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTrade(item);
                }}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Peers List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Locating nearby verified peers...</Text>
        </View>
      ) : (
        <FlatList
          data={peers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#10B981"
              colors={['#10B981']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color={colors.neutral[600]} />
              <Text style={styles.emptyTitle}>No Peers Found</Text>
              <Text style={styles.emptySubtitle}>
                No verified artisans matched your trade or location filters. Try broadening your search.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.peerCard}>
              <View style={styles.peerHeaderRow}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.peerAvatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {item.fullName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.peerMainInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.peerName} numberOfLines={1}>
                      {item.fullName}
                    </Text>
                    {item.isKycVerified && (
                      <ShieldCheck size={15} color="#10B981" style={{ marginLeft: 4 }} />
                    )}
                  </View>

                  <Text style={styles.peerTrade} numberOfLines={1}>
                    {item.trade}
                  </Text>

                  <View style={styles.locStatsRow}>
                    <View style={styles.locRow}>
                      <MapPin size={12} color={colors.neutral[400]} />
                      <Text style={styles.locText} numberOfLines={1}>
                        {item.locationCity} • {item.distanceKm} km
                      </Text>
                    </View>

                    <View style={styles.starRow}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.starText}>{item.rating.toFixed(1)}</Text>
                      <Text style={styles.jobsCountText}>({item.completedJobs} jobs)</Text>
                    </View>
                  </View>
                </View>

                {item.isAvailableForSubcontract ? (
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>Available</Text>
                  </View>
                ) : (
                  <View style={styles.busyBadge}>
                    <Text style={styles.busyBadgeText}>Busy</Text>
                  </View>
                )}
              </View>

              <View style={styles.peerActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.connectButton,
                    !item.isAvailableForSubcontract && styles.connectButtonDisabled,
                  ]}
                  onPress={() => openSubcontractModal(item)}
                  activeOpacity={0.8}
                >
                  <Briefcase size={15} color="#071A11" />
                  <Text style={styles.connectButtonText}>Subcontract Task</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(item)}
                  activeOpacity={0.7}
                >
                  <PhoneCall size={16} color="#10B981" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Subcontract Proposal Modal */}
      <Modal
        visible={!!selectedPeerForSubcontract}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPeerForSubcontract(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Propose Subcontract</Text>
                <Text style={styles.modalSubtitle}>
                  Collaborate with {selectedPeerForSubcontract?.fullName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPeerForSubcontract(null)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {/* Task Title */}
              <Text style={styles.inputLabel}>Task Title</Text>
              <TextInput
                style={styles.modalInput}
                value={subcontractTitle}
                onChangeText={setSubcontractTitle}
                placeholder="e.g. Electrical conduit wiring & DB install"
                placeholderTextColor={colors.neutral[500]}
              />

              {/* Scope of Work */}
              <Text style={styles.inputLabel}>Scope of Work & Deliverables</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={subcontractScope}
                onChangeText={setSubcontractScope}
                placeholder="Describe exact tasks, materials required, and completion deadline..."
                placeholderTextColor={colors.neutral[500]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Compensation Amount */}
              <Text style={styles.inputLabel}>Agreed Compensation (₦ NGN)</Text>
              <TextInput
                style={styles.modalInput}
                value={subcontractAmount}
                onChangeText={setSubcontractAmount}
                placeholder="e.g. 85000"
                placeholderTextColor={colors.neutral[500]}
                keyboardType="numeric"
              />

              {/* Parent Contract Selector */}
              {myContracts.length > 0 && (
                <View style={styles.contractsSelectorContainer}>
                  <Text style={styles.inputLabel}>Attach to Active Project Contract</Text>
                  {myContracts.map((c) => {
                    const isSelected = selectedContractId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setSelectedContractId(c.id)}
                        style={[
                          styles.contractSelectCard,
                          isSelected && styles.contractSelectCardActive,
                        ]}
                      >
                        <FileText size={16} color={isSelected ? '#10B981' : colors.neutral[400]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.contractCodeText}>{c.contractCode || c.title || `Contract #${c.id.slice(0, 8)}`}</Text>
                          <Text style={styles.contractAmountText}>
                            Total: ₦{Number(c.totalAmount).toLocaleString()} • {c.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmittingSubcontract && styles.submitButtonDisabled]}
                onPress={handleSendSubcontract}
                disabled={isSubmittingSubcontract}
                activeOpacity={0.8}
              >
                {isSubmittingSubcontract ? (
                  <ActivityIndicator size="small" color="#071A11" />
                ) : (
                  <>
                    <Send size={18} color="#071A11" />
                    <Text style={styles.submitButtonText}>Send Subcontract Proposal</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#173E28',
    gap: spacing.md,
  },
  backButton: {
    width: touchTargets.minInteractive,
    height: touchTargets.minInteractive,
    borderRadius: radius.md,
    backgroundColor: '#10B98115',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  networkBadgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D271B',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: '#173E28',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.neutral[100],
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
  },
  filterBar: {
    marginVertical: spacing.md,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#0D271B',
    borderWidth: 1,
    borderColor: '#173E28',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[400],
  },
  filterChipTextActive: {
    color: '#071A11',
    fontFamily: typography.fonts.bold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.neutral[400],
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  peerCard: {
    backgroundColor: '#0D271B',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#173E28',
  },
  peerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  peerAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: '#10B98125',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#10B981',
  },
  peerMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peerName: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  availableBadge: {
    backgroundColor: '#10B98125',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#10B98150',
  },
  availableBadgeText: {
    fontSize: 10,
    fontFamily: typography.fonts.semiBold,
    color: '#10B981',
  },
  busyBadge: {
    backgroundColor: '#EF444420',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#EF444440',
  },
  busyBadgeText: {
    fontSize: 10,
    fontFamily: typography.fonts.medium,
    color: '#F87171',
  },
  peerTrade: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: '#10B981',
    marginBottom: 4,
  },
  locStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locText: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starText: {
    fontSize: 11,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[200],
  },
  jobsCountText: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  peerActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#173E28',
  },
  connectButton: {
    flex: 1,
    height: 42,
    backgroundColor: '#10B981',
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  connectButtonDisabled: {
    backgroundColor: '#0D271B',
    borderWidth: 1,
    borderColor: '#173E28',
  },
  connectButtonText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: '#10B98118',
    borderWidth: 1,
    borderColor: '#10B98140',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[200],
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0B2016',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#173E28',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#173E28',
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: '#10B981',
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semiBold,
    color: colors.neutral[300],
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  modalInput: {
    backgroundColor: '#071A11',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.neutral[100],
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    borderWidth: 1,
    borderColor: '#173E28',
  },
  textArea: {
    minHeight: 80,
  },
  contractsSelectorContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  contractSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071A11',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#173E28',
    gap: spacing.sm,
  },
  contractSelectCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#10B98115',
  },
  contractCodeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.bold,
    color: colors.neutral[100],
  },
  contractAmountText: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
    color: colors.neutral[400],
  },
  submitButton: {
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: '#071A11',
  },
});
