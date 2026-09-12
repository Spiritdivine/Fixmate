import React, { useEffect, useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../lib/api-client';
import { Contract, JobInvitation, Wallet as WalletType } from '../../types';

// Widget Imports
import { StatCard } from '../../components/dashboard/StatCard';
import { EarningsAnalyticsChart } from '../../components/dashboard/EarningsAnalyticsChart';
import { RemindersWidget } from '../../components/dashboard/RemindersWidget';
import { RecentJobsWidget } from '../../components/dashboard/RecentJobsWidget';
import { ClientInteractionsWidget } from '../../components/dashboard/ClientInteractionsWidget';
import { JobProgressChart } from '../../components/dashboard/JobProgressChart';
import { TimeTrackerWidget } from '../../components/dashboard/TimeTrackerWidget';

export const DashboardOverview: React.FC = () => {
 const { user } = useAuthStore();
 const [wallet, setWallet] = useState<WalletType | null>(null);
 const [contracts, setContracts] = useState<Contract[]>([]);
 const [invitations, setInvitations] = useState<JobInvitation[]>([]);
 const [isLoading, setIsLoading] = useState(true);

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

 const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');
 const completedContracts = contracts.filter((c) => c.status === 'COMPLETED');
 
 // Calculate completion percentage
 const totalRelevantContracts = activeContracts.length + completedContracts.length;
 const completionRate = totalRelevantContracts > 0 
 ? Math.round((completedContracts.length / totalRelevantContracts) * 100) 
 : 0;

 // Mock analytics data for the chart (would come from API in real world)
 const analyticsData = [
 { day: 'S', value: 30000, fillType: 'striped' as const },
 { day: 'M', value: 45000, fillType: 'dark' as const },
 { day: 'T', value: 35000, fillType: 'light' as const, tooltip: '74%' },
 { day: 'W', value: 50000, fillType: 'dark' as const },
 { day: 'T', value: 25000, fillType: 'striped' as const },
 { day: 'F', value: 40000, fillType: 'striped' as const },
 { day: 'S', value: 20000, fillType: 'striped' as const },
 ];

 if (isLoading) {
 return (
 <div className="flex items-center justify-center h-[50vh]">
 <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-in fade-in duration-500">
 {/* Header Section */}
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
 <div>
 <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
 <p className="text-sm text-slate-500 mt-1">
 Plan, prioritize, and accomplish your tasks with ease.
 </p>
 </div>
 
 <div className="flex items-center gap-3">
 <button className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm">
 <Plus className="w-4 h-4" />
 <span>Add Project</span>
 </button>
 <button className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm">
 <Download className="w-4 h-4" />
 <span>Import Data</span>
 </button>
 </div>
 </div>

 {/* KPI Stats Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 <StatCard
 title="Total Jobs"
 value={contracts.length}
 trend={5}
 variant="primary"
 />
 <StatCard
 title="Completed Jobs"
 value={profile?.completedJobsCount || completedContracts.length}
 trend={12}
 />
 <StatCard
 title="Active Contracts"
 value={activeContracts.length}
 trend={-2}
 />
 <StatCard
 title="Pending Proposals"
 value={invitations.length}
 subtitle="On Discuss"
 />
 </div>

 {/* Main Content Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 {/* Left Column (Span 2) */}
 <div className="lg:col-span-2 flex flex-col gap-6">
 <div className="min-h-[280px] flex-1">
 <EarningsAnalyticsChart data={analyticsData} />
 </div>
 <div className="min-h-[280px] flex-1">
 <ClientInteractionsWidget contracts={contracts} />
 </div>
 </div>

 {/* Middle Column (Span 1) */}
 <div className="lg:col-span-1 flex flex-col gap-6">
 <div className="min-h-[200px]">
 <RemindersWidget invitations={invitations} />
 </div>
 <div className="min-h-[360px] flex-1">
 <JobProgressChart completedPercentage={completionRate} />
 </div>
 </div>

 {/* Right Column (Span 1) */}
 <div className="lg:col-span-1 flex flex-col gap-6">
 <div className="min-h-[360px] flex-1">
 <RecentJobsWidget contracts={contracts} />
 </div>
 <div className="min-h-[200px]">
 <TimeTrackerWidget />
 </div>
 </div>
 </div>
 </div>
 );
};
