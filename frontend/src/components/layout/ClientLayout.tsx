import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ClientSidebar } from './ClientSidebar';
import { ClientHeader } from './ClientHeader';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../lib/socket';
import { Notification } from '../../types';
import { Bell } from 'lucide-react';

export const ClientLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  const { user, isInitialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && (!user || (user.role !== 'CLIENT' && user.role !== 'ADMIN'))) {
      navigate('/login');
    }
  }, [user, isInitialized, navigate]);

  useEffect(() => {
    const socket = getSocket();
    const handleNotification = (notif: Notification) => {
      setToastNotification(notif);
      setTimeout(() => setToastNotification(null), 6000);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading Fixmate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Toast Notification Popup */}
      {toastNotification && (
        <div
          onClick={() => {
            if (toastNotification.actionUrl) navigate(toastNotification.actionUrl);
            setToastNotification(null);
          }}
          className="fixed top-4 right-4 z-50 flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-500/40 shadow-2xl max-w-sm cursor-pointer animate-in slide-in-from-top-4 duration-200"
        >
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {toastNotification.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
              {toastNotification.body}
            </p>
          </div>
        </div>
      )}

      <ClientSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72 flex flex-col flex-1 min-w-0">
        <ClientHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
