import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { Job, Contract, Wallet, ArtisanProfile, ApiResponse } from '../../types';
import { formatCurrency } from '../../lib/formatters';

// Widget Imports
import { StatCard } from '../../components/dashboard/StatCard';
import { SpendingAnalyticsChart } from '../../components/dashboard/SpendingAnalyticsChart';
import { PendingSubmissionsWidget } from '../../components/dashboard/PendingSubmissionsWidget';
import { ActiveContractsWidget } from '../../components/dashboard/ActiveContractsWidget';
import { TopArtisansWidget } from '../../components/dashboard/TopArtisansWidget';
import { RecentJobPostingsWidget } from '../../components/dashboard/RecentJobPostingsWidget';

export const ClientDashboardOverview: React.FC = () => {
  const { user } = useAuthStore();
  const profile = user?.clientProfile;

  // 1. Fetch Client's Jobs
  const { data: jobsData = [], isLoading: loadingJobs } = useQuery<Job[]>({
    queryKey: ['client-jobs-overview'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Job[] | { jobs: Job[] }>>('/jobs/my-jobs');
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.jobs) || [];
    },
  });

  // 2. Fetch Client's Contracts
  const { data: contractsData = [], isLoading: loadingContracts } = useQuery<Contract[]>({
    queryKey: ['client-contracts-overview'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Contract[] | { contracts: Contract[] }>>('/contracts');
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.contracts) || [];
    },
  });

  // 3. Fetch Client's Wallet
  const { data: walletData, isLoading: loadingWallet } = useQuery<Wallet>({
    queryKey: ['client-wallet'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Wallet | { wallet: Wallet }>>('/wallets/my-wallet');
      return (data.data as any)?.availableBalance !== undefined ? (data.data as Wallet) : (data.data as any)?.wallet;
    },
  });

  // 4. Fetch Recommended Artisans
  const { data: topArtisans = [] } = useQuery<ArtisanProfile[]>({
    queryKey: ['top-artisans-overview'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ArtisanProfile[] | { artisans: ArtisanProfile[] }>>(
        '/profiles/artisans?limit=4&isAvailable=true'
      );
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.artisans) || [];
    },
  });

  const jobs = jobsData || [];
  const contracts = contractsData || [];
  const wallet = walletData || user?.wallet;

  const activeJobs = jobs.filter((j) => j.status === 'OPEN' || j.status === 'IN_PROGRESS');
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE' || c.status === 'PENDING_FUNDING');
  
  // Find any milestone submitted by an artisan awaiting client review
  const pendingWorkSubmissions: { contract: Contract; milestoneTitle: string; milestoneId: string }[] = [];
  contracts.forEach((c) => {
    c.milestones?.forEach((m) => {
      if (m.status === 'SUBMITTED') {
        pendingWorkSubmissions.push({
          contract: c,
          milestoneTitle: m.title,
          milestoneId: m.id,
        });
      }
    });
  });

  const clientName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile?.companyName || user?.email?.split('@')[0] || 'Client';

  // Mock analytics data for the spending chart
  const analyticsData = [
    { day: 'S', value: 30000, fillType: 'striped' as const },
    { day: 'M', value: 45000, fillType: 'dark' as const },
    { day: 'T', value: 35000, fillType: 'light' as const, tooltip: '74%' },
    { day: 'W', value: 50000, fillType: 'dark' as const },
    { day: 'T', value: 25000, fillType: 'striped' as const },
    { day: 'F', value: 40000, fillType: 'striped' as const },
    { day: 'S', value: 20000, fillType: 'striped' as const },
  ];

  if (loadingJobs || loadingContracts || loadingWallet) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-dashboard">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-dashboard">Client Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your project requests, milestone escrows, and verified artisan contracts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/client/jobs/post"
            className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a Job</span>
          </Link>
          <Link
            to="/client/artisans"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm border border-slate-200"
          >
            <Search className="w-4 h-4" />
            <span>Find Artisans</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Jobs"
          value={activeJobs.length}
          subtitle={`${jobs.length} total posted`}
          variant="primary"
        />
        <StatCard
          title="Active Contracts"
          value={activeContracts.length}
          subtitle={`${contracts.filter((c) => c.status === 'COMPLETED').length} completed`}
          trend={10}
        />
        <StatCard
          title="Escrow Locked"
          value={formatCurrency(wallet?.escrowLockedBalance || 0)}
          subtitle="Protected funds"
        />
        <StatCard
          title="Available Balance"
          value={formatCurrency(wallet?.availableBalance || 0)}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-[280px]">
            <SpendingAnalyticsChart data={analyticsData} />
          </div>
          <div className="h-[280px]">
            <RecentJobPostingsWidget jobs={jobs} />
          </div>
        </div>

        {/* Middle Column (Span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="h-[200px]">
            <PendingSubmissionsWidget submissions={pendingWorkSubmissions} />
          </div>
          <div className="h-[360px]">
            <ActiveContractsWidget contracts={contracts} />
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="h-[584px]">
            <TopArtisansWidget artisans={topArtisans} />
          </div>
        </div>
      </div>
    </div>
  );
};
