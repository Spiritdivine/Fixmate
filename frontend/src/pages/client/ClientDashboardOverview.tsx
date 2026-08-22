import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileCheck,
  Clock,
  ShieldCheck,
  PlusCircle,
  Search,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Eye,
  MapPin,
  Star,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { Job, Contract, Wallet, ArtisanProfile, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

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
  const { data: walletData } = useQuery<Wallet>({
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 sm:p-8 text-white border border-sky-500/20 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Escrow Protected Hiring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {clientName}!
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Find verified Nigerian artisans, post project specifications, and protect your funds in secure smart contract escrows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/client/jobs/post"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Job</span>
            </Link>
            <Link
              to="/client/artisans"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Find Artisans</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Action Required Priority Banner if Work Submitted */}
      {pendingWorkSubmissions.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Work Submitted for Review ({pendingWorkSubmissions.length})
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Artisan has submitted completed work for &quot;{pendingWorkSubmissions[0].milestoneTitle}&quot;. Review before/after proof and approve payout.
              </p>
            </div>
          </div>
          <Link
            to={`/client/contracts/${pendingWorkSubmissions[0].contract.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-colors"
          >
            <span>Inspect Work</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Jobs</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {loadingJobs ? '...' : activeJobs.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {jobs.length} total posted
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Contracts</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {loadingContracts ? '...' : activeContracts.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {contracts.filter((c) => c.status === 'COMPLETED').length} completed
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Escrow Locked</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(wallet?.escrowLockedBalance || 0)}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              Protected in smart escrow
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Available Balance</span>
            <Link
              to="/client/wallet"
              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              title="Deposit Funds"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(wallet?.availableBalance || 0)}
            </div>
            <Link
              to="/client/wallet"
              className="text-[11px] text-sky-600 hover:underline font-semibold mt-0.5 inline-block"
            >
              + Deposit funds
            </Link>
          </div>
        </Card>
      </div>

      {/* Main Grid: Active Contracts + Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Contracts & Recent Jobs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Contracts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  In-Progress Contracts
                </h2>
              </div>
              <Link
                to="/client/contracts"
                className="text-xs font-semibold text-sky-600 hover:text-sky-500 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {contracts.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-slate-200 dark:border-slate-800">
                <FileCheck className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No active contracts yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When you accept an artisan&apos;s proposal and establish an escrow contract, it will appear here with real-time milestone tracking.
                </p>
                <Link
                  to="/client/jobs/post"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post a Job to Get Started</span>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {contracts.slice(0, 3).map((contract) => {
                  const completedMilestones =
                    contract.milestones?.filter((m) => m.status === 'RELEASED' || m.status === 'APPROVED').length || 0;
                  const totalMilestones = contract.milestones?.length || 1;
                  const progressPct = Math.round((completedMilestones / totalMilestones) * 100);

                  return (
                    <Card
                      key={contract.id}
                      className="p-4 sm:p-5 hover:border-sky-500/40 transition-all border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={contract.status === 'ACTIVE' ? 'emerald' : 'amber'}>
                              {contract.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-slate-400 font-mono">
                              {contract.contractCode}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {contract.job?.title || 'Contract Workspace'}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span>Artisan: {contract.artisan?.artisanProfile?.businessName || contract.artisan?.email}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {formatCurrency(contract.totalAmount)}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                          <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
                            {progressPct}% Completed
                          </div>
                          <Link
                            to={`/client/contracts/${contract.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Workspace</span>
                          </Link>
                        </div>
                      </div>

                      {/* Milestone Progress bar */}
                      <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Job Postings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Recent Job Postings
                </h2>
              </div>
              <Link
                to="/client/jobs"
                className="text-xs font-semibold text-sky-600 hover:text-sky-500 flex items-center gap-1"
              >
                <span>View All Jobs</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {jobs.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-slate-200 dark:border-slate-800">
                <Briefcase className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No jobs posted yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Post your first repair, plumbing, carpentry, or electrical job to start receiving bids from verified artisans.
                </p>
                <Link
                  to="/client/jobs/post"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Job Posting</span>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 4).map((job) => (
                  <Card
                    key={job.id}
                    className="p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={job.status === 'OPEN' ? 'blue' : job.status === 'IN_PROGRESS' ? 'emerald' : 'slate'}>
                            {job.status}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            Posted {formatDate(job.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {job.lgaCity}, {job.state}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(job.budgetMin)} - {formatCurrency(job.budgetMax)}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800">
                          <Users className="w-3 h-3" />
                          <span>{job.proposalsCount} Bids</span>
                        </div>
                        <Link
                          to={`/client/jobs/${job.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-sky-600 dark:hover:bg-sky-500 text-white dark:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors"
                        >
                          Review Bids
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recommended Artisans & Smart Hiring Tips */}
        <div className="space-y-6">
          {/* Recommended Artisans Widget */}
          <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Verified Artisans
                </h3>
              </div>
              <Link
                to="/client/artisans"
                className="text-xs font-semibold text-sky-600 hover:text-sky-500"
              >
                Browse All
              </Link>
            </div>

            <div className="space-y-3">
              {(topArtisans || []).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No artisans found in this category.
                </p>
              ) : (
                topArtisans?.map((artisan) => (
                  <Link
                    key={artisan.id}
                    to={`/client/artisans/${artisan.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={artisan.user?.avatarUrl}
                        name={artisan.businessName || artisan.user?.email || 'Artisan'}
                        size="sm"
                        isOnline={artisan.isAvailable}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {artisan.businessName || artisan.user?.email?.split('@')[0]}
                          </p>
                          <CheckCircle2 className="w-3 h-3 text-sky-500 shrink-0" />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {artisan.lgaCity}, {artisan.state}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span>{Number(artisan.ratingAvg || 0).toFixed(1)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <Link
              to="/client/artisans"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore Artisan Directory</span>
            </Link>
          </Card>

          {/* Smart Escrow Protection Notice */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/20 text-slate-300 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Fixmate Escrow Guarantee</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Funds are never paid upfront to the artisan. Your deposit remains locked in a Monad smart escrow until you verify before/after proofs and approve completion.
            </p>
            <div className="pt-2 border-t border-purple-500/10 flex items-center justify-between text-[11px] text-purple-300">
              <span>Arbitration Protection: Active</span>
              <Link to="/client/disputes" className="hover:underline font-semibold">
                Learn more &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
