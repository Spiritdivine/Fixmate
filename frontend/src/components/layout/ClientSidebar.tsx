import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Bookmark,
  PlusCircle,
  Briefcase,
  FileCheck,
  Wallet,
  MessageSquare,
  AlertTriangle,
  Star,
  User,
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

export const ClientSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const profile = user?.clientProfile;

  const navItems = [
    { label: 'Overview', to: '/client/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Find Artisans', to: '/client/artisans', icon: <Search className="w-4 h-4" /> },
    { label: 'Post a New Job', to: '/client/jobs/post', icon: <PlusCircle className="w-4 h-4" />, highlight: true },
    { label: 'My Job Postings', to: '/client/jobs', icon: <Briefcase className="w-4 h-4" /> },
    { label: 'Saved Artisans', to: '/client/saved-artisans', icon: <Bookmark className="w-4 h-4" /> },
    { label: 'Contracts & Escrow', to: '/client/contracts', icon: <FileCheck className="w-4 h-4" /> },
    { label: 'Wallet & Payments', to: '/client/wallet', icon: <Wallet className="w-4 h-4" /> },
    { label: 'Live Messages', to: '/client/messages', icon: <MessageSquare className="w-4 h-4" /> },
    { label: 'Dispute Center', to: '/client/disputes', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: 'Reviews Given', to: '/client/reviews', icon: <Star className="w-4 h-4" /> },
    { label: 'Profile & Details', to: '/client/profile', icon: <User className="w-4 h-4" /> },
    { label: 'Notifications', to: '/client/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'Settings', to: '/client/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const clientDisplayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile?.companyName || user?.email?.split('@')[0] || 'Client';

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
                  Client Portal
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
                      : item.highlight
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                name={clientDisplayName}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {clientDisplayName}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {profile?.city ? `${profile.city}, ${profile.state || 'NG'}` : user?.email}
                </p>
              </div>
            </div>
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
