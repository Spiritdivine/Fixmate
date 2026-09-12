import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency } from '../../lib/formatters';
import { ApiResponse, AdminAnalyticsOverview } from '../../types';
import { useAdminStore } from '../../stores/adminStore';
import { StatCard } from '../../components/dashboard/StatCard';
import { EarningsAnalyticsChart } from '../../components/dashboard/EarningsAnalyticsChart';
import { TimeTrackerWidget } from '../../components/dashboard/TimeTrackerWidget';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// --- Local Widgets for Admin ---

const AdminRemindersWidget: React.FC<{ pendingKyc: number; openDisputes: number }> = ({ pendingKyc, openDisputes }) => (
  <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col justify-between">
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Reminders</h3>
      
      {pendingKyc > 0 || openDisputes > 0 ? (
        <div>
          <h4 className="text-xl font-bold text-[#186644] leading-tight mb-2 pr-4">
            Action<br/>Required
          </h4>
          <p className="text-[13px] font-medium text-slate-500">
            {pendingKyc} KYC, {openDisputes} Disputes
          </p>
        </div>
      ) : (
        <div>
          <h4 className="text-xl font-bold text-[#186644] leading-tight mb-2 pr-4">
            All Caught<br/>Up
          </h4>
          <p className="text-[13px] font-medium text-slate-500">
            No pending actions
          </p>
        </div>
      )}
    </div>

    {pendingKyc > 0 || openDisputes > 0 ? (
      <Link 
        to={pendingKyc > 0 ? "/admin/kyc" : "/admin/disputes"}
        className="w-full mt-6 flex items-center justify-center gap-2 bg-[#186644] hover:bg-[#124d33] text-white py-3 rounded-full text-sm font-medium transition-colors shadow-sm"
      >
        <span>Review Now</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    ) : (
      <div className="w-full mt-6 flex items-center justify-center gap-2 bg-slate-100 text-slate-400 py-3 rounded-full text-sm font-medium shadow-sm">
        <span>Review Now</span>
      </div>
    )}
  </div>
);

const AdminSystemHealthWidget: React.FC<{ health: any }> = ({ health }) => {
  const isHealthy = health.status === 'ok' && health.dbStatus === 'ok';
  const data = [
    { name: 'Healthy', value: isHealthy ? 100 : 40 },
    { name: 'Issues', value: isHealthy ? 0 : 60 },
  ];
  const COLORS = ['#186644', '#f1f5f9'];

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col items-center">
      <div className="w-full flex justify-start mb-2">
        <h3 className="text-base font-semibold text-slate-800">System Health</h3>
      </div>
      
      <div className="w-[140px] h-[140px] relative flex flex-col items-center justify-center my-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value" stroke="none" cornerRadius={10}>
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-3xl font-bold text-slate-800">{isHealthy ? '100%' : '40%'}</div>
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <h4 className="text-lg font-bold text-slate-800 mb-2">{isHealthy ? 'Operational' : 'Degraded'}</h4>
        <p className="text-sm font-medium text-slate-500 leading-relaxed px-2">
          {isHealthy ? 'All systems are running normally.' : 'Some services are experiencing issues.'}
        </p>
      </div>
    </div>
  );
};

const AdminRecentContractsWidget: React.FC<{ contracts: any[] }> = ({ contracts }) => {
  const displayContracts = contracts.slice(0, 4);
  const getIconColor = (index: number) => {
    const colors = ['bg-amber-100 text-amber-600', 'bg-blue-100 text-emerald-700', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600'];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-slate-800">Recent Contracts</h3>
        <Link to="/admin/contracts" className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
          <span className="text-[11px] font-bold uppercase tracking-wider">See More</span>
        </Link>
      </div>
      <div className="flex-1 space-y-5">
        {displayContracts.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4">No recent contracts found.</div>
        ) : (
          displayContracts.map((contract, index) => (
            <div key={contract.id} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-[24px] flex items-center justify-center font-bold text-lg shrink-0 ${getIconColor(index)}`}>
                #
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-slate-800 truncate">{contract.job?.title || 'Platform Contract'}</h4>
                <div className="text-[13px] font-medium text-slate-500 mt-0.5">
                  Amount : <span className="text-[#186644]">{formatCurrency(contract.totalAmount)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminAuditLogWidget: React.FC<{ logs: any[] }> = ({ logs }) => {
  const displayLogs = logs.slice(0, 4);
  const getIconColor = (index: number) => {
    const colors = ['bg-amber-100 text-amber-600', 'bg-blue-100 text-emerald-700', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600'];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white p-6 rounded-[24px] shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-slate-800">Audit Logs</h3>
        <Link to="/admin/audit-logs" className="p-1 text-slate-400 hover:text-slate-800 transition-colors">
          <span className="text-[11px] font-bold uppercase tracking-wider">See More</span>
        </Link>
      </div>
      <div className="flex-1 space-y-5">
        {displayLogs.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4">No recent logs found.</div>
        ) : (
          displayLogs.map((log, index) => (
            <div key={log.id} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-[24px] flex items-center justify-center font-bold text-lg shrink-0 ${getIconColor(index)}`}>
                L
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-slate-800 truncate capitalize">{log.action.replace(/_/g, ' ')}</h4>
                <div className="text-[13px] font-medium text-slate-500 mt-0.5 truncate">
                  {log.entityType} ({log.entityId.slice(0, 8)}...)
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

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
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-emerald-600">Loading Telemetry...</p>
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

  const analyticsData = [
    { day: 'S', value: 30000, fillType: 'striped' as const },
    { day: 'M', value: 45000, fillType: 'dark' as const },
    { day: 'T', value: 35000, fillType: 'light' as const, tooltip: '74%' },
    { day: 'W', value: 50000, fillType: 'dark' as const },
    { day: 'T', value: 25000, fillType: 'striped' as const },
    { day: 'F', value: 40000, fillType: 'striped' as const },
    { day: 'S', value: 20000, fillType: 'striped' as const },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {error && (
        <div className="p-4 rounded-[24px] bg-rose-50 border border-rose-200 text-rose-600 text-xs">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Gross Escrow Volume"
          value={formatCurrency(metrics.grossVolume)}
          subtitle={`${formatCurrency(metrics.escrowFundedVolume)} In-Flight`}
          variant="primary"
        />
        <StatCard
          title="Platform Fees Earned"
          value={formatCurrency(metrics.platformFeesEarned)}
          subtitle="Total Revenue"
          trend={15}
        />
        <StatCard
          title="Active Contracts"
          value={metrics.activeContracts}
          subtitle={`${metrics.completedContracts} completed`}
        />
        <StatCard
          title="Total Userbase"
          value={metrics.totalUsers}
          subtitle={`${metrics.totalArtisans} Artisans, ${metrics.totalClients} Clients`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-[280px]">
            <EarningsAnalyticsChart data={analyticsData} />
          </div>
          <div className="h-[280px]">
            <AdminRecentContractsWidget contracts={data?.recentContracts || []} />
          </div>
        </div>

        {/* Middle Column (Span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="h-[200px]">
            <AdminRemindersWidget pendingKyc={metrics.pendingKycCount} openDisputes={metrics.openDisputesCount} />
          </div>
          <div className="h-[360px]">
            <AdminSystemHealthWidget health={systemHealth} />
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="h-[360px]">
            <AdminAuditLogWidget logs={data?.recentAuditLogs || []} />
          </div>
          <div className="h-[200px]">
            <TimeTrackerWidget />
          </div>
        </div>
      </div>
    </div>
  );
};
