import React, { useState } from 'react';
import { Menu, Bell, Moon, Sun, Wallet as WalletIcon, PlusCircle, Search, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { shortenAddress, formatCurrency } from '../../lib/formatters';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const ClientHeader: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuthStore();
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark(!isDark);
  const walletBalance = user?.wallet?.availableBalance || 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[88px] px-8 bg-white dark:bg-slate-900 border-b border-slate-100 ">
      {/* Left: Search Bar & Mobile Menu */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden sm:flex items-center max-w-md w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-5" />
          <input 
            type="text" 
            placeholder="Search task" 
            className="w-full h-12 pl-12 pr-14 bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 rounded-full text-sm font-medium outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-3 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm rounded px-2 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            ⌘ F
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Wallet Balance */}
        <Link
          to="/client/wallet"
          className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{formatCurrency(walletBalance)}</span>
        </Link>
        
        {/* Messages (Added to match design) */}
        <Link
          to="/client/messages"
          className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 transition-all group"
        >
          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 transition-all group"
        >
          {isDark ? <Sun className="w-4 h-4 group-hover:scale-110 transition-transform" /> : <Moon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
        </button>

        {/* Notifications */}
        <Link
          to="/client/notifications"
          className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 transition-all relative group"
        >
          <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
        </Link>

        {/* Profile */}
        <Link to="/client/profile" className="flex items-center gap-3 ml-3 pl-3 border-l border-slate-100 ">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {user?.clientProfile?.firstName ? `${user.clientProfile.firstName} ${user.clientProfile.lastName || ''}`.trim() : user?.email?.split('@')[0] || 'Client'}
            </p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {user?.email}
            </p>
          </div>
          <Avatar
            src={user?.avatarUrl}
            name={user?.email || 'Client'}
            size="md"
          />
        </Link>
      </div>
    </header>
  );
};
