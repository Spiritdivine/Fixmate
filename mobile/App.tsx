import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/query-client';
import { socketManager } from './src/lib/socket-manager';
import { PushNotificationManager } from './src/lib/notification-manager';
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
} from 'lucide-react-native';

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
import { AcceptProposalWizardScreen } from './src/components/client/AcceptProposalWizardScreen';
import { ArtisanPublicProfileScreen } from './src/components/client/ArtisanPublicProfileScreen';
import { ClientChatScreen } from './src/components/client/ClientChatScreen';
import { ClientWalletScreen } from './src/components/client/ClientWalletScreen';
import { ClientContractsListScreen } from './src/components/client/ClientContractsListScreen';
import { ClientDisputeWorkspaceScreen } from './src/components/client/ClientDisputeWorkspaceScreen';
import { ClientNotificationsScreen } from './src/components/client/ClientNotificationsScreen';
import { ClientProfileSettingsScreen } from './src/components/client/ClientProfileSettingsScreen';
import { SavedArtisansScreen } from './src/components/client/SavedArtisansScreen';
import { ClientReviewsScreen } from './src/components/client/ClientReviewsScreen';

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
  | 'CLIENT_WALLET'
  | 'CLIENT_MILESTONE'
  | 'CLIENT_POPULAR'
  | 'CLIENT_POST_JOB'
  | 'CLIENT_PROPOSALS'
  | 'CLIENT_ACCEPT_PROPOSAL'
  | 'CLIENT_ARTISAN_PROFILE'
  | 'CLIENT_CONTRACTS'
  | 'CLIENT_DISPUTE'
  | 'CLIENT_NOTIFICATIONS'
  | 'CLIENT_SETTINGS'
  | 'CLIENT_SAVED'
  | 'CLIENT_REVIEWS'
  // Artisan 5 Core Tabs & Sub-screens
  | 'ARTISAN_COCKPIT'
  | 'ARTISAN_ACTIVE'
  | 'ARTISAN_CHAT'
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
  | 'ARTISAN_SAVED';

function InnerApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [role, setRole] = useState<'CLIENT' | 'ARTISAN'>('CLIENT');
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>('CLIENT_HOME');
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

  const logoutStore = useAuthStore((s) => s.logout);
  const initAuth = useAuthStore((s) => s.initAuth);
  const user = useAuthStore((s) => s.user);

  const dynamicClientName = user?.clientProfile?.firstName
    ? `${user.clientProfile.firstName} ${user.clientProfile.lastName || ''}`.trim()
    : user?.email ? user.email.split('@')[0] : 'Fixmate Client';
  const dynamicArtisanName = user?.artisanProfile?.businessName || user?.artisanProfile?.title || 'Master Artisan';
  const dynamicInitials = (role === 'CLIENT' ? dynamicClientName : dynamicArtisanName)
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || (role === 'CLIENT' ? 'CL' : 'AR');

  useEffect(() => {
    initAuth().catch(() => {});
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
    if (user?.role) {
      setRole(user.role === 'ARTISAN' ? 'ARTISAN' : 'CLIENT');
    }
  }, [user?.role]);

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
    if (tabKey === 'CLIENT_CHAT') return currentScreen === 'CLIENT_CHAT';
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
    if (tabKey === 'ARTISAN_CHAT') return currentScreen === 'ARTISAN_CHAT';
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
        barStyle={role === 'ARTISAN' && isAuthenticated ? 'light-content' : 'dark-content'}
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
            {currentScreen === 'CLIENT_HOME' && (
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
              />
            )}

            {currentScreen === 'CLIENT_MY_JOBS' && (
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
              />
            )}

            {currentScreen === 'CLIENT_OGA_JOHN' && (
              <OgaJohnAiStudioScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onViewArtisanProfile={(artisanId) => {
                  if (artisanId) setSelectedArtisanId(artisanId);
                  setProfileReturnScreen('CLIENT_OGA_JOHN');
                  setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                }}
                onBookArtisanChat={(artisanId, conversationId, artisanName) => {
                  if (artisanId) setSelectedArtisanId(artisanId);
                  if (conversationId) setSelectedConversationId(conversationId);
                  if (artisanName) setSelectedArtisanName(artisanName);
                  setProfileReturnScreen('CLIENT_OGA_JOHN');
                  setCurrentScreen('CLIENT_CHAT');
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
            )}

            {currentScreen === 'CLIENT_CHAT' && (
              <ClientChatScreen
                conversationId={selectedConversationId}
                artisanName={selectedArtisanName}
                onBack={() => setCurrentScreen(profileReturnScreen || 'CLIENT_HOME')}
                onOpenMilestoneReview={() => setCurrentScreen('CLIENT_MILESTONE')}
              />
            )}

            {currentScreen === 'CLIENT_WALLET' && (
              <ClientWalletScreen onBack={() => setCurrentScreen('CLIENT_HOME')} />
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
                  setCurrentScreen('CLIENT_ACCEPT_PROPOSAL');
                }}
                onViewArtisan={(artisanId) => {
                  if (artisanId) setSelectedArtisanId(artisanId);
                  setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                }}
                onChatWithArtisan={(artisanId) => {
                  if (artisanId) setSelectedArtisanId(artisanId);
                  setCurrentScreen('CLIENT_CHAT');
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
                onChat={() => {
                  setProfileReturnScreen('CLIENT_ARTISAN_PROFILE');
                  setCurrentScreen('CLIENT_CHAT');
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
                  setCurrentScreen('CLIENT_MILESTONE');
                }}
                onOpenChat={(conversationId) => {
                  if (conversationId) setSelectedConversationId(conversationId);
                  setCurrentScreen('CLIENT_CHAT');
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
              <ClientProfileSettingsScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onLogout={handleLogout}
                onNavigateToWallet={() => setCurrentScreen('CLIENT_WALLET')}
              />
            )}

            {currentScreen === 'CLIENT_SAVED' && (
              <SavedArtisansScreen
                onBack={() => setCurrentScreen('CLIENT_HOME')}
                onSelectArtisan={(id) => {
                  setSelectedArtisanId(id);
                  setCurrentScreen('CLIENT_ARTISAN_PROFILE');
                }}
                onChat={(id) => {
                  setSelectedArtisanId(id);
                  setCurrentScreen('CLIENT_CHAT');
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
            {currentScreen === 'ARTISAN_COCKPIT' && (
              <ArtisanCockpitScreen
                onAcceptLead={(leadId) => {
                  setSelectedJobId(leadId);
                  setCurrentScreen('ARTISAN_INCOMING');
                }}
                onDeclineLead={() => alert('Lead passed to next available artisan.')}
                onViewActiveProject={(contractId) => {
                  if (contractId) setSelectedContractId(contractId);
                  setCurrentScreen('ARTISAN_ACTIVE');
                }}
                onNavigateToWallet={() => setCurrentScreen('ARTISAN_WALLET')}
                onLaunchMaps={() => alert('Launching Google Maps turn-by-turn navigation')}
                onCallClient={() => alert('Dialing client phone...')}
                onSnapPhoto={(milestoneId) => {
                  if (milestoneId) setSelectedMilestoneId(milestoneId);
                  setCurrentScreen('ARTISAN_PROOF');
                }}
                onAvatarPress={() => setShowAccountMenu(true)}
                onNotificationPress={() => setCurrentScreen('ARTISAN_NOTIFICATIONS')}
              />
            )}

            {currentScreen === 'ARTISAN_ACTIVE' && (
              <ActiveProjectScreen
                contractId={selectedContractId}
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onMarkCompleted={(cId, mId) => {
                  if (cId) setSelectedContractId(cId);
                  if (mId) setSelectedMilestoneId(mId);
                  setCurrentScreen('ARTISAN_PROOF');
                }}
                onCallClient={() => alert('Calling client...')}
                onViewLocation={() => alert('Viewing work site coordinates on Map')}
                onViewDetails={() => setCurrentScreen('ARTISAN_CONTRACTS')}
                onOpenDispute={(dId) => {
                  if (dId) setSelectedDisputeId(dId);
                  setCurrentScreen('ARTISAN_DISPUTE');
                }}
                onOpenMarketplace={() => setCurrentScreen('ARTISAN_MARKETPLACE')}
              />
            )}

            {currentScreen === 'ARTISAN_CHAT' && (
              <ArtisanChatScreen
                conversationId={selectedConversationId}
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
              />
            )}

            {currentScreen === 'ARTISAN_WALLET' && (
              <ArtisanWalletScreen
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onViewProposals={() => setCurrentScreen('ARTISAN_PROPOSALS')}
              />
            )}

            {currentScreen === 'ARTISAN_PROFILE' && (
              <ArtisanProfileScreen
                onBack={() => setCurrentScreen('ARTISAN_COCKPIT')}
                onOpenKyc={() => setCurrentScreen('ARTISAN_KYC')}
                onOpenPortfolio={() => setCurrentScreen('ARTISAN_PORTFOLIO')}
                onOpenReviews={() => setCurrentScreen('ARTISAN_REVIEWS')}
                onOpenSettings={() => setCurrentScreen('ARTISAN_SETTINGS')}
              />
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
          </>
        )}
      </View>

      {/* ========================================================= */}
      {/* STRICT 5-TAB NATIVE BOTTOM NAVIGATION BAR */}
      {/* ========================================================= */}
      {isAuthenticated && (
        <SafeAreaView
          style={[styles.bottomBarArea, role === 'ARTISAN' && styles.bottomBarDark]}
        >
          <View style={styles.bottomNav}>
            {role === 'CLIENT' ? (
              <>
                {/* 1. Home */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('CLIENT_HOME')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    <Home
                      size={22}
                      color={isClientTabActive('CLIENT_HOME') ? colors.icons.primary : colors.icons.secondary}
                      strokeWidth={1.85}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isClientTabActive('CLIENT_HOME') && styles.tabLabelActive,
                    ]}
                  >
                    Home
                  </Text>
                </TouchableOpacity>

                {/* 2. My Jobs */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('CLIENT_MY_JOBS')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    <ClipboardList
                      size={22}
                      color={isClientTabActive('CLIENT_MY_JOBS') ? colors.icons.primary : colors.icons.secondary}
                      strokeWidth={1.85}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isClientTabActive('CLIENT_MY_JOBS') && styles.tabLabelActive,
                    ]}
                  >
                    My Jobs
                  </Text>
                </TouchableOpacity>

                {/* 3. Oga John AI (Center) */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('CLIENT_OGA_JOHN')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    <Bot
                      size={22}
                      color={isClientTabActive('CLIENT_OGA_JOHN') ? colors.icons.primary : colors.icons.secondary}
                      strokeWidth={1.85}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isClientTabActive('CLIENT_OGA_JOHN') && styles.tabLabelActive,
                    ]}
                  >
                    Oga John
                  </Text>
                </TouchableOpacity>

                {/* 4. Messages (with unread badge '2') */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('CLIENT_CHAT')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.badgeWrapper}>
                    <View style={styles.tabIconWrap}>
                      <MessageSquare
                        size={22}
                        color={isClientTabActive('CLIENT_CHAT') ? colors.icons.primary : colors.icons.secondary}
                        strokeWidth={1.85}
                      />
                    </View>
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>2</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isClientTabActive('CLIENT_CHAT') && styles.tabLabelActive,
                    ]}
                  >
                    Messages
                  </Text>
                </TouchableOpacity>

                {/* 5. Wallet (Smart Escrow Protected) */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('CLIENT_WALLET')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    <ShieldCheck
                      size={22}
                      color={isClientTabActive('CLIENT_WALLET') ? colors.icons.primary : colors.icons.secondary}
                      strokeWidth={1.85}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isClientTabActive('CLIENT_WALLET') && styles.tabLabelActive,
                    ]}
                  >
                    Wallet
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* 1. Radar/Jobs */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('ARTISAN_COCKPIT')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    <Compass
                      size={22}
                      color={isArtisanTabActive('ARTISAN_COCKPIT') ? colors.icons.accent : '#9CA3AF'}
                      strokeWidth={1.85}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabelDark,
                      isArtisanTabActive('ARTISAN_COCKPIT') && styles.tabLabelActiveDark,
                    ]}
                  >
                    Radar/Jobs
                  </Text>
                </TouchableOpacity>

                {/* 2. My Tasks */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('ARTISAN_ACTIVE')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    <Wrench
                      size={22}
                      color={isArtisanTabActive('ARTISAN_ACTIVE') ? colors.icons.accent : '#9CA3AF'}
                      strokeWidth={1.85}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabelDark,
                      isArtisanTabActive('ARTISAN_ACTIVE') && styles.tabLabelActiveDark,
                    ]}
                  >
                    My Tasks
                  </Text>
                </TouchableOpacity>

                {/* 3. Messages (with unread badge '3') */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('ARTISAN_CHAT')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.badgeWrapper}>
                    <View style={styles.tabIconWrap}>
                      <MessageSquare
                        size={22}
                        color={isArtisanTabActive('ARTISAN_CHAT') ? colors.icons.accent : '#9CA3AF'}
                        strokeWidth={1.85}
                      />
                    </View>
                    <View style={styles.urgentDot}>
                      <Text style={styles.urgentDotText}>3</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.tabLabelDark,
                      isArtisanTabActive('ARTISAN_CHAT') && styles.tabLabelActiveDark,
                    ]}
                  >
                    Messages
                  </Text>
                </TouchableOpacity>

                {/* 4. Earnings & Wallet */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('ARTISAN_WALLET')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    <Wallet
                      size={22}
                      color={isArtisanTabActive('ARTISAN_WALLET') ? colors.icons.accent : '#9CA3AF'}
                      strokeWidth={1.85}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabelDark,
                      isArtisanTabActive('ARTISAN_WALLET') && styles.tabLabelActiveDark,
                    ]}
                  >
                    Earnings
                  </Text>
                </TouchableOpacity>

                {/* 5. Profile */}
                <TouchableOpacity
                  onPress={() => setCurrentScreen('ARTISAN_PROFILE')}
                  style={styles.navTab}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabIconWrap}>
                    <UserCheck
                      size={22}
                      color={isArtisanTabActive('ARTISAN_PROFILE') ? colors.icons.accent : '#9CA3AF'}
                      strokeWidth={1.85}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabelDark,
                      isArtisanTabActive('ARTISAN_PROFILE') && styles.tabLabelActiveDark,
                    ]}
                  >
                    Profile
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      )}

      {/* Account Settings Modal */}
      <Modal visible={showAccountMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAccountMenu(false)}
        >
          <View style={styles.accountMenuCard}>
            <BrandLogo variant="full" theme="light" size={32} style={{ marginBottom: spacing.md, alignSelf: 'flex-start' }} />
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>{dynamicInitials}</Text>
              </View>
              <View style={styles.menuMeta}>
                <Text style={styles.menuUserName}>
                  {role === 'CLIENT' ? dynamicClientName : dynamicArtisanName}
                </Text>
                <Text style={styles.menuUserRole}>
                  Account: {role === 'CLIENT' ? 'Homeowner Client' : (user?.artisanProfile?.trade || 'Verified Artisan')}
                </Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setShowAccountMenu(false);
                setCurrentScreen(role === 'CLIENT' ? 'CLIENT_SETTINGS' : 'ARTISAN_SETTINGS');
              }}
            >
              <Settings size={20} color={colors.icons.secondary} strokeWidth={1.85} style={styles.menuLucideIcon} />
              <View style={styles.menuOptionTextWrap}>
                <Text style={styles.menuOptionTitle}>Account Settings</Text>
                <Text style={styles.menuOptionSub}>Biometrics, notification & addresses</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuLogout} onPress={handleLogout}>
              <LogOut size={20} color="#DC2626" strokeWidth={1.85} style={styles.menuLucideIcon} />
              <Text style={styles.menuLogoutText}>Log Out to Splash / Auth Flow</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerApp />
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
  bottomBarArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  bottomBarDark: {
    backgroundColor: '#071A11',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
    color: '#606C38',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#123F32',
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
    top: -2,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
