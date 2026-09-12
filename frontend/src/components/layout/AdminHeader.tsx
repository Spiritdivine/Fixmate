import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  ChevronDown,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAdminStore } from '../../stores/adminStore';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  onMenuClick: () => void;
}

export const AdminHeader: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const {
    systemHealth,
    fetchSystemHealth,
    fetchDashboardMetrics,
    pendingKycCount,
    openDisputesCount,
    pendingPayoutsCount,
    globalSearchQuery,
    setGlobalSearchQuery,
  } = useAdminStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchSystemHealth();
    fetchDashboardMetrics();
    const interval = setInterval(() => {
      fetchSystemHealth();
      fetchDashboardMetrics();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchSystemHealth, fetchDashboardMetrics]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchQuery.trim()) {
      navigate(`/admin/users?search=${encodeURIComponent(globalSearchQuery.trim())}`);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'Platform Overview & KPI Intelligence';
    if (path.includes('/admin/users/')) return 'User Deep Profile Dossier';
    if (path.includes('/admin/users')) return 'User Directory & Moderation';
    if (path.includes('/admin/kyc')) return 'Identity Verification & Compliance Queue';
    if (path.includes('/admin/disputes/')) return 'Arbitration Courtroom & Settlement Engine';
    if (path.includes('/admin/disputes')) return 'Dispute Arbitration Center';
    if (path.includes('/admin/reviews')) return 'Review Moderation & Trust Safety';
    if (path.includes('/admin/categories')) return 'Taxonomy & Category Manager';
    if (path.includes('/admin/skills')) return 'Skills Catalog Manager';
    if (path.includes('/admin/contracts/')) return 'Contract & Escrow Timeline';
    if (path.includes('/admin/contracts')) return 'Contracts & Escrow Oversight';
    if (path.includes('/admin/transactions')) return 'Financial Transactions Ledger';
    if (path.includes('/admin/payouts')) return 'Artisan Payouts Moderation';
    if (path.includes('/admin/monad-escrow')) return 'Monad Web3 Blockchain Explorer';
    if (path.includes('/admin/audit-logs')) return 'System Audit Trail & State History';
    if (path.includes('/admin/settings')) return 'Dynamic System Parameters';
    if (path.includes('/admin/health')) return 'Production Health & RPC Diagnostics';
    return 'Admin Management Console';
  };

  const isHealthy = systemHealth.status === 'ok' && systemHealth.dbStatus === 'ok';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[88px] px-8 bg-white dark:bg-slate-900 border-b border-slate-100 ">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center max-w-md w-full relative">
          <Search className="absolute left-5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users, emails..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-14 bg-slate-950/50 hover:bg-slate-950/80 border-transparent focus:bg-slate-950 rounded-full text-sm font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-500 text-slate-200"
          />
          <div className="absolute right-3 flex items-center justify-center bg-slate-800 border border-slate-700 shadow-sm rounded px-2 py-1 text-[10px] font-bold text-slate-400">
            ⌘ F
          </div>
        </form>
      </div>

      {/* Right: Health Status & Admin Controls */}
      <div className="flex items-center gap-3">
        {/* Health Status (Hidden on small screens) */}
        <button
          onClick={() => navigate('/admin/health')}
          title="Inspect System Health Diagnostics"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/50 hover:bg-slate-950 text-xs transition-colors"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-semibold text-slate-300">
            {isHealthy ? 'Health: OK' : 'Degraded'}
          </span>
        </button>

        {/* Notifications / Alerts */}
        <div className="relative group">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-3 bg-slate-950/50 hover:bg-slate-950 rounded-full text-slate-400 transition-all"
          >
            <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {(pendingKycCount > 0 || openDisputesCount > 0) && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-slate-900" />
            )}
          </button>
          
          {isDropdownOpen && (pendingKycCount > 0 || openDisputesCount > 0) && (
             <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-[24px] shadow-2xl p-2 z-50 text-xs">
                {pendingKycCount > 0 && (
                  <button onClick={() => { setIsDropdownOpen(false); navigate('/admin/kyc'); }} className="w-full flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{pendingKycCount} KYC Pending</span>
                  </button>
                )}
                {openDisputesCount > 0 && (
                  <button onClick={() => { setIsDropdownOpen(false); navigate('/admin/disputes'); }} className="w-full flex items-center gap-2 p-2 hover:bg-slate-800 rounded-xl text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{openDisputesCount} Open Disputes</span>
                  </button>
                )}
             </div>
          )}
        </div>

        {/* Admin User Profile */}
        <Link to="/admin/settings" className="flex items-center gap-3 ml-3 pl-3 border-l border-slate-800">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-200 leading-tight">
              {user?.email?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              {user?.role} Superuser
            </p>
          </div>
          <Avatar
            src={user?.avatarUrl}
            name={user?.email || 'Admin'}
            size="md"
            className="ring-1 ring-purple-500/50"
          />
        </Link>
      </div>
    </header>
  );
};
