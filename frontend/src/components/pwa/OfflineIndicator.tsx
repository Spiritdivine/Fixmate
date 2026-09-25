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
      }, 3500);
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
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full shadow-2xl text-xs font-medium bg-[#141A16]/95 text-emerald-300 backdrop-blur-xl border border-stone-700/60 animate-in fade-in slide-in-from-bottom duration-300"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        <span>Connected — Synchronized with Escrow</span>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Network status notification"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-2xl text-xs font-medium bg-[#141A16]/95 text-stone-200 backdrop-blur-xl border border-stone-700/60"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Field Offline Mode — Showing Cached Contracts & Details</span>
    </aside>
  );
};
