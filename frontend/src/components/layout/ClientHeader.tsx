import React from 'react';
import { Menu, Bell, Search, MessageSquare, Plus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency } from '../../lib/formatters';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const ClientHeader: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuthStore();
  const profile = user?.clientProfile;
  const walletBalance = user?.wallet?.availableBalance || 0;

  const clientDisplayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile?.companyName || user?.email?.split('@')[0] || 'Client';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[88px] px-8 bg-white border-b border-slate-100 font-dashboard">
      {/* Left: Search Bar & Mobile Menu */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center max-w-md w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search artisans, jobs, or contracts..."
            className="w-full h-12 pl-12 pr-14 bg-slate-50/80 hover:bg-slate-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-full text-sm font-medium outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-3 flex items-center justify-center bg-white shadow-xs rounded px-2 py-1 text-[10px] font-bold text-slate-400 border border-slate-100 pointer-events-none">
            ⌘ F
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Post Job Quick CTA */}
        <Link
          to="/client/jobs/post"
          className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post Job</span>
        </Link>

        {/* Wallet Balance Badge */}
        <Link
          to="/client/wallet"
          className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-500/20"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{formatCurrency(walletBalance)}</span>
        </Link>

        {/* Messages */}
        <Link
          to="/client/messages"
          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 transition-all group"
        >
          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </Link>

        {/* Notifications */}
        <Link
          to="/client/notifications"
          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 transition-all relative group"
        >
          <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
        </Link>

        {/* Profile */}
        <Link to="/client/profile" className="flex items-center gap-3 ml-3 pl-3 border-l border-slate-100">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {clientDisplayName}
            </p>
            <p className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]">
              {user?.email}
            </p>
          </div>
          <Avatar
            src={user?.avatarUrl}
            name={clientDisplayName}
            size="md"
          />
        </Link>
      </div>
    </header>
  );
};
