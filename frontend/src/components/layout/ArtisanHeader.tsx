import React from 'react';
import { Menu, Bell, Search, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const ArtisanHeader: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuthStore();
  const profile = user?.artisanProfile;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[88px] px-8 bg-white border-b border-slate-100">
      {/* Left: Search Bar & Mobile Menu */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden sm:flex items-center max-w-md w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-5" />
          <input 
            type="text" 
            placeholder="Search task" 
            className="w-full h-12 pl-12 pr-14 bg-slate-50/80 hover:bg-slate-50 border-transparent focus:bg-white rounded-full text-sm font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
          />
          <div className="absolute right-3 flex items-center justify-center bg-white shadow-sm rounded px-2 py-1 text-[10px] font-bold text-slate-500">
            ⌘ F
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Messages */}
        <Link
          to="/artisan/messages"
          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 transition-all group"
        >
          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </Link>
        
        {/* Notifications */}
        <Link
          to="/artisan/notifications"
          className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 transition-all relative group"
        >
          <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
        </Link>

        {/* Profile */}
        <Link to="/artisan/profile" className="flex items-center gap-3 ml-3 pl-3 border-l border-slate-100">
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-slate-900 leading-tight">
              {profile?.businessName || user?.email?.split('@')[0] || 'Artisan'}
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              {user?.email}
            </p>
          </div>
          <Avatar
            src={user?.avatarUrl}
            name={profile?.businessName || user?.email || 'Artisan'}
            size="md"
          />
        </Link>
      </div>
    </header>
  );
};
