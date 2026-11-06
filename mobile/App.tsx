import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from './src/lib/query-client';
import { socketManager } from './src/lib/socket-manager';
import { PushNotificationManager } from './src/lib/notification-manager';
import { ChatService } from './src/services/chat.service';
import * as Haptics from 'expo-haptics';
import {
  Home,
  ClipboardList,
  Bot,
  MessageSquare,
  ShieldCheck,
  Compass,
  Wrench,
  Wallet,
  UserCheck,
  User,
  RefreshCw,
  Settings,
  LogOut,
  Sparkles,
  FileText,
  Heart,
  ShieldAlert,
  Star,
  Users,
  Gift,
  QrCode,
} from 'lucide-react-native';


// Shared UI & Context
import { ToastProvider, useToast, UserAvatar } from './src/components/shared';
import { ReferralCapture } from './src/lib/referral-capture';
import { ThemeProvider, useTheme } from './src/theme';

// Auth & Onboarding Suite
import { WelcomeSplashScreen } from './src/components/auth/WelcomeSplashScreen';
import { RoleSelectionScreen } from './src/components/auth/RoleSelectionScreen';
import { LoginScreen } from './src/components/auth/LoginScreen';
import { RegisterScreen } from './src/components/auth/RegisterScreen';
import { OtpVerificationScreen } from './src/components/auth/OtpVerificationScreen';
import { ForgotPasswordScreen } from './src/components/auth/ForgotPasswordScreen';
import { ClientOnboardingScreen } from './src/components/auth/ClientOnboardingScreen';
import { ArtisanOnboardingScreen } from './src/components/auth/ArtisanOnboardingScreen';

// Client Screens
import { ClientHomeScreen } from './src/components/client/ClientHomeScreen';
import { MilestoneApprovalScreen } from './src/components/client/MilestoneApprovalScreen';
import { PopularServicesScreen } from './src/components/client/PopularServicesScreen';
import { OgaJohnAiStudioScreen } from './src/components/client/OgaJohnAiStudioScreen';
import { PostJobWizardScreen } from './src/components/client/PostJobWizardScreen';
import { MyJobsScreen } from './src/components/client/MyJobsScreen';
import { JobDetailsAndProposalsScreen } from './src/components/client/JobDetailsAndProposalsScreen';
import { ProposalDetailsScreen } from './src/components/client/ProposalDetailsScreen';
import { AcceptProposalWizardScreen } from './src/components/client/AcceptProposalWizardScreen';
import { ArtisanPublicProfileScreen } from './src/components/client/ArtisanPublicProfileScreen';
import { ChatInboxScreen, ChatThreadScreen } from './src/components/chat';
import { ClientWalletScreen } from './src/components/client/ClientWalletScreen';
import { ClientTransactionActivityScreen } from './src/components/client/ClientTransactionActivityScreen';
import { ClientContractsListScreen } from './src/components/client/ClientContractsListScreen';
import { ContractDetailsScreen } from './src/components/client/ContractDetailsScreen';
import { ClientDisputeWorkspaceScreen } from './src/components/client/ClientDisputeWorkspaceScreen';
import { ProposalService } from './src/services/proposal.service';
import { ClientNotificationsScreen } from './src/components/client/ClientNotificationsScreen';
import { ClientProfileSettingsScreen } from './src/components/client/ClientProfileSettingsScreen';
import { SavedArtisansScreen } from './src/components/client/SavedArtisansScreen';
import { ClientReviewsScreen } from './src/components/client/ClientReviewsScreen';
import { ArtisanDirectoryScreen } from './src/components/client/ArtisanDirectoryScreen';
import { ClientDisputesListScreen } from './src/components/client/ClientDisputesListScreen';
import { ClientReviewHistoryScreen } from './src/components/client/ClientReviewHistoryScreen';
import { ClientProfileEditScreen } from './src/components/client/ClientProfileEditScreen';
import { ClientSettingsScreen } from './src/components/client/ClientSettingsScreen';
import { ClientBottomBar } from './src/components/client/ClientBottomBar';
import { ArtisanBottomBar } from './src/components/artisan/ArtisanBottomBar';

// Artisan Screens
import { ArtisanCockpitScreen } from './src/components/artisan/ArtisanCockpitScreen';
import { IncomingJobScreen } from './src/components/artisan/IncomingJobScreen';
import { ActiveProjectScreen } from './src/components/artisan/ActiveProjectScreen';
import { SubmitProofScreen } from './src/components/artisan/SubmitProofScreen';
import { JobsMarketplaceScreen } from './src/components/artisan/JobsMarketplaceScreen';
import { JobDetailsAndBidScreen } from './src/components/artisan/JobDetailsAndBidScreen';
import { ProposalsTrackerScreen } from './src/components/artisan/ProposalsTrackerScreen';
import { ArtisanContractsListScreen } from './src/components/artisan/ArtisanContractsListScreen';
import { ArtisanWalletScreen } from './src/components/artisan/ArtisanWalletScreen';
import { ArtisanChatScreen } from './src/components/artisan/ArtisanChatScreen';
import { ArtisanProfileScreen } from './src/components/artisan/ArtisanProfileScreen';
import { PortfolioEditorScreen } from './src/components/artisan/PortfolioEditorScreen';
import { KycVerificationScreen } from './src/components/artisan/KycVerificationScreen';
import { ArtisanDisputeWorkspaceScreen } from './src/components/artisan/ArtisanDisputeWorkspaceScreen';
import { ArtisanNotificationsScreen } from './src/components/artisan/ArtisanNotificationsScreen';
import { ArtisanSettingsScreen } from './src/components/artisan/ArtisanSettingsScreen';
import { ArtisanReviewsScreen } from './src/components/artisan/ArtisanReviewsScreen';
import { SavedJobsScreen } from './src/components/artisan/SavedJobsScreen';
import { ArtisanInvitationsScreen } from './src/components/artisan/ArtisanInvitationsScreen';
import { ArtisanPeerNetworkScreen } from './src/components/artisan/ArtisanPeerNetworkScreen';
import { ArtisanDisputesListScreen } from './src/components/artisan/ArtisanDisputesListScreen';
import { ReferralRewardsScreen } from './src/components/shared/ReferralRewardsScreen';
import { QRScannerModal } from './src/components/shared/QRScannerModal';

import { colors, radius, spacing, typography } from './src/theme';
import { BrandLogo } from './src/components/shared/BrandLogo';
import { useAuthStore } from './src/stores/authStore';

export type ScreenKey =
  // Auth Suite
  | 'AUTH_SPLASH'
  | 'AUTH_ROLE_SELECT'
  | 'AUTH_LOGIN'
  | 'AUTH_REGISTER'
  | 'AUTH_OTP'
  | 'AUTH_FORGOT_PASSWORD'
  | 'AUTH_CLIENT_ONBOARDING'
  | 'AUTH_ARTISAN_ONBOARDING'
  // Client 5 Core Tabs & Sub-screens
  | 'CLIENT_HOME'
  | 'CLIENT_MY_JOBS'
  | 'CLIENT_OGA_JOHN'
  | 'CLIENT_CHAT'
  | 'CLIENT_CHAT_THREAD'
  | 'CLIENT_WALLET'
  | 'CLIENT_TRANSACTION_ACTIVITY'
  | 'CLIENT_MILESTONE'
  | 'CLIENT_POPULAR'
  | 'CLIENT_POST_JOB'
  | 'CLIENT_PROPOSALS'
  | 'CLIENT_PROPOSAL_DETAILS'
  | 'CLIENT_ACCEPT_PROPOSAL'
  | 'CLIENT_ARTISAN_PROFILE'
  | 'CLIENT_CONTRACTS'
  | 'CLIENT_CONTRACT_DETAILS'
  | 'CLIENT_DISPUTE'
  | 'CLIENT_NOTIFICATIONS'
  | 'CLIENT_SETTINGS'
  | 'CLIENT_SAVED'
  | 'CLIENT_REVIEWS'
  | 'CLIENT_ARTISAN_DIRECTORY'
  | 'CLIENT_DISPUTES_LIST'
  | 'CLIENT_REVIEW_HISTORY'
  | 'CLIENT_PROFILE_EDIT'
  // Artisan 5 Core Tabs & Sub-screens
  | 'ARTISAN_COCKPIT'
  | 'ARTISAN_ACTIVE'
  | 'ARTISAN_CHAT'
  | 'ARTISAN_CHAT_THREAD'
  | 'ARTISAN_WALLET'
  | 'ARTISAN_PROFILE'
  | 'ARTISAN_INCOMING'
  | 'ARTISAN_PROOF'
  | 'ARTISAN_MARKETPLACE'
  | 'ARTISAN_BID'
  | 'ARTISAN_PROPOSALS'
  | 'ARTISAN_CONTRACTS'
  | 'ARTISAN_PORTFOLIO'
  | 'ARTISAN_KYC'
  | 'ARTISAN_DISPUTE'
  | 'ARTISAN_NOTIFICATIONS'
  | 'ARTISAN_SETTINGS'
  | 'ARTISAN_REVIEWS'
  | 'ARTISAN_SAVED'
  | 'ARTISAN_INVITATIONS'
  | 'ARTISAN_PEER_NETWORK'
  | 'ARTISAN_DISPUTES_LIST'
  | 'REFERRALS_REWARDS';

function InnerApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [role, setRole] = useState<'CLIENT' | 'ARTISAN'>('ARTISAN');
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>('ARTISAN_COCKPIT');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [registeredRole, setRegisteredRole] = useState<'CLIENT' | 'ARTISAN'>('CLIENT');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [registeredPhone, setRegisteredPhone] = useState<string>('');

  // Dynamic Navigation Parameters for Deep Linking
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(undefined);
  const [selectedProposal, setSelectedProposal] = useState<any | undefined>(undefined);
  const [selectedContractId, setSelectedContractId] = useState<string | undefined>(undefined);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>(undefined);
  const [selectedArtisanId, setSelectedArtisanId] = useState<string | undefined>(undefined);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | undefined>(undefined);
  const [selectedArtisanName, setSelectedArtisanName] = useState<string | undefined>(undefined);
  const [profileReturnScreen, setProfileReturnScreen] = useState<ScreenKey>('CLIENT_HOME');
  const [postJobInitialData, setPostJobInitialData] = useState<{ title?: string; trade?: string; budget?: number; description?: string } | undefined>(undefined);
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);

  const logoutStore = useAuthStore((s) => s.logout);
  const initAuth = useAuthStore((s) => s.initAuth);
  const user = useAuthStore((s) => s.user);
  const activeRole = useAuthStore((s) => s.activeRole);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const { showInfo } = useToast();
  const { colors: themeColors, isDark } = useTheme();

  const { data: globalConversations } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => ChatService.getConversations(),
    enabled: isAuthenticated,
  });
  const totalUnreadChatCount = (globalConversations || []).reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);

  const dynamicClientName = user?.clientProfile?.firstName
    ? `${user.clientProfile.firstName} ${user.clientProfile.lastName || ''}`.trim()
    : user?.email ? user.email.split('@')[0] : 'Valued Client';
  const dynamicClientAvatar = user?.avatarUrl || user?.clientProfile?.avatarUrl;
  const dynamicClientPhone = user?.phoneNumber || user?.phone || user?.clientProfile?.phone || '';
  const dynamicArtisanName = user?.artisanProfile?.businessName || user?.artisanProfile?.title || 'Master Artisan';
  const dynamicInitials = (role === 'CLIENT' ? dynamicClientName : dynamicArtisanName)
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || (role === 'CLIENT' ? 'CL' : 'AR');

  useEffect(() => {
    initAuth().catch(() => {});
    ReferralCapture.init().catch(() => {});
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      socketManager.connect().catch(() => {});
      PushNotificationManager.registerDevice().catch(() => {});
    } else {
      socketManager.disconnect();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeRole === 'ARTISAN' || activeRole === 'CLIENT') {
      setRole(activeRole);
      setCurrentScreen(activeRole === 'ARTISAN' ? 'ARTISAN_COCKPIT' : 'CLIENT_HOME');
    }
  }, [activeRole]);

  // Keep-Alive tab persistence sets
  const [visitedClientTabs, setVisitedClientTabs] = useState<Set<ScreenKey>>(new Set(['CLIENT_HOME']));
  const [visitedArtisanTabs, setVisitedArtisanTabs] = useState<Set<ScreenKey>>(new Set(['ARTISAN_COCKPIT']));

  useEffect(() => {
    const clientTabs: ScreenKey[] = ['CLIENT_HOME', 'CLIENT_MY_JOBS', 'CLIENT_OGA_JOHN', 'CLIENT_CHAT', 'CLIENT_WALLET'];
    if (clientTabs.includes(currentScreen)) {
      setVisitedClientTabs((prev) => {
        if (prev.has(currentScreen)) return prev;
        const next = new Set(prev);
        next.add(currentScreen);
        return next;
      });
    }

    const artisanTabs: ScreenKey[] = ['ARTISAN_COCKPIT', 'ARTISAN_ACTIVE', 'ARTISAN_CHAT', 'ARTISAN_WALLET', 'ARTISAN_PROFILE'];
    if (artisanTabs.includes(currentScreen)) {
      setVisitedArtisanTabs((prev) => {
        if (prev.has(currentScreen)) return prev;
        const next = new Set(prev);
        next.add(currentScreen);
        return next;
      });
    }
  }, [currentScreen]);

  const handleLogout = async () => {
    setShowAccountMenu(false);
    try {
      await logoutStore();
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setCurrentScreen('AUTH_SPLASH');
  };

  const handleTabPress = (screen: ScreenKey) => {
    Haptics.selectionAsync().catch(() => {});
    setCurrentScreen(screen);
  };

  const isClientTabActive = (tabKey: ScreenKey) => {
    if (tabKey === 'CLIENT_HOME') {
      return (
        currentScreen === 'CLIENT_HOME' ||
        currentScreen === 'CLIENT_POPULAR' ||
        currentScreen === 'CLIENT_SAVED' ||
        currentScreen === 'CLIENT_NOTIFICATIONS'
      );
    }
    if (tabKey === 'CLIENT_MY_JOBS') {
      return (
        currentScreen === 'CLIENT_MY_JOBS' ||
        currentScreen === 'CLIENT_POST_JOB' ||
        currentScreen === 'CLIENT_PROPOSALS' ||
        currentScreen === 'CLIENT_ACCEPT_PROPOSAL' ||
        currentScreen === 'CLIENT_MILESTONE' ||
        currentScreen === 'CLIENT_REVIEWS'
      );
    }
    if (tabKey === 'CLIENT_OGA_JOHN') return currentScreen === 'CLIENT_OGA_JOHN';
    if (tabKey === 'CLIENT_CHAT') return currentScreen === 'CLIENT_CHAT' || currentScreen === 'CLIENT_CHAT_THREAD';
    if (tabKey === 'CLIENT_WALLET') {
      return (
        currentScreen === 'CLIENT_WALLET' ||
        currentScreen === 'CLIENT_CONTRACTS' ||
        currentScreen === 'CLIENT_DISPUTE'
      );
    }
    return false;
  };

  const isArtisanTabActive = (tabKey: ScreenKey) => {
    if (tabKey === 'ARTISAN_COCKPIT') {
      return (
        currentScreen === 'ARTISAN_COCKPIT' ||
        currentScreen === 'ARTISAN_INCOMING' ||
        currentScreen === 'ARTISAN_MARKETPLACE' ||
        currentScreen === 'ARTISAN_BID' ||
        currentScreen === 'ARTISAN_SAVED'
      );
    }
    if (tabKey === 'ARTISAN_ACTIVE') {
      return (
        currentScreen === 'ARTISAN_ACTIVE' ||
        currentScreen === 'ARTISAN_PROOF' ||
        currentScreen === 'ARTISAN_CONTRACTS' ||
        currentScreen === 'ARTISAN_DISPUTE'
      );
    }
    if (tabKey === 'ARTISAN_CHAT') return currentScreen === 'ARTISAN_CHAT' || currentScreen === 'ARTISAN_CHAT_THREAD';
    if (tabKey === 'ARTISAN_WALLET') {
      return (
        currentScreen === 'ARTISAN_WALLET' ||
        currentScreen === 'ARTISAN_PROPOSALS'
      );
    }
    if (tabKey === 'ARTISAN_PROFILE') {
      return (
        currentScreen === 'ARTISAN_PROFILE' ||
        currentScreen === 'ARTISAN_PORTFOLIO' ||
        currentScreen === 'ARTISAN_KYC' ||
        currentScreen === 'ARTISAN_REVIEWS' ||
        currentScreen === 'ARTISAN_SETTINGS'
      );
    }
    return false;
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark || (role === 'ARTISAN' && isAuthenticated) ? 'light-content' : 'dark-content'}
      />

      {/* Screen Render */}
      <View style={styles.screenContainer}>
        {/* ========================================================= */}
        {/* AUTHENTICATION STACK */}
        {/* ========================================================= */}
        {!isAuthenticated && (
          <>
            {currentScreen === 'AUTH_SPLASH' && (
              <WelcomeSplashScreen
                onGetStarted={() => setCurrentScreen('AUTH_ROLE_SELECT')}
                onLogin={() => setCurrentScreen('AUTH_LOGIN')}
              />
            )}

            {currentScreen === 'AUTH_ROLE_SELECT' && (
              <RoleSelectionScreen
                onBack={() => setCurrentScreen('AUTH_SPLASH')}
                onSelectRole={(chosenRole) => {
                  setRegisteredRole(chosenRole);
                  setCurrentScreen('AUTH_REGISTER');
                }}
              />
            )}

            {currentScreen === 'AUTH_LOGIN' && (
              <LoginScreen
                onBack={() => setCurrentScreen('AUTH_SPLASH')}
                onLoginSuccess={(loggedRole) => {
                  setRole(loggedRole);
                  setIsAuthenticated(true);
                  setCurrentScreen(loggedRole === 'CLIENT' ? 'CLIENT_HOME' : 'ARTISAN_COCKPIT');
                }}
                onNavigateToRegister={() => setCurrentScreen('AUTH_REGISTER')}
                onNavigateToForgotPassword={() => setCurrentScreen('AUTH_FORGOT_PASSWORD')}
              />
            )}

            {currentScreen === 'AUTH_REGISTER' && (
              <RegisterScreen
                initialRole={registeredRole}
                onBack={() => setCurrentScreen('AUTH_ROLE_SELECT')}
                onProceedToOtp={(data) => {
                  setRegisteredRole(data.role);
                  setRegisteredEmail(data.email);
                  setRegisteredPhone(data.phone);
                  setCurrentScreen('AUTH_OTP');
                }}
                onNavigateToLogin={() => setCurrentScreen('AUTH_LOGIN')}
                onSocialLoginSuccess={(loggedRole) => {
                  setRole(loggedRole);
                  setIsAuthenticated(true);
                  setCurrentScreen(loggedRole === 'CLIENT' ? 'CLIENT_HOME' : 'ARTISAN_COCKPIT');
                }}
              />
            )}

            {currentScreen === 'AUTH_OTP' && (
              <OtpVerificationScreen
                email={registeredEmail}
                phoneNumber={registeredPhone}
                onBack={() => setCurrentScreen('AUTH_REGISTER')}
                onVerifySuccess={() => {
                  if (registeredRole === 'CLIENT') {
                    setCurrentScreen('AUTH_CLIENT_ONBOARDING');
                  } else {
                    setCurrentScreen('AUTH_ARTISAN_ONBOARDING');
                  }
                }}
                onEditPhoneNumber={() => setCurrentScreen('AUTH_REGISTER')}
              />
            )}

            {currentScreen === 'AUTH_FORGOT_PASSWORD' && (
              <ForgotPasswordScreen
                onBack={() => setCurrentScreen('AUTH_LOGIN')}
                onSuccess={() => setCurrentScreen('AUTH_LOGIN')}
              />
            )}

            {currentScreen === 'AUTH_CLIENT_ONBOARDING' && (
              <ClientOnboardingScreen
                onComplete={() => {
                  setRole('CLIENT');
                  setIsAuthenticated(true);
                  setCurrentScreen('CLIENT_HOME');
                }}
              />
            )}

            {currentScreen === 'AUTH_ARTISAN_ONBOARDING' && (
              <ArtisanOnboardingScreen
                onComplete={() => {
                  setRole('ARTISAN');
                  setIsAuthenticated(true);
                  setCurrentScreen('ARTISAN_COCKPIT');
                }}
              />
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* CLIENT STACK (5 MAIN TABS + SUB-SCREENS) */}
        {/* ========================================================= */}
        {isAuthenticated && role === 'CLIENT' && (
          <>
            {/* Core Tab 1: Client Home */}
            {visitedClientTabs.has('CLIENT_HOME') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'CLIENT_HOME' ? 'flex' : 'none' }]}>
                <ClientHomeScreen
                  onNavigateToMilestoneReview={(contractId, milestoneId) => {
                    if (contractId) setSelectedContractId(contractId);
                    if (milestoneId) setSelectedMilestoneId(milestoneId);
                    setCurrentScreen('CLIENT_MILESTONE');
                  }}
                  onNavigateToAiScan={() => setCurrentScreen('CLIENT_OGA_JOHN')}
                  onNavigateToPostJob={(init) => {
                    setPostJobInitialData(init);
                    setCurrentScreen('CLIENT_POST_JOB');
                  }}
                  onSelectArtisan={(artisanId) => {
                    if (artisanId) setSelectedArtisanId(artisanId);
                    setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                  }}
                  onSelectService={(serviceName) => {
                    setPostJobInitialData({ trade: serviceName });
                    setCurrentScreen('CLIENT_POST_JOB');
                  }}
                  onAvatarPress={() => setShowAccountMenu(true)}
                  onNotificationPress={() => setCurrentScreen('CLIENT_NOTIFICATIONS')}
                  onNavigateToPopularTrades={() => setCurrentScreen('CLIENT_POPULAR')}
                  onNavigateToArtisanDirectory={() => setCurrentScreen('CLIENT_ARTISAN_DIRECTORY')}
                  onNavigateToQrScan={() => setShowQRScanner(true)}
                />

              </View>
            )}

            {/* Core Tab 2: My Jobs */}
            {visitedClientTabs.has('CLIENT_MY_JOBS') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'CLIENT_MY_JOBS' ? 'flex' : 'none' }]}>
                <MyJobsScreen
                  onBack={() => setCurrentScreen('CLIENT_HOME')}
                  onSelectJob={(jobId) => {
                    setSelectedJobId(jobId);
                    setCurrentScreen('CLIENT_PROPOSALS');
                  }}
                  onPostNewJob={() => {
                    setPostJobInitialData(undefined);
                    setCurrentScreen('CLIENT_POST_JOB');
                  }}
                  onRepostJob={(jobData) => {
                    setPostJobInitialData(jobData);
                    setCurrentScreen('CLIENT_POST_JOB');
                  }}
                />
              </View>
            )}

            {/* Core Tab 3: Oga John AI Studio */}
            {visitedClientTabs.has('CLIENT_OGA_JOHN') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'CLIENT_OGA_JOHN' ? 'flex' : 'none' }]}>
                <OgaJohnAiStudioScreen
                  onBack={() => setCurrentScreen('CLIENT_HOME')}
                  onViewArtisanProfile={(artisanId) => {
                    if (artisanId) setSelectedArtisanId(artisanId);
                    setProfileReturnScreen('CLIENT_OGA_JOHN');
                    setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                  }}
                  onBookArtisanChat={async (artisanId, conversationId, artisanName) => {
                    if (artisanId) setSelectedArtisanId(artisanId);
                    if (artisanName) setSelectedArtisanName(artisanName);
                    setProfileReturnScreen('CLIENT_OGA_JOHN');
                    if (conversationId) {
                      setSelectedConversationId(conversationId);
                      setCurrentScreen('CLIENT_CHAT_THREAD');
                    } else if (artisanId) {
                      try {
                        const conv = await ChatService.getOrCreateArtisanConversation(artisanId);
                        setSelectedConversationId(conv.id);
                        setCurrentScreen('CLIENT_CHAT_THREAD');
                      } catch {
                        setCurrentScreen('CLIENT_CHAT');
                      }
                    } else {
                      setCurrentScreen('CLIENT_CHAT');
                    }
                  }}
                  onPostJobWithDiagnosis={(diagnosis) => {
                    setPostJobInitialData({
                      title: diagnosis.issueTitle,
                      trade: diagnosis.trade,
                      budget: diagnosis.costMin,
                      description: diagnosis.description,
                    });
                    setCurrentScreen('CLIENT_POST_JOB');
                  }}
                />
              </View>
            )}

            {/* Core Tab 4: Messages Inbox */}
            {visitedClientTabs.has('CLIENT_CHAT') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'CLIENT_CHAT' ? 'flex' : 'none' }]}>
                <ChatInboxScreen
                  userRole="CLIENT"
                  onSelectConversation={(convId, name) => {
                    setSelectedConversationId(convId);
                    if (name) setSelectedArtisanName(name);
                    setCurrentScreen('CLIENT_CHAT_THREAD');
                  }}
                  onExploreServices={() => setCurrentScreen('CLIENT_HOME')}
                />
              </View>
            )}

            {currentScreen === 'CLIENT_CHAT_THREAD' && selectedConversationId && (
              <ChatThreadScreen
                conversationId={selectedConversationId}
                recipientName={selectedArtisanName}
                recipientRole="ARTISAN"
                onBack={() => setCurrentScreen('CLIENT_CHAT')}
                onOpenMilestoneReview={() => setCurrentScreen('CLIENT_MILESTONE')}
              />
            )}

            {/* Core Tab 5: Wallet */}
            {visitedClientTabs.has('CLIENT_WALLET') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'CLIENT_WALLET' ? 'flex' : 'none' }]}>
                <ClientWalletScreen
                  onBack={() => setCurrentScreen('CLIENT_HOME')}
                  onNavigateToTransactions={() => setCurrentScreen('CLIENT_TRANSACTION_ACTIVITY')}
                />
              </View>
            )}

            {currentScreen === 'CLIENT_TRANSACTION_ACTIVITY' && (
              <ClientTransactionActivityScreen
                onBack={() => setCurrentScreen('CLIENT_WALLET')}
              />
            )}

            {/* Client Sub-screens */}
            {currentScreen === 'CLIENT_MILESTONE' && (
              <MilestoneApprovalScreen
                contractId={selectedContractId}
                milestoneId={selectedMilestoneId}
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onRaiseDispute={(contractId?: string, milestoneId?: string) => {
                  if (contractId) setSelectedContractId(contractId);
                  if (milestoneId) setSelectedMilestoneId(milestoneId);
                  setCurrentScreen('CLIENT_DISPUTE');
                }}
                onReleaseSuccess={(contractId?: string, artisanId?: string) => {
                  if (contractId) setSelectedContractId(contractId);
                  if (artisanId) setSelectedArtisanId(artisanId);
                  setCurrentScreen('CLIENT_REVIEWS');
                }}
              />
            )}

            {currentScreen === 'CLIENT_POPULAR' && (
              <PopularServicesScreen
                onSelectService={(serviceName) => {
                  setPostJobInitialData({ trade: serviceName });
                  setCurrentScreen('CLIENT_POST_JOB');
                }}
                onSelectArtisan={(artisanId) => {
                  if (artisanId) setSelectedArtisanId(artisanId);
                  setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                }}
                onBookArtisan={(artisanId) => {
                  if (artisanId) setSelectedArtisanId(artisanId);
                  setPostJobInitialData(undefined);
                  setCurrentScreen('CLIENT_POST_JOB');
                }}
              />
            )}

            {currentScreen === 'CLIENT_POST_JOB' && (
              <PostJobWizardScreen
                initialData={postJobInitialData}
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onJobPublished={(jobId) => {
                  setSelectedJobId(jobId);
                  setCurrentScreen('CLIENT_PROPOSALS');
                }}
              />
            )}

            {currentScreen === 'CLIENT_PROPOSALS' && (
              <JobDetailsAndProposalsScreen
                jobId={selectedJobId}
                onBack={() => setCurrentScreen('CLIENT_MY_JOBS')}
                onSelectProposal={(proposal) => {
                  setSelectedProposal(proposal);
                  setCurrentScreen('CLIENT_PROPOSAL_DETAILS');
                }}
                onViewArtisan={(artisanId) => {
                  if (artisanId) setSelectedArtisanId(artisanId);
                  setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                }}
                onChatWithArtisan={async (artisanId) => {
                  if (artisanId) {
                    setSelectedArtisanId(artisanId);
                    try {
                      const conv = await ChatService.getOrCreateArtisanConversation(artisanId, selectedJobId || undefined);
                      setSelectedConversationId(conv.id);
                      setCurrentScreen('CLIENT_CHAT_THREAD');
                    } catch {
                      setCurrentScreen('CLIENT_CHAT');
                    }
                  } else {
                    setCurrentScreen('CLIENT_CHAT');
                  }
                }}
              />
            )}

            {currentScreen === 'CLIENT_PROPOSAL_DETAILS' && selectedProposal && (
              <ProposalDetailsScreen
                proposal={selectedProposal}
                jobTitle={postJobInitialData?.title || 'Job Request'}
                onBack={() => setCurrentScreen('CLIENT_PROPOSALS')}
                onAccept={(prop) => {
                  setSelectedProposal(prop);
                  setCurrentScreen('CLIENT_ACCEPT_PROPOSAL');
                }}
                onDecline={async (propId) => {
                  try {
                    await ProposalService.updateStatus(propId, 'REJECTED');
                    queryClient.invalidateQueries({ queryKey: ['job-proposals', selectedJobId] });
                    setCurrentScreen('CLIENT_PROPOSALS');
                  } catch {
                    setCurrentScreen('CLIENT_PROPOSALS');
                  }
                }}
                onChatWithArtisan={async (artisanId) => {
                  if (artisanId) {
                    setSelectedArtisanId(artisanId);
                    try {
                      const conv = await ChatService.getOrCreateArtisanConversation(artisanId, selectedJobId || undefined);
                      setSelectedConversationId(conv.id);
                      setCurrentScreen('CLIENT_CHAT_THREAD');
                    } catch {
                      setCurrentScreen('CLIENT_CHAT');
                    }
                  } else {
                    setCurrentScreen('CLIENT_CHAT');
                  }
                }}
                onViewArtisanProfile={(artisanId) => {
                  if (artisanId) setSelectedArtisanId(artisanId);
                  setProfileReturnScreen('CLIENT_PROPOSAL_DETAILS');
                  setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                }}
              />
            )}

            {currentScreen === 'CLIENT_ACCEPT_PROPOSAL' && (
              <AcceptProposalWizardScreen
                proposal={selectedProposal}
                jobId={selectedJobId}
                onBack={() => setCurrentScreen('CLIENT_PROPOSALS')}
                onSuccess={(contractId?: string) => {
                  if (contractId) setSelectedContractId(contractId);
                  setCurrentScreen('CLIENT_CONTRACTS');
                }}
              />
            )}

            {currentScreen === 'CLIENT_ARTISAN_PROFILE' && (
              <ArtisanPublicProfileScreen
                artisanId={selectedArtisanId}
                onBack={() => setCurrentScreen(profileReturnScreen || 'CLIENT_HOME')}
                onChat={async () => {
                  setProfileReturnScreen('CLIENT_ARTISAN_PROFILE');
                  if (selectedArtisanId) {
                    try {
                      const conv = await ChatService.getOrCreateArtisanConversation(selectedArtisanId);
                      setSelectedConversationId(conv.id);
                      setCurrentScreen('CLIENT_CHAT_THREAD');
                    } catch {
                      setCurrentScreen('CLIENT_CHAT');
                    }
                  } else {
                    setCurrentScreen('CLIENT_CHAT');
                  }
                }}
                onRequestQuote={(artisanTrade?: string) => {
                  setPostJobInitialData({ trade: artisanTrade });
                  setCurrentScreen('CLIENT_POST_JOB');
                }}
              />
            )}

            {currentScreen === 'CLIENT_CONTRACTS' && (
              <ClientContractsListScreen
                onBack={() => setCurrentScreen('CLIENT_WALLET')}
                onSelectContract={(contractId) => {
                  setSelectedContractId(contractId);
                  setCurrentScreen('CLIENT_CONTRACT_DETAILS');
                }}
                onOpenChat={(conversationId) => {
                  if (conversationId) {
                    setSelectedConversationId(conversationId);
                    setCurrentScreen('CLIENT_CHAT_THREAD');
                  } else {
                    setCurrentScreen('CLIENT_CHAT');
                  }
                }}
              />
            )}

            {currentScreen === 'CLIENT_CONTRACT_DETAILS' && selectedContractId && (
              <ContractDetailsScreen
                contractId={selectedContractId}
                onBack={() => setCurrentScreen('CLIENT_CONTRACTS')}
                onOpenChat={async (artisanId) => {
                  if (artisanId) {
                    setSelectedArtisanId(artisanId);
                    try {
                      const conv = await ChatService.getOrCreateArtisanConversation(artisanId);
                      setSelectedConversationId(conv.id);
                      setCurrentScreen('CLIENT_CHAT_THREAD');
                    } catch {
                      setCurrentScreen('CLIENT_CHAT');
                    }
                  } else {
                    setCurrentScreen('CLIENT_CHAT');
                  }
                }}
                onApproveMilestone={(contractId, milestoneId) => {
                  setSelectedContractId(contractId);
                  setSelectedMilestoneId(milestoneId);
                  setCurrentScreen('CLIENT_MILESTONE');
                }}
                onFileDispute={(contractId) => {
                  setSelectedContractId(contractId);
                  setCurrentScreen('CLIENT_DISPUTE');
                }}
                onViewJob={(jobId) => {
                  setSelectedJobId(jobId);
                  setCurrentScreen('CLIENT_PROPOSALS');
                }}
              />
            )}

            {currentScreen === 'CLIENT_DISPUTE' && (
              <ClientDisputeWorkspaceScreen
                disputeId={selectedDisputeId}
                contractId={selectedContractId}
                onBack={() => setCurrentScreen('CLIENT_WALLET')}
              />
            )}

            {currentScreen === 'CLIENT_NOTIFICATIONS' && (
              <ClientNotificationsScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onSelectNotification={(item) => {
                  if (item.targetId) {
                    if (item.type === 'BID') {
                      setSelectedJobId(item.targetId);
                      setCurrentScreen('CLIENT_PROPOSALS');
                      return;
                    }
                    if (item.type === 'MILESTONE') {
                      setSelectedContractId(item.targetId);
                      setCurrentScreen('CLIENT_MILESTONE');
                      return;
                    }
                  }
                  if (item.type === 'BID') setCurrentScreen('CLIENT_PROPOSALS');
                  else if (item.type === 'MILESTONE') setCurrentScreen('CLIENT_MILESTONE');
                  else if (item.type === 'PAYMENT') setCurrentScreen('CLIENT_WALLET');
                  else setCurrentScreen('CLIENT_OGA_JOHN');
                }}
              />
            )}

            {currentScreen === 'CLIENT_SETTINGS' && (
              <ClientSettingsScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onLogout={handleLogout}
                onNavigateToProfileEdit={() => setCurrentScreen('CLIENT_PROFILE_EDIT')}
              />
            )}

            {currentScreen === 'CLIENT_PROFILE_EDIT' && (
              <ClientProfileEditScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onNavigateToWallet={() => setCurrentScreen('CLIENT_WALLET')}
              />
            )}

            {currentScreen === 'CLIENT_ARTISAN_DIRECTORY' && (
              <ArtisanDirectoryScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onSelectArtisan={(artisanId) => {
                  setSelectedArtisanId(artisanId);
                  setProfileReturnScreen('CLIENT_ARTISAN_DIRECTORY');
                  setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                }}
                onPostJob={(init) => {
                  setPostJobInitialData(init);
                  setCurrentScreen('CLIENT_POST_JOB');
                }}
              />
            )}

            {currentScreen === 'CLIENT_DISPUTES_LIST' && (
              <ClientDisputesListScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onSelectDispute={(disputeId) => {
                  setSelectedDisputeId(disputeId);
                  setCurrentScreen('CLIENT_DISPUTE');
                }}
              />
            )}

            {currentScreen === 'CLIENT_REVIEW_HISTORY' && (
              <ClientReviewHistoryScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onNavigateToContracts={() => setCurrentScreen('CLIENT_CONTRACTS')}
              />
            )}

            {currentScreen === 'REFERRALS_REWARDS' && (
              <ReferralRewardsScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onScanQr={() => setShowQRScanner(true)}
              />
            )}


            {currentScreen === 'CLIENT_SAVED' && (
              <SavedArtisansScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onSelectArtisan={(id) => {
                  setSelectedArtisanId(id);
                  setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                }}
                onChat={async (id) => {
                  setSelectedArtisanId(id);
                  try {
                    const conv = await ChatService.getOrCreateArtisanConversation(id);
                    setSelectedConversationId(conv.id);
                    setCurrentScreen('CLIENT_CHAT_THREAD');
                  } catch {
                    setCurrentScreen('CLIENT_CHAT');
                  }
                }}
                onRehire={(id) => {
                  setSelectedArtisanId(id);
                  setCurrentScreen('CLIENT_POST_JOB');
                }}
              />
            )}

            {currentScreen === 'CLIENT_REVIEWS' && (
              <ClientReviewsScreen
                contractId={selectedContractId}
                artisanId={selectedArtisanId}
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onSubmitReview={() => setCurrentScreen('CLIENT_HOME')}
              />
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* ARTISAN STACK (5 MAIN TABS + SUB-SCREENS) */}
        {/* ========================================================= */}
        {isAuthenticated && role === 'ARTISAN' && (
          <>
            {/* Core Tab 1: Artisan Cockpit */}
            {visitedArtisanTabs.has('ARTISAN_COCKPIT') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'ARTISAN_COCKPIT' ? 'flex' : 'none' }]}>
                <ArtisanCockpitScreen
                  onAcceptLead={(leadId) => {
                    setSelectedJobId(leadId);
                    setCurrentScreen('ARTISAN_INCOMING');
                  }}
                  onDeclineLead={() => showInfo('Lead Passed', 'Lead rerouted to next available artisan.')}
                  onViewActiveProject={(contractId) => {
                    if (contractId) setSelectedContractId(contractId);
                    setCurrentScreen('ARTISAN_ACTIVE');
                  }}
                  onNavigateToWallet={() => setCurrentScreen('ARTISAN_WALLET')}
                  onViewInvitations={() => setCurrentScreen('ARTISAN_INVITATIONS')}
                  onLaunchMaps={() => showInfo('Maps Navigation', 'Launching GPS turn-by-turn navigation')}
                  onCallClient={() => showInfo('Voice Calling', 'Connecting call to client phone...')}
                  onSnapPhoto={(milestoneId) => {
                    if (milestoneId) setSelectedMilestoneId(milestoneId);
                    setCurrentScreen('ARTISAN_PROOF');
                  }}
                  onAvatarPress={() => setShowAccountMenu(true)}
                  onNotificationPress={() => setCurrentScreen('ARTISAN_NOTIFICATIONS')}
                  onScanQr={() => setShowQRScanner(true)}
                />

              </View>
            )}

            {/* Core Tab 2: Active Projects */}
            {visitedArtisanTabs.has('ARTISAN_ACTIVE') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'ARTISAN_ACTIVE' ? 'flex' : 'none' }]}>
                <ActiveProjectScreen
                  contractId={selectedContractId}
                  onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                  onMarkCompleted={(cId, mId) => {
                    if (cId) setSelectedContractId(cId);
                    if (mId) setSelectedMilestoneId(mId);
                    setCurrentScreen('ARTISAN_PROOF');
                  }}
                  onCallClient={() => showInfo('Voice Calling', 'Calling client phone...')}
                  onViewLocation={() => showInfo('Map Coordinates', 'Viewing work site coordinates on map')}
                  onViewDetails={() => setCurrentScreen('ARTISAN_CONTRACTS')}
                  onOpenDispute={(dId) => {
                    if (dId) {
                      setSelectedDisputeId(dId);
                      setCurrentScreen('ARTISAN_DISPUTE');
                    } else {
                      setCurrentScreen('ARTISAN_DISPUTES_LIST');
                    }
                  }}
                  onOpenMarketplace={() => setCurrentScreen('ARTISAN_MARKETPLACE')}
                />
              </View>
            )}

            {/* Core Tab 3: Messages Inbox */}
            {visitedArtisanTabs.has('ARTISAN_CHAT') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'ARTISAN_CHAT' ? 'flex' : 'none' }]}>
                <ChatInboxScreen
                  userRole="ARTISAN"
                  onSelectConversation={(convId, name) => {
                    setSelectedConversationId(convId);
                    if (name) setSelectedArtisanName(name);
                    setCurrentScreen('ARTISAN_CHAT_THREAD');
                  }}
                  onExploreServices={() => setCurrentScreen('ARTISAN_MARKETPLACE')}
                />
              </View>
            )}

            {currentScreen === 'ARTISAN_CHAT_THREAD' && selectedConversationId && (
              <ChatThreadScreen
                conversationId={selectedConversationId}
                recipientName={selectedArtisanName}
                recipientRole="CLIENT"
                onBack={() => setCurrentScreen('ARTISAN_CHAT')}
              />
            )}

            {/* Core Tab 4: Wallet */}
            {visitedArtisanTabs.has('ARTISAN_WALLET') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'ARTISAN_WALLET' ? 'flex' : 'none' }]}>
                <ArtisanWalletScreen
                  onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                  onViewProposals={() => setCurrentScreen('ARTISAN_PROPOSALS')}
                />
              </View>
            )}

            {/* Core Tab 5: Profile */}
            {visitedArtisanTabs.has('ARTISAN_PROFILE') && (
              <View style={[styles.tabContentContainer, { display: currentScreen === 'ARTISAN_PROFILE' ? 'flex' : 'none' }]}>
                <ArtisanProfileScreen
                  onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                  onOpenKyc={() => setCurrentScreen('ARTISAN_KYC')}
                  onOpenPortfolio={() => setCurrentScreen('ARTISAN_PORTFOLIO')}
                  onOpenReviews={() => setCurrentScreen('ARTISAN_REVIEWS')}
                  onOpenSettings={() => setCurrentScreen('ARTISAN_SETTINGS')}
                />
              </View>
            )}

            {/* Artisan Sub-screens */}
            {currentScreen === 'ARTISAN_INCOMING' && (
              <IncomingJobScreen
                jobId={selectedJobId}
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onDecline={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onAccept={(jobId) => {
                  if (jobId) setSelectedJobId(jobId);
                  setCurrentScreen('ARTISAN_BID');
                }}
              />
            )}

            {currentScreen === 'ARTISAN_PROOF' && (
              <SubmitProofScreen
                milestoneId={selectedMilestoneId}
                contractId={selectedContractId}
                onBack={() => setCurrentScreen('ARTISAN_ACTIVE')}
                onSubmitSuccess={() => setCurrentScreen('ARTISAN_COCKPIT')}
              />
            )}

            {currentScreen === 'ARTISAN_MARKETPLACE' && (
              <JobsMarketplaceScreen
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onSelectJob={(jobId) => {
                  setSelectedJobId(jobId);
                  setCurrentScreen('ARTISAN_BID');
                }}
                onToggleSave={() => {}}
              />
            )}

            {currentScreen === 'ARTISAN_BID' && (
              <JobDetailsAndBidScreen
                jobId={selectedJobId}
                onBack={() => setCurrentScreen('ARTISAN_MARKETPLACE')}
                onSubmitSuccess={() => setCurrentScreen('ARTISAN_PROPOSALS')}
              />
            )}

            {currentScreen === 'ARTISAN_PROPOSALS' && (
              <ProposalsTrackerScreen
                onBack={() => setCurrentScreen('ARTISAN_WALLET')}
                onOpenAcceptedContract={(contractId) => {
                  setSelectedContractId(contractId);
                  setCurrentScreen('ARTISAN_ACTIVE');
                }}
              />
            )}

            {currentScreen === 'ARTISAN_CONTRACTS' && (
              <ArtisanContractsListScreen
                onBack={() => setCurrentScreen('ARTISAN_ACTIVE')}
                onOpenContract={(contractId) => {
                  setSelectedContractId(contractId);
                  setCurrentScreen('ARTISAN_ACTIVE');
                }}
                onSubmitProof={(contractId, milestoneId) => {
                  setSelectedContractId(contractId);
                  setSelectedMilestoneId(milestoneId);
                  setCurrentScreen('ARTISAN_PROOF');
                }}
              />
            )}

            {currentScreen === 'ARTISAN_PORTFOLIO' && (
              <PortfolioEditorScreen onBack={() => setCurrentScreen('ARTISAN_PROFILE')} />
            )}

            {currentScreen === 'ARTISAN_KYC' && (
              <KycVerificationScreen
                onBack={() => setCurrentScreen('ARTISAN_PROFILE')}
                onSuccess={() => setCurrentScreen('ARTISAN_PROFILE')}
              />
            )}

            {currentScreen === 'ARTISAN_DISPUTE' && (
              <ArtisanDisputeWorkspaceScreen
                disputeId={selectedDisputeId}
                onBack={() => setCurrentScreen('ARTISAN_ACTIVE')}
              />
            )}

            {currentScreen === 'ARTISAN_NOTIFICATIONS' && (
              <ArtisanNotificationsScreen
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onOpenNotification={(_, notifType, targetId) => {
                  if (notifType === 'LEAD') {
                    if (targetId) setSelectedJobId(targetId);
                    setCurrentScreen('ARTISAN_INCOMING');
                  } else if (notifType === 'PAYMENT') {
                    setCurrentScreen('ARTISAN_WALLET');
                  } else {
                    if (targetId) setSelectedConversationId(targetId);
                    setCurrentScreen('ARTISAN_CHAT');
                  }
                }}
              />
            )}

            {currentScreen === 'ARTISAN_SETTINGS' && (
              <ArtisanSettingsScreen
                onBack={() => setCurrentScreen('ARTISAN_PROFILE')}
                onLogout={handleLogout}
              />
            )}

            {currentScreen === 'ARTISAN_REVIEWS' && (
              <ArtisanReviewsScreen onBack={() => setCurrentScreen('ARTISAN_PROFILE')} />
            )}

            {currentScreen === 'ARTISAN_SAVED' && (
              <SavedJobsScreen
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onBidNow={(jobId) => {
                  setSelectedJobId(jobId);
                  setCurrentScreen('ARTISAN_BID');
                }}
              />
            )}

            {currentScreen === 'ARTISAN_INVITATIONS' && (
              <ArtisanInvitationsScreen
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onSelectJob={(jobId) => {
                  setSelectedJobId(jobId);
                  setCurrentScreen('ARTISAN_BID');
                }}
              />
            )}

            {currentScreen === 'ARTISAN_PEER_NETWORK' && (
              <ArtisanPeerNetworkScreen
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onSelectPeer={(_peer) => {}}
              />
            )}

            {currentScreen === 'ARTISAN_DISPUTES_LIST' && (
              <ArtisanDisputesListScreen
                onBack={() => setCurrentScreen('ARTISAN_ACTIVE')}
                onOpenDispute={(disputeId) => {
                  setSelectedDisputeId(disputeId);
                  setCurrentScreen('ARTISAN_DISPUTE');
                }}
              />
            )}

            {currentScreen === 'REFERRALS_REWARDS' && (
              <ReferralRewardsScreen
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onScanQr={() => setShowQRScanner(true)}
              />
            )}

          </>
        )}
      </View>

      {/* ========================================================= */}
      {/* STRICT 5-TAB NATIVE BOTTOM NAVIGATION BAR */}
      {/* ========================================================= */}
      {isAuthenticated && (
        role === 'CLIENT' ? (
          <ClientBottomBar
            currentScreen={currentScreen}
            onTabPress={handleTabPress}
            unreadCount={totalUnreadChatCount}
          />
        ) : (
          <ArtisanBottomBar
            currentScreen={currentScreen}
            onTabPress={handleTabPress}
            unreadCount={totalUnreadChatCount}
          />
        )
      )}

      {/* Account Settings Modal */}
      <Modal visible={showAccountMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAccountMenu(false)}
        >
          <View style={[styles.accountMenuCard, { maxHeight: '82%', backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1 }]}>
            <BrandLogo variant="mark" theme={isDark ? 'dark' : 'light'} size={32} style={{ marginBottom: spacing.md, alignSelf: 'flex-start' }} />
            <View style={styles.menuHeader}>
              <UserAvatar
                avatarUrl={role === 'CLIENT' ? dynamicClientAvatar : user?.artisanProfile?.avatarUrl}
                name={role === 'CLIENT' ? dynamicClientName : dynamicArtisanName}
                size={54}
                role={role === 'CLIENT' ? 'CLIENT' : 'ARTISAN'}
                showRoleBadge
                style={{ marginRight: 14 }}
              />
              <View style={styles.menuMeta}>
                <Text style={[styles.menuUserName, { color: themeColors.text }]} numberOfLines={1}>
                  {role === 'CLIENT' ? dynamicClientName : dynamicArtisanName}
                </Text>
                <Text style={[styles.menuUserEmail, { color: themeColors.textMuted }]} numberOfLines={1}>
                  {user?.email || 'Registered User'}
                </Text>
                {role === 'CLIENT' && dynamicClientPhone ? (
                  <Text style={[styles.menuUserPhone, { color: isDark ? themeColors.brand.emerald : themeColors.brand.forest }]} numberOfLines={1}>
                    📞 {dynamicClientPhone}
                  </Text>
                ) : null}
                <View style={styles.menuBadgeRow}>
                  <View style={[styles.roleTag, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.12)' }]}>
                    <Text style={[styles.roleTagText, { color: isDark ? '#34D399' : '#065F46' }]}>
                      {role === 'CLIENT' ? 'Homeowner Client' : (user?.artisanProfile?.trade || 'Verified Artisan')}
                    </Text>
                  </View>
                  {user?.isKycVerified && (
                    <View style={[styles.verifiedTag, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
                      <Text style={[styles.verifiedTagText, { color: isDark ? '#4ADE80' : '#15803D' }]}>✓ NIN Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: themeColors.border }]} />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {role === 'CLIENT' ? (
                <>
                  <Text style={[styles.menuSectionHeader, { color: themeColors.textMuted }]}>ACTIVITY & RECORDS</Text>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('CLIENT_CONTRACTS');
                    }}
                  >
                    <FileText size={20} color={isDark ? themeColors.text : colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={[styles.menuOptionTitle, { color: themeColors.text }]}>My Contracts & Escrow</Text>
                      <Text style={[styles.menuOptionSub, { color: themeColors.textMuted }]}>Funded milestones, status & releases</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('CLIENT_SAVED');
                    }}
                  >
                    <Heart size={20} color={isDark ? themeColors.text : colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={[styles.menuOptionTitle, { color: themeColors.text }]}>Saved Artisans</Text>
                      <Text style={[styles.menuOptionSub, { color: themeColors.textMuted }]}>Bookmarked experts & repeat hiring</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('CLIENT_DISPUTES_LIST');
                    }}
                  >
                    <ShieldAlert size={20} color={isDark ? themeColors.text : colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={[styles.menuOptionTitle, { color: themeColors.text }]}>Dispute Center</Text>
                      <Text style={[styles.menuOptionSub, { color: themeColors.textMuted }]}>Active arbitration, claims & evidence</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('CLIENT_REVIEW_HISTORY');
                    }}
                  >
                    <Star size={20} color={isDark ? themeColors.text : colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={[styles.menuOptionTitle, { color: themeColors.text }]}>My Reviews & Ratings</Text>
                      <Text style={[styles.menuOptionSub, { color: themeColors.textMuted }]}>Feedback history given to artisans</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('CLIENT_ARTISAN_DIRECTORY');
                    }}
                  >
                    <Users size={20} color={isDark ? themeColors.text : colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={[styles.menuOptionTitle, { color: themeColors.text }]}>Find Artisans Directory</Text>
                      <Text style={[styles.menuOptionSub, { color: themeColors.textMuted }]}>Search verified local pros by trade & radius</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('REFERRALS_REWARDS');
                    }}
                  >
                    <Gift size={20} color="#10B981" strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={[styles.menuOptionTitle, { color: themeColors.text }]}>Rewards & Loyalty Hub</Text>
                      <Text style={[styles.menuOptionSub, { color: themeColors.textMuted }]}>Invite friends, earn points & fee discounts</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setShowQRScanner(true);
                    }}
                  >
                    <QrCode size={20} color="#10B981" strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={[styles.menuOptionTitle, { color: themeColors.text }]}>Scan QR Code</Text>
                      <Text style={[styles.menuOptionSub, { color: themeColors.textMuted }]}>Scan artisan card or on-site arrival QR</Text>
                    </View>
                  </TouchableOpacity>

                  <Text style={[styles.menuSectionHeader, { marginTop: spacing.md, color: themeColors.textMuted }]}>PREFERENCES & SECURITY</Text>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('CLIENT_PROFILE_EDIT');
                    }}
                  >
                    <User size={20} color={isDark ? themeColors.text : colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={[styles.menuOptionTitle, { color: themeColors.text }]}>Profile & Saved Addresses</Text>
                      <Text style={[styles.menuOptionSub, { color: themeColors.textMuted }]}>Avatar, contact details & home locations</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('CLIENT_SETTINGS');
                    }}
                  >
                    <Settings size={20} color={isDark ? themeColors.text : colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={[styles.menuOptionTitle, { color: themeColors.text }]}>App Settings & Security</Text>
                      <Text style={[styles.menuOptionSub, { color: themeColors.textMuted }]}>Biometrics, PIN, notifications & theme</Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.menuSectionHeader}>ACTIVITY & WORK</Text>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_CONTRACTS');
                    }}
                  >
                    <FileText size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>My Contracts & Tasks</Text>
                      <Text style={styles.menuOptionSub}>Active projects, milestones & proof</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_PROPOSALS');
                    }}
                  >
                    <ClipboardList size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Proposals & Bids</Text>
                      <Text style={styles.menuOptionSub}>Track submitted bids & client offers</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_SAVED');
                    }}
                  >
                    <Heart size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Saved Jobs</Text>
                      <Text style={styles.menuOptionSub}>Bookmarked opportunities & leads</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_INVITATIONS');
                    }}
                  >
                    <Sparkles size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Direct Job Invitations</Text>
                      <Text style={styles.menuOptionSub}>Exclusive requests from clients</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('REFERRALS_REWARDS');
                    }}
                  >
                    <Gift size={20} color="#10B981" strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Rewards, QR & Ranking Boost</Text>
                      <Text style={styles.menuOptionSub}>Share digital card, earn points & spotlight</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setShowQRScanner(true);
                    }}
                  >
                    <QrCode size={20} color="#10B981" strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Scan Arrival / Profile QR</Text>
                      <Text style={styles.menuOptionSub}>Verify presence on-site or scan profile</Text>
                    </View>
                  </TouchableOpacity>


                  <Text style={[styles.menuSectionHeader, { marginTop: spacing.md }]}>COMMUNITY & REPUTATION</Text>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_PEER_NETWORK');
                    }}
                  >
                    <Users size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Artisan Peer Network</Text>
                      <Text style={styles.menuOptionSub}>Find fellow pros & subcontract tasks</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_DISPUTES_LIST');
                    }}
                  >
                    <ShieldAlert size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Dispute Center</Text>
                      <Text style={styles.menuOptionSub}>Counter-evidence & mutual settlement</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_REVIEWS');
                    }}
                  >
                    <Star size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Reviews & Ratings</Text>
                      <Text style={styles.menuOptionSub}>Public replies & reputation rating</Text>
                    </View>
                  </TouchableOpacity>

                  <Text style={[styles.menuSectionHeader, { marginTop: spacing.md }]}>PROFILE & PREFERENCES</Text>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_PORTFOLIO');
                    }}
                  >
                    <Wrench size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Portfolio Showcase</Text>
                      <Text style={styles.menuOptionSub}>Add & edit verified repair photos</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_KYC');
                    }}
                  >
                    <ShieldCheck size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>KYC Verification</Text>
                      <Text style={styles.menuOptionSub}>NIN & facial liveness badge status</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => {
                      setShowAccountMenu(false);
                      setCurrentScreen('ARTISAN_SETTINGS');
                    }}
                  >
                    <Settings size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
                    <View style={styles.menuOptionTextWrap}>
                      <Text style={styles.menuOptionTitle}>Artisan Settings</Text>
                      <Text style={styles.menuOptionSub}>Security PIN, operating radius & alerts</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={styles.menuLogout} onPress={handleLogout}>
                <LogOut size={20} color="#DC2626" strokeWidth={1.85} style={styles.menuLucideIcon} />
                <Text style={styles.menuLogoutText}>Log Out to Splash / Auth Flow</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Universal In-App Camera QR Code Scanner */}
      <QRScannerModal
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onSelectArtisan={(artisanIdOrSlug) => {
          setSelectedArtisanId(artisanIdOrSlug);
          setCurrentScreen('CLIENT_ARTISAN_PROFILE');
        }}
        onApplyReferralCode={() => {
          setCurrentScreen('REFERRALS_REWARDS');
        }}
      />
    </View>
  );
}


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <InnerApp />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#092116',
  },
  screenContainer: {
    flex: 1,
  },
  tabContentContainer: {
    flex: 1,
  },
  bottomBarArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  bottomBarDark: {
    backgroundColor: '#071A11',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 58,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
    paddingVertical: 2,
  },
  aiNavTab: {
    transform: [{ translateY: -2 }],
  },
  aiPillWrap: {
    width: 38,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  aiPillWrapActive: {
    backgroundColor: colors.brand.emerald,
  },
  aiTabLabel: {
    color: colors.brand.emeraldDark,
    fontWeight: '700',
  },
  tabIconWrap: {
    marginBottom: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#0D3528',
    fontWeight: '800',
  },
  tabLabelDark: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  tabLabelActiveDark: {
    color: '#34D399',
    fontWeight: '800',
  },
  badgeWrapper: {
    position: 'relative',
  },
  navBadge: {
    position: 'absolute',
    top: -3,
    right: -9,
    backgroundColor: '#EF4444',
    borderRadius: 8.5,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  urgentDot: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  accountMenuCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  menuAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  menuMeta: {
    flex: 1,
  },
  menuUserName: {
    ...typography.h3,
    color: colors.text,
  },
  menuUserEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  menuUserPhone: {
    fontSize: 11,
    color: colors.brand.forest,
    marginTop: 2,
    fontWeight: '600',
  },
  menuBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  roleTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  menuUserRole: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  menuOptionIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  menuLucideIcon: {
    marginRight: spacing.sm,
  },
  menuOptionTextWrap: {
    flex: 1,
  },
  menuOptionTitle: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  menuOptionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuLogoutIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  menuLogoutText: {
    ...typography.body,
    fontWeight: 'bold',
    color: '#DC2626',
  },
});
