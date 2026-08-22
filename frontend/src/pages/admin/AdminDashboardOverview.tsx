import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  FileCheck,
  TrendingUp,
  CreditCard,
  Layers,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, AdminAnalyticsOverview } from '../../types';
import { useAdminStore } from '../../stores/adminStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AdminDashboardOverview: React.FC = () => {
  const [data, setData] = useState<AdminAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { systemHealth, fetchSystemHealth } = useAdminStore();

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<ApiResponse<AdminAnalyticsOverview>>('/admin/analytics/overview');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchSystemHealth();
  }, [fetchSystemHealth]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-purple-400">Loading Platform Intelligence & Telemetry...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalUsers: 0,
    totalArtisans: 0,
    totalClients: 0,
    pendingKycCount: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalContracts: 0,
    activeContracts: 0,
    disputedContracts: 0,
    completedContracts: 0,
    openDisputesCount: 0,
    pendingPayoutsCount: 0,
    grossVolume: 0,
    escrowFundedVolume: 0,
    escrowReleasedVolume: 0,
    escrowRefundedVolume: 0,
    platformFeesEarned: 0,
  };

  const isHealthy = systemHealth.status === 'ok' && systemHealth.dbStatus === 'ok';

  return (
    <div className="space-y-6">
      {/* Top Banner: Infrastructure Pulse & Quick Actions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Governance Console</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Fixmate Platform Telemetry
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time escrow transactions, compliance verification queue, and Monad smart contract state.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/admin/kyc">
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
            >
              Review KYC ({metrics.pendingKycCount})
            </Button>
          </Link>
          <Link to="/admin/disputes">
            <Button
              size="sm"
              variant="outline"
              className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold"
            >
              Arbitrate Disputes ({metrics.openDisputesCount})
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Escrow Volume */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Escrow Volume</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{formatCurrency(metrics.grossVolume)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-purple-400 font-medium">
            <span>Escrow In-Flight:</span>
            <span className="text-slate-300 font-bold">{formatCurrency(metrics.escrowFundedVolume)}</span>
          </div>
        </div>

        {/* Platform Commission Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Fees Earned</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-3">{formatCurrency(metrics.platformFeesEarned)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400 font-medium">
            <span>Released to Artisans:</span>
            <span className="text-slate-300 font-bold">{formatCurrency(metrics.escrowReleasedVolume)}</span>
          </div>
        </div>

        {/* Active Contracts / Escrows */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Contracts</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{metrics.activeContracts}</p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-medium">
            <span>Total: {metrics.totalContracts}</span>
            <span>•</span>
            <span className="text-emerald-400">{metrics.completedContracts} completed</span>
          </div>
        </div>

        {/* Total Registered Users */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Userbase</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{metrics.totalUsers}</p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-medium">
            <span className="text-purple-400">{metrics.totalArtisans} Artisans</span>
            <span>•</span>
            <span className="text-blue-400">{metrics.totalClients} Clients</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: Action Queues & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Actionable Queue Cards & Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* KYC Queue Card */}
            <Link
              to="/admin/kyc"
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Pending KYC</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-amber-400">{metrics.pendingKycCount}</span>
                <span className="text-[11px] text-slate-400">Submissions</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Identity & Nigerian NIN/BVN review</p>
            </Link>

            {/* Open Disputes Card */}
            <Link
              to="/admin/disputes"
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Open Disputes</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-rose-400">{metrics.openDisputesCount}</span>
                <span className="text-[11px] text-slate-400">Active cases</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Arbitration tribunal required</p>
            </Link>

            {/* Payouts Card */}
            <Link
              to="/admin/payouts"
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Pending Payouts</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-purple-400">{metrics.pendingPayoutsCount}</span>
                <span className="text-[11px] text-slate-400">Withdrawals</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Bank transfer reconciliation</p>
            </Link>
          </div>

          {/* Recent Contracts Section */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-purple-400" />
                <span>Recent Platform Contracts</span>
              </h3>
              <Link to="/admin/contracts" className="text-xs text-purple-400 hover:text-purple-300 font-semibold">
                View All Contracts →
              </Link>
            </div>

            {(!data?.recentContracts || data.recentContracts.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center">No contracts recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {data.recentContracts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200">#{c.contractCode}</span>
                      <p className="text-slate-400 text-[11px] truncate max-w-xs">{c.job?.title || 'Contract Job'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-400">{formatCurrency(c.totalAmount)}</p>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'default'} size="sm">
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Real-time Infrastructure Telemetry */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Infrastructure Telemetry</span>
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isHealthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {isHealthy ? '100% OPERATIONAL' : 'DEGRADED'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">PostgreSQL Database</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {systemHealth.dbStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Monad Testnet RPC (10143)</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {systemHealth.monadRpcStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Socket.io Gateway</span>
                <span className="font-bold text-purple-400">Active</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Last Telemetry Ping</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(systemHealth.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <Link to="/admin/health">
              <Button size="sm" variant="outline" className="w-full text-xs font-bold mt-2">
                Open Full Diagnostics Console
              </Button>
            </Link>
          </div>

          {/* Recent Audit Trail Snippet */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Audit Stream</h3>
              <Link to="/admin/audit-logs" className="text-[11px] text-purple-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {(!data?.recentAuditLogs || data.recentAuditLogs.length === 0) ? (
                <p className="text-[11px] text-slate-500 text-center py-2">No audit logs recorded yet.</p>
              ) : (
                data.recentAuditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-purple-400">{log.action}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 truncate mt-0.5">
                      Entity: {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
