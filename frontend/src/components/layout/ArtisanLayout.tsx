import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ArtisanSidebar } from './ArtisanSidebar';
import { ArtisanHeader } from './ArtisanHeader';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../lib/socket';
import { Notification } from '../../types';
import { Bell } from 'lucide-react';

export const ArtisanLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  const { user, isInitialized } = useAuthStore();
  const navigate = useNavigate();

  // Force Light Mode for the Artisan Dashboard
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    return () => {
      // Re-add dark mode when leaving artisan dashboard (optional, if app defaults to dark)
      document.documentElement.classList.add('dark');
    };
  }, []);

  useEffect(() => {
    if (isInitialized && (!user || (user.role !== 'ARTISAN' && user.role !== 'ADMIN'))) {
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
      <div className="flex items-center justify-center min-h-screen bg-[#f4f7f6] text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Loading Fixmate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f9fafb] text-slate-900 font-sans overflow-hidden antialiased">
      {/* Toast Notification Popup */}
      {toastNotification && (
        <div
          onClick={() => {
            if (toastNotification.actionUrl) navigate(toastNotification.actionUrl);
            setToastNotification(null);
          }}
          className="fixed top-4 right-4 z-50 flex items-start gap-3 p-4 rounded-[24px] bg-white border border-emerald-500/20 shadow-2xl max-w-sm cursor-pointer animate-in slide-in-from-top-4 duration-200"
        >
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {toastNotification.title}
            </h4>
            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
              {toastNotification.body}
            </p>
          </div>
        </div>
      )}

      <ArtisanSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ArtisanHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
