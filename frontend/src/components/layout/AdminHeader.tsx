import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  ChevronDown,
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
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 px-4 sm:px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shrink-0">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">{getPageTitle()}</h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">Fixmate Escrow Marketplace Governance</p>
        </div>
      </div>

      {/* Center: Quick Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users, emails, references..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500 transition-colors"
          />
        </div>
      </form>

      {/* Right: Health Status & Admin Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Node & DB Status Pill */}
        <button
          onClick={() => navigate('/admin/health')}
          title="Inspect System Health Diagnostics"
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-colors text-xs"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-semibold text-slate-300">
            {isHealthy ? 'Monad & DB: OK' : 'Degraded'}
          </span>
          <Activity className="w-3.5 h-3.5 text-purple-400" />
        </button>

        {/* Pending Alerts Quick Trigger */}
        {(pendingKycCount > 0 || openDisputesCount > 0 || pendingPayoutsCount > 0) && (
          <div className="flex items-center gap-1">
            {pendingKycCount > 0 && (
              <button
                onClick={() => navigate('/admin/kyc')}
                className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/20 transition-colors"
                title={`${pendingKycCount} Pending KYC Submissions`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{pendingKycCount} KYC</span>
              </button>
            )}
            {openDisputesCount > 0 && (
              <button
                onClick={() => navigate('/admin/disputes')}
                className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                title={`${openDisputesCount} Open Disputes`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{openDisputesCount} DSP</span>
              </button>
            )}
          </div>
        )}

        {/* Admin User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Avatar
              src={user?.avatarUrl}
              name={user?.email || 'Admin'}
              size="sm"
              className="ring-1 ring-purple-500/50"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 text-xs">
              <div className="p-2.5 border-b border-slate-800">
                <p className="font-bold text-white truncate">{user?.email}</p>
                <span className="inline-block px-1.5 py-0.5 mt-1 text-[10px] font-semibold rounded-md bg-purple-500/20 text-purple-400">
                  {user?.role} Superuser
                </span>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/admin/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  System Settings
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/admin/health');
                  }}
                  className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Health Diagnostics
                </button>
              </div>
              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
