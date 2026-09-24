import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { PrivyProviderWrapper } from './lib/privy-provider';

// Landing & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { LandingPageV2 } from './pages/LandingPageV2';
import { Login } from './pages/auth/Login';
import { AdminLogin } from './pages/auth/AdminLogin';
import { Register } from './pages/auth/Register';
import { VerifyOtp } from './pages/auth/VerifyOtp';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Public Discovery & Marketplace Module
import { PublicLayout } from './components/layout/PublicLayout';
import { PublicArtisanDirectoryPage } from './pages/public/PublicArtisanDirectoryPage';
import { PublicArtisanProfilePage } from './pages/public/PublicArtisanProfilePage';
import { TradesCatalogPage } from './pages/public/TradesCatalogPage';
import { PublicJobsMarketplacePage } from './pages/public/PublicJobsMarketplacePage';
import { TermsOfServicePage } from './pages/public/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { SecurityAndAuditPage } from './pages/public/SecurityAndAuditPage';
import { ContactUsPage } from './pages/public/ContactUsPage';
import { PricingPage } from './pages/public/PricingPage';
import { WaitlistConfirmedPage } from './pages/public/WaitlistConfirmedPage';
import { DisputeGuaranteePage } from './pages/public/DisputeGuaranteePage';
import { AboutUsPage } from './pages/public/AboutUsPage';

// Artisan Layout & Pages
import { ArtisanLayout } from './components/layout/ArtisanLayout';
import { DashboardOverview } from './pages/artisan/DashboardOverview';
import { JobsMarketplace } from './pages/artisan/JobsMarketplace';
import { JobDetails } from './pages/artisan/JobDetails';
import { SubmitProposal } from './pages/artisan/SubmitProposal';
import { SavedJobs } from './pages/artisan/SavedJobs';
import { JobInvitations } from './pages/artisan/JobInvitations';
import { ProposalsTracker } from './pages/artisan/ProposalsTracker';
import { ContractsList } from './pages/artisan/ContractsList';
import { ContractWorkspace } from './pages/artisan/ContractWorkspace';
import { WalletPage } from './pages/artisan/WalletPage';
import { ChatPage } from './pages/artisan/ChatPage';
import { DisputesPage } from './pages/artisan/DisputesPage';
import { DisputeWorkspace } from './pages/artisan/DisputeWorkspace';
import { ReviewsPage } from './pages/artisan/ReviewsPage';
import { ProfilePage } from './pages/artisan/ProfilePage';
import { PortfolioPage } from './pages/artisan/PortfolioPage';
import { ServicesCatalogPage } from './pages/artisan/ServicesCatalogPage';
import { KycVerificationPage as ArtisanKycPage } from './pages/artisan/KycVerificationPage';
import { NotificationsPage } from './pages/artisan/NotificationsPage';
import { SettingsPage } from './pages/artisan/SettingsPage';

// Client Layout & Pages
import { ClientLayout } from './components/layout/ClientLayout';
import { ClientDashboardOverview } from './pages/client/ClientDashboardOverview';
import { FindArtisansPage } from './pages/client/FindArtisansPage';
import { ArtisanPublicProfilePage } from './pages/client/ArtisanPublicProfilePage';
import { SavedArtisansPage } from './pages/client/SavedArtisansPage';
import { PostJobWizard } from './pages/client/PostJobWizard';
import { MyJobsPage } from './pages/client/MyJobsPage';
import { JobDetailsAndProposalsPage } from './pages/client/JobDetailsAndProposalsPage';
import { EditJobPage } from './pages/client/EditJobPage';
import { ProposalReviewPage } from './pages/client/ProposalReviewPage';
import { AcceptProposalWizard } from './pages/client/AcceptProposalWizard';
import { ClientContractsPage } from './pages/client/ClientContractsPage';
import { ClientContractWorkspace } from './pages/client/ClientContractWorkspace';
import { ClientWalletPage } from './pages/client/ClientWalletPage';
import { ClientChatPage } from './pages/client/ClientChatPage';
import { ClientDisputesPage } from './pages/client/ClientDisputesPage';
import { ClientDisputeWorkspace } from './pages/client/ClientDisputeWorkspace';
import { ClientReviewsPage } from './pages/client/ClientReviewsPage';
import { ClientProfilePage } from './pages/client/ClientProfilePage';
import { ClientNotificationsPage } from './pages/client/ClientNotificationsPage';
import { ClientSettingsPage } from './pages/client/ClientSettingsPage';

// Admin Layout & Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboardOverview } from './pages/admin/AdminDashboardOverview';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { UserDetailPage } from './pages/admin/UserDetailPage';
import { KycVerificationPage } from './pages/admin/KycVerificationPage';
import { DisputeCenterPage } from './pages/admin/DisputeCenterPage';
import { DisputeWorkspacePage } from './pages/admin/DisputeWorkspacePage';
import { CategoriesManagerPage } from './pages/admin/CategoriesManagerPage';
import { SkillsManagerPage } from './pages/admin/SkillsManagerPage';
import { ContractsOversightPage } from './pages/admin/ContractsOversightPage';
import { ContractDetailPage } from './pages/admin/ContractDetailPage';
import { FinancialLedgerPage } from './pages/admin/FinancialLedgerPage';
import { PayoutsModerationPage } from './pages/admin/PayoutsModerationPage';
import { MonadEscrowExplorerPage } from './pages/admin/MonadEscrowExplorerPage';
import { ReviewModerationPage } from './pages/admin/ReviewModerationPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage';
import { SystemHealthPage } from './pages/admin/SystemHealthPage';
import { PostHogPageViewTracker } from './components/analytics/PostHogPageViewTracker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  const { user, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const defaultRedirect =
    user?.role === 'ADMIN' || user?.role === 'SUPPORT'
      ? '/admin/dashboard'
      : user?.role === 'CLIENT'
      ? '/client/dashboard'
      : '/artisan/dashboard';

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProviderWrapper>
        <BrowserRouter>
          <PostHogPageViewTracker />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Artisan Dashboard Module */}
            <Route path="/artisan" element={<ArtisanLayout />}>
              <Route index element={<Navigate to="/artisan/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardOverview />} />
              <Route path="jobs" element={<JobsMarketplace />} />
              <Route path="jobs/:jobId" element={<JobDetails />} />
              <Route path="jobs/:jobId/propose" element={<SubmitProposal />} />
              <Route path="jobs/saved" element={<SavedJobs />} />
              <Route path="jobs/invitations" element={<JobInvitations />} />
              <Route path="proposals" element={<ProposalsTracker />} />
              <Route path="contracts" element={<ContractsList />} />
              <Route path="contracts/:contractId" element={<ContractWorkspace />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="messages" element={<ChatPage />} />
              <Route path="disputes" element={<DisputesPage />} />
              <Route path="disputes/:disputeId" element={<DisputeWorkspace />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/portfolio" element={<PortfolioPage />} />
              <Route path="profile/services" element={<ServicesCatalogPage />} />
              <Route path="kyc" element={<ArtisanKycPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Protected Client Dashboard Module */}
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<Navigate to="/client/dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboardOverview />} />
              <Route path="artisans" element={<FindArtisansPage />} />
              <Route path="artisans/:artisanId" element={<ArtisanPublicProfilePage />} />
              <Route path="saved-artisans" element={<SavedArtisansPage />} />
              <Route path="jobs/post" element={<PostJobWizard />} />
              <Route path="jobs" element={<MyJobsPage />} />
              <Route path="jobs/:jobId" element={<JobDetailsAndProposalsPage />} />
              <Route path="jobs/:jobId/edit" element={<EditJobPage />} />
              <Route path="proposals/:proposalId" element={<ProposalReviewPage />} />
              <Route path="proposals/:proposalId/accept" element={<AcceptProposalWizard />} />
              <Route path="contracts" element={<ClientContractsPage />} />
              <Route path="contracts/:contractId" element={<ClientContractWorkspace />} />
              <Route path="wallet" element={<ClientWalletPage />} />
              <Route path="messages" element={<ClientChatPage />} />
              <Route path="disputes" element={<ClientDisputesPage />} />
              <Route path="disputes/:disputeId" element={<ClientDisputeWorkspace />} />
              <Route path="reviews" element={<ClientReviewsPage />} />
              <Route path="profile" element={<ClientProfilePage />} />
              <Route path="notifications" element={<ClientNotificationsPage />} />
              <Route path="settings" element={<ClientSettingsPage />} />
            </Route>

            {/* Protected Admin Dashboard Module */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardOverview />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="users/:id" element={<UserDetailPage />} />
              <Route path="kyc" element={<KycVerificationPage />} />
              <Route path="disputes" element={<DisputeCenterPage />} />
              <Route path="disputes/:disputeId" element={<DisputeWorkspacePage />} />
              <Route path="categories" element={<CategoriesManagerPage />} />
              <Route path="skills" element={<SkillsManagerPage />} />
              <Route path="contracts" element={<ContractsOversightPage />} />
              <Route path="contracts/:contractId" element={<ContractDetailPage />} />
              <Route path="transactions" element={<FinancialLedgerPage />} />
              <Route path="payouts" element={<PayoutsModerationPage />} />
              <Route path="monad-escrow" element={<MonadEscrowExplorerPage />} />
              <Route path="reviews" element={<ReviewModerationPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="settings" element={<SystemSettingsPage />} />
              <Route path="health" element={<SystemHealthPage />} />
            </Route>

            {/* Public Discovery & Directory Module */}
            <Route element={<PublicLayout />}>
              <Route path="/artisans" element={<PublicArtisanDirectoryPage />} />
              <Route path="/directory" element={<Navigate to="/artisans" replace />} />
              <Route path="/p/:artisanId" element={<PublicArtisanProfilePage />} />
              <Route path="/artisans/:id" element={<PublicArtisanProfilePage />} />
              <Route path="/trades" element={<TradesCatalogPage />} />
              <Route path="/trades/:slug" element={<Navigate to="/trades" replace />} />
              <Route path="/categories/:slug" element={<Navigate to="/trades" replace />} />
              <Route path="/jobs" element={<PublicJobsMarketplacePage />} />
              <Route path="/jobs-board" element={<Navigate to="/jobs" replace />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
              <Route path="/security" element={<SecurityAndAuditPage />} />
              <Route path="/audit" element={<Navigate to="/security" replace />} />
              <Route path="/security-audit" element={<Navigate to="/security" replace />} />
              <Route path="/how-it-works" element={<Navigate to="/security" replace />} />
              <Route path="/trust" element={<Navigate to="/security" replace />} />
              <Route path="/escrow" element={<Navigate to="/security" replace />} />
              <Route path="/contact" element={<ContactUsPage />} />
              <Route path="/support" element={<Navigate to="/contact" replace />} />
              <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/fees" element={<Navigate to="/pricing" replace />} />
              <Route path="/pricing-policy" element={<Navigate to="/pricing" replace />} />
              <Route path="/waitlist/confirmed" element={<WaitlistConfirmedPage />} />
              <Route path="/waitlist-confirmed" element={<Navigate to="/waitlist/confirmed" replace />} />
              <Route path="/guarantee" element={<DisputeGuaranteePage />} />
              <Route path="/dispute-policy" element={<Navigate to="/guarantee" replace />} />
              <Route path="/disputes" element={<Navigate to="/guarantee" replace />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/our-story" element={<Navigate to="/about" replace />} />
              <Route path="/company" element={<Navigate to="/about" replace />} />
            </Route>

            {/* Root & Fallback */}
            <Route path="/v2" element={<LandingPageV2 />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PrivyProviderWrapper>
    </QueryClientProvider>
  );
}

export default App;
