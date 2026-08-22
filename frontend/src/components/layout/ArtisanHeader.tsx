import React, { useState } from 'react';
import { Menu, Bell, Moon, Sun, Shield, Wallet as WalletIcon, CheckCircle, Radio } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../lib/api-client';
import { shortenAddress } from '../../lib/formatters';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const ArtisanHeader: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, updateUser } = useAuthStore();
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const profile = user?.artisanProfile;

  const toggleAvailability = async () => {
    if (!profile) return;
    try {
      setIsTogglingAvailability(true);
      const nextStatus = !profile.isAvailable;
      const { data } = await apiClient.patch('/profiles/artisan/availability', {
        isAvailable: nextStatus,
      });
      updateUser({
        artisanProfile: {
          ...profile,
          isAvailable: data.data.isAvailable,
        },
      });
    } catch (err) {
      console.error('Failed to toggle availability', err);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

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
            Artisan Portal
          </span>
        </div>
      </div>

      {/* Right Controls: Availability, Monad Wallet, Theme, Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Availability Toggle Switch */}
        <button
          onClick={toggleAvailability}
          disabled={isTogglingAvailability}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            profile?.isAvailable
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
          }`}
          title="Toggle your public availability for hire"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              profile?.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span className="hidden md:inline">
            {profile?.isAvailable ? 'Available for Hire' : 'Offline'}
          </span>
        </button>

        {/* Monad Web3 Wallet Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
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
          to="/artisan/notifications"
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
