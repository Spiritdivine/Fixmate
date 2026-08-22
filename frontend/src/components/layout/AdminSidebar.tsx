import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  AlertTriangle,
  Star,
  FolderTree,
  Tag,
  FileCheck,
  Receipt,
  CreditCard,
  Layers,
  FileText,
  Sliders,
  Activity,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/authStore';
import { useAdminStore } from '../../stores/adminStore';
import { Avatar } from '../ui/Avatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const { pendingKycCount, openDisputesCount, pendingPayoutsCount } = useAdminStore();

  const navSections = [
    {
      title: 'CORE INTELLIGENCE',
      items: [
        { label: 'Platform Overview', to: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'IDENTITY & COMPLIANCE',
      items: [
        { label: 'User Directory', to: '/admin/users', icon: <Users className="w-4 h-4" /> },
        {
          label: 'KYC Verification',
          to: '/admin/kyc',
          icon: <ShieldCheck className="w-4 h-4" />,
          badge: pendingKycCount > 0 ? pendingKycCount : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          label: 'Dispute Arbitration',
          to: '/admin/disputes',
          icon: <AlertTriangle className="w-4 h-4" />,
          badge: openDisputesCount > 0 ? openDisputesCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        { label: 'Review Moderation', to: '/admin/reviews', icon: <Star className="w-4 h-4" /> },
      ],
    },
    {
      title: 'MARKETPLACE & TAXONOMY',
      items: [
        { label: 'Categories Manager', to: '/admin/categories', icon: <FolderTree className="w-4 h-4" /> },
        { label: 'Skills Catalog', to: '/admin/skills', icon: <Tag className="w-4 h-4" /> },
        { label: 'Contracts & Escrow', to: '/admin/contracts', icon: <FileCheck className="w-4 h-4" /> },
      ],
    },
    {
      title: 'FINANCIAL OPERATIONS',
      items: [
        { label: 'Transactions Ledger', to: '/admin/transactions', icon: <Receipt className="w-4 h-4" /> },
        {
          label: 'Artisan Payouts',
          to: '/admin/payouts',
          icon: <CreditCard className="w-4 h-4" />,
          badge: pendingPayoutsCount > 0 ? pendingPayoutsCount : undefined,
          badgeColor: 'bg-purple-500 text-white',
        },
        { label: 'Monad Web3 Explorer', to: '/admin/monad-escrow', icon: <Layers className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SYSTEM GOVERNANCE',
      items: [
        { label: 'Audit Trail', to: '/admin/audit-logs', icon: <FileText className="w-4 h-4" /> },
        { label: 'Platform Settings', to: '/admin/settings', icon: <Sliders className="w-4 h-4" /> },
        { label: 'System Health Probe', to: '/admin/health', icon: <Activity className="w-4 h-4" /> },
      ],
    },
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
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-18 border-b border-slate-800 shrink-0 bg-slate-950/80">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">Fixmate Admin</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold tracking-wider text-purple-400 uppercase">
                {user?.role || 'ADMIN'} CONSOLE
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Nav Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </p>
              <div className="mt-1.5 space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
                        isActive
                          ? 'bg-purple-600/15 text-purple-400 border border-purple-500/30'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={clsx(
                              'transition-colors',
                              isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'
                            )}
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.badge !== undefined && (
                            <span
                              className={clsx(
                                'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
                                item.badgeColor || 'bg-purple-500 text-white'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={user?.avatarUrl}
                name={user?.email || 'Admin'}
                size="sm"
                className="ring-1 ring-purple-500/40 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.email}</p>
                <span className="inline-flex items-center text-[10px] font-medium text-purple-400">
                  {user?.role} Access
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
