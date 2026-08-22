import React, { useState } from 'react';
import { Menu, Bell, Moon, Sun, Wallet as WalletIcon, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { shortenAddress, formatCurrency } from '../../lib/formatters';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const ClientHeader: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuthStore();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const walletBalance = user?.wallet?.availableBalance ? Number(user.wallet.availableBalance) : 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Fixmate
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Client Portal
          </span>
        </div>
      </div>

      {/* Right Controls: Post Job CTA, Wallet Balance, Monad Wallet, Theme, Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Post Job Shortcut Button */}
        <Link
          to="/client/jobs/post"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/20 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Post a Job</span>
        </Link>

        {/* Available Wallet Balance Link */}
        <Link
          to="/client/wallet"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          title="Wallet Balance (Click to manage)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{formatCurrency(walletBalance)}</span>
        </Link>

        {/* Monad Web3 Wallet Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <WalletIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>
            {user?.walletAddress ? shortenAddress(user.walletAddress) : 'Monad EVM'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Icon Link */}
        <Link
          to="/client/notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500" />
        </Link>
      </div>
    </header>
  );
};
