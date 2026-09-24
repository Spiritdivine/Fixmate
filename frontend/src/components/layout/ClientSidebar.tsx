import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  Search,
  Bookmark,
  FileText,
  Wallet,
  MessageSquare,
  AlertOctagon,
  Star,
  User,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { FixmateLogo } from '../ui/FixmateLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
}

export const ClientSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuthStore();

  const menuItems: NavItem[] = [
    { label: 'Dashboard', to: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Post a Job', to: '/client/jobs/post', icon: <PlusCircle className="w-5 h-5" /> },
    { label: 'My Jobs', to: '/client/jobs', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Find Artisans', to: '/client/artisans', icon: <Search className="w-5 h-5" /> },
    { label: 'Saved Artisans', to: '/client/saved-artisans', icon: <Bookmark className="w-5 h-5" /> },
    { label: 'Contracts', to: '/client/contracts', icon: <FileText className="w-5 h-5" /> },
    { label: 'Wallet', to: '/client/wallet', icon: <Wallet className="w-5 h-5" /> },
    { label: 'Messages', to: '/client/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Disputes', to: '/client/disputes', icon: <AlertOctagon className="w-5 h-5" /> },
    { label: 'Reviews', to: '/client/reviews', icon: <Star className="w-5 h-5" /> },
    { label: 'Profile', to: '/client/profile', icon: <User className="w-5 h-5" /> },
  ];

  const generalItems: NavItem[] = [
    { label: 'Notifications', to: '/client/notifications', icon: <Bell className="w-5 h-5" /> },
    { label: 'Settings', to: '/client/settings', icon: <Settings className="w-5 h-5" /> },
    { label: 'Help', to: '/client/help', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 border-r border-slate-100 font-dashboard',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex-1 flex flex-col overflow-y-auto px-6">
          {/* Brand Header */}
          <div className="py-7 flex items-center">
            <FixmateLogo size="lg" />
          </div>

          {/* Navigation Links - MENU */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 mb-4 tracking-wider">MENU</h3>
            <nav className="space-y-1.5">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors relative select-none',
                      isActive
                        ? 'text-emerald-800 bg-emerald-50 font-semibold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-700 rounded-r-md" />
                      )}
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-emerald-700' : ''}>{item.icon}</span>
                        <span className={isActive ? 'font-semibold text-slate-900' : ''}>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Navigation Links - GENERAL */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 mb-4 tracking-wider">GENERAL</h3>
            <nav className="space-y-1.5">
              {generalItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors relative select-none',
                      isActive
                        ? 'text-emerald-800 bg-emerald-50 font-semibold'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-700 rounded-r-md" />
                      )}
                      <span className={isActive ? 'text-emerald-700' : ''}>{item.icon}</span>
                      <span className={isActive ? 'font-semibold text-slate-900' : ''}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer select-none"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Download Banner */}
        <div className="p-6 pt-2">
          <div className="p-5 rounded-[24px] bg-gradient-to-br from-slate-900 to-emerald-950 text-white relative overflow-hidden shadow-lg border border-emerald-900/50">
            {/* Decorative background shapes */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-start text-left gap-1 mb-4">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 mb-1 inline-flex text-white">
                
              </div>
              <h4 className="font-bold text-sm leading-tight font-dashboard">
                Download our<br />Mobile App
              </h4>
              <p className="text-[10px] text-slate-300">Hire artisans on the go</p>
            </div>

            <button className="relative z-10 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer">
              Download
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
