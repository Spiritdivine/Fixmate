import React from 'react';
import { WifiOff, FileText, MapPin, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArtifixLogo } from '../ui/FixmateLogo';

export const OfflineFallbackPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div 
      className="min-h-[85vh] flex items-center justify-center p-4 bg-[#FAF7F0] dark:bg-[#141A16] text-[#141A16] dark:text-[#FAF7F0]"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-xl text-center">
        {/* Brand Lockup */}
        <div className="flex justify-center mb-6">
          <ArtifixLogo size="lg" />
        </div>

        {/* Offline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-[#556259] dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-xs font-semibold mb-4">
          <WifiOff className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
          <span>Field Offline Mode</span>
        </div>

        <h2 className="text-2xl font-bold text-[#141A16] dark:text-white tracking-[-0.02em] mb-2">
          Working Without Internet
        </h2>
        <p className="text-xs sm:text-sm text-[#556259] dark:text-stone-400 mb-6 leading-relaxed font-normal">
          No cellular connection detected. Artifix has cached your active escrow milestones, client contacts, and map coordinates locally.
        </p>

        {/* Cached Capabilities List */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F0] dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
            <FileText className="w-4 h-4 text-[#123E2A] dark:text-emerald-400 mb-1.5" />
            <p className="text-xs font-bold text-[#141A16] dark:text-white">Active Contracts</p>
            <p className="text-[11px] text-[#556259] dark:text-stone-400 font-normal">Cached on device</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FAF7F0] dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
            <MapPin className="w-4 h-4 text-[#BD5324] dark:text-[#E07A4B] mb-1.5" />
            <p className="text-xs font-bold text-[#141A16] dark:text-white">Offline Maps</p>
            <p className="text-[11px] text-[#556259] dark:text-stone-400 font-normal">Coordinates saved</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/artisan/contracts')}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#123E2A] hover:bg-[#0E3222] text-white text-xs font-semibold py-3 px-4 rounded-full transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Saved Contracts</span>
          </button>
          <button
            onClick={handleRetry}
            className="w-full inline-flex items-center justify-center gap-2 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold py-3 px-4 rounded-full transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
