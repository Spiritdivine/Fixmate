import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Lock,
  Briefcase,
  Star,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatNgn, shortenAddress } from '../../lib/formatters';
import { Contract, JobInvitation, Wallet as WalletType } from '../../types';

export const DashboardOverview: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invitations, setInvitations] = useState<JobInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const profile = user?.artisanProfile;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [walletRes, contractsRes, invitesRes] = await Promise.all([
          apiClient.get('/wallets/my-wallet'),
          apiClient.get('/contracts'),
          apiClient.get('/jobs/invitations/my-invitations'),
        ]);

        setWallet(walletRes.data.data);
        setContracts(contractsRes.data.data || []);
        setInvitations(invitesRes.data.data || []);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSyncGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsMessage('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          await apiClient.patch('/profiles/artisan/location', {
            latitude: lat,
            longitude: lng,
          });
          setGpsMessage(`Location synced (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          if (profile) {
            updateUser({
              artisanProfile: {
                ...profile,
                latitude: lat,
                longitude: lng,
              },
            });
          }
        } catch (err) {
          setGpsMessage(getErrorMessage(err));
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsMessage(`GPS Error: ${err.message}`);
        setGpsLoading(false);
      }
    );
  };

  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');
  const pendingFundingContracts = contracts.filter((c) => c.status === 'PENDING_FUNDING');

  // Collect active milestones requiring action
  const actionableMilestones = contracts
    .flatMap((c) => (c.milestones || []).map((m) => ({ ...m, contract: c })))
    .filter((m) => m.status === 'FUNDED' || m.status === 'IN_PROGRESS');

  return (
    <div className="space-y-6">
      {/* Top Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 border border-sky-500/20 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 border border-sky-400/30 text-sky-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fixmate Verified Artisan Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {profile?.businessName || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Your trades are protected by Monad Blockchain hybrid escrow contracts. Manage active deliverables and withdraw verified earnings instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleSyncGpsLocation}
              isLoading={gpsLoading}
              variant="outline"
              size="sm"
              leftIcon={<MapPin className="w-4 h-4 text-sky-400" />}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
            >
              Sync Live GPS
            </Button>
            <Link to="/artisan/jobs">
              <Button size="sm" leftIcon={<Briefcase className="w-4 h-4" />}>
                Browse Open Jobs
              </Button>
            </Link>
          </div>
        </div>

        {gpsMessage && (
          <p className="mt-3 text-xs text-sky-300 font-medium">{gpsMessage}</p>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Balance</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatNgn(wallet?.availableBalance)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400">Instant Bank Payout</span>
              <Link to="/artisan/wallet" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-0.5">
                Withdraw <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Escrow Locked Balance */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Secured in Escrow</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatNgn(wallet?.escrowLockedBalance)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400">Active Work</span>
              <span className="text-emerald-500 font-semibold">{activeContracts.length} Contracts</span>
            </div>
          </div>
        </Card>

        {/* Completed Jobs */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Jobs</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {profile?.completedJobsCount || 0}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400">100% Success Rate</span>
              <Link to="/artisan/contracts" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
                History
              </Link>
            </div>
          </div>
        </Card>

        {/* Reputation Score */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reputation Score</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              <span>{Number(profile?.ratingAvg || 5.0).toFixed(1)}</span>
              <span className="text-amber-500 text-lg">★</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400">{profile?.reviewCount || 0} Client Reviews</span>
              <Link to="/artisan/reviews" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
                View Feedback
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Active Milestones Queue & Direct Invitations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Actionable Deliverables */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Milestone Deliverables in Progress</CardTitle>
                <CardDescription>
                  Milestones funded by clients ready for execution and before/after proof submission.
                </CardDescription>
              </div>
              <Link to="/artisan/contracts">
                <Button variant="ghost" size="sm">
                  View All ({contracts.length})
                </Button>
              </Link>
            </CardHeader>

            {actionableMilestones.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No active deliverables awaiting submission
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Apply to new jobs or wait for clients to fund pending contract milestones.
                </p>
                <Link to="/artisan/jobs" className="mt-4 inline-block">
                  <Button size="sm">Explore Marketplace</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {actionableMilestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge status={m.status}>{m.status.replace('_', ' ')}</Badge>
                        <span className="text-xs text-slate-400 font-mono">
                          #{m.contract.contractCode}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {m.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        Client: {m.contract.client?.clientProfile?.firstName} {m.contract.client?.clientProfile?.lastName} ({m.contract.client?.email})
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Milestone Value</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNgn(m.amount)}
                        </p>
                      </div>
                      <Link to={`/artisan/contracts/${m.contractId}`}>
                        <Button size="sm">Submit Proof</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Direct Invitations Feed */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Direct Client Invitations</CardTitle>
                <CardDescription>
                  Clients who specifically invited you to bid on their projects.
                </CardDescription>
              </div>
              <Link to="/artisan/jobs/invitations">
                <Button variant="ghost" size="sm">
                  Manage ({invitations.length})
                </Button>
              </Link>
            </CardHeader>

            {invitations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No direct invitations at the moment. Keep your profile updated to get discovered!
              </p>
            ) : (
              <div className="space-y-3">
                {invitations.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {inv.job?.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Budget: {formatNgn(inv.job?.budgetMin)} - {formatNgn(inv.job?.budgetMax)}
                      </p>
                    </div>
                    <Link to={`/artisan/jobs/${inv.jobId}`}>
                      <Button size="sm" variant="outline">
                        View & Propose
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Web3 Status & Quick Tools */}
        <div className="space-y-6">
          {/* Monad Testnet Escrow Card */}
          <Card className="border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-slate-900/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-purple-300">Monad Testnet Web3</CardTitle>
                  <CardDescription>Chain ID: 10143 (Decentralized Escrow)</CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 space-y-1">
                <span className="text-slate-400">Linked EVM Wallet:</span>
                <p className="font-mono text-purple-200 break-all font-semibold">
                  {user?.walletAddress || 'No Monad address linked yet'}
                </p>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Protocol:</span>
                <span className="font-semibold text-slate-200">ArtisanEscrow.sol</span>
              </div>

              <Link to="/artisan/profile" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full border-purple-500/40 text-purple-300">
                  Manage Web3 Address
                </Button>
              </Link>
            </div>
          </Card>

          {/* Quick Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle>Artisan Shortcuts</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              <Link to="/artisan/profile/services" className="block">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-500/10 dark:hover:bg-sky-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-colors flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Add Packaged Service Gigs
                  </span>
                  <Plus className="w-4 h-4 text-sky-500" />
                </div>
              </Link>

              <Link to="/artisan/profile/portfolio" className="block">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-500/10 dark:hover:bg-sky-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-colors flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Upload Portfolio Photos
                  </span>
                  <Plus className="w-4 h-4 text-sky-500" />
                </div>
              </Link>

              <Link to="/artisan/kyc" className="block">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-sky-500/10 dark:hover:bg-sky-950/40 border border-slate-200/80 dark:border-slate-700/80 transition-colors flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Identity KYC Status
                  </span>
                  <Badge variant={user?.isKycVerified ? 'emerald' : 'amber'}>
                    {user?.isKycVerified ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
