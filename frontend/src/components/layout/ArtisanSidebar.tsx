import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Send,
  FileCheck,
  Wallet,
  MessageSquare,
  AlertTriangle,
  Star,
  User,
  ShieldCheck,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArtisanSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const profile = user?.artisanProfile;

  const navItems = [
    { label: 'Overview', to: '/artisan/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Job Marketplace', to: '/artisan/jobs', icon: <Briefcase className="w-4 h-4" /> },
    { label: 'My Proposals', to: '/artisan/proposals', icon: <Send className="w-4 h-4" /> },
    { label: 'Contracts & Escrow', to: '/artisan/contracts', icon: <FileCheck className="w-4 h-4" /> },
    { label: 'Wallet & Payouts', to: '/artisan/wallet', icon: <Wallet className="w-4 h-4" /> },
    { label: 'Live Messages', to: '/artisan/messages', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Dispute Center', to: '/artisan/disputes', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: 'Reviews & Score', to: '/artisan/reviews', icon: <Star className="w-4 h-4" /> },
    { label: 'Profile & Services', to: '/artisan/profile', icon: <User className="w-4 h-4" /> },
    {
      label: 'KYC Verification',
      to: '/artisan/kyc',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: user?.isKycVerified ? 'Verified' : 'Pending',
      badgeColor: user?.isKycVerified ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10',
    },
    { label: 'Notifications', to: '/artisan/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'Settings', to: '/artisan/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 backdrop-blur-md',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  Fixmate
                </h1>
                <span className="text-[10px] font-semibold tracking-wider text-sky-600 dark:text-sky-400 uppercase">
                  Artisan Workspace
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group select-none',
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={clsx('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider', item.badgeColor)}>
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between gap-3 mb-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={user?.avatarUrl}
                name={profile?.businessName || user?.email || 'Artisan'}
                size="sm"
                isOnline={profile?.isAvailable}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {profile?.businessName || user?.email?.split('@')[0] || 'Artisan'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {profile?.lgaCity ? `${profile.lgaCity}, ${profile.state}` : user?.email}
                </p>
              </div>
            </div>
            {profile?.isAvailable && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Online & Available" />
            )}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
