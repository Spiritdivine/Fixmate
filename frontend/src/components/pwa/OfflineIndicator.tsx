import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowRestored(false);
    } else if (wasOffline) {
      // Just came back online
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showRestored) {
    return null;
  }

  if (showRestored) {
    return (
      <aside
        aria-label="Network status notification"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/30 animate-in fade-in slide-in-from-bottom duration-300"
      >
        <Wifi className="w-4 h-4" />
        <span>Connection Restored — Synchronized</span>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Network status notification"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold bg-amber-500/95 text-slate-950 backdrop-blur-md border border-amber-300/40 animate-pulse duration-1000"
    >
      <WifiOff className="w-4 h-4 text-slate-950" />
      <span>Offline Mode — Showing Cached Contracts & Data</span>
    </aside>
  );
};
