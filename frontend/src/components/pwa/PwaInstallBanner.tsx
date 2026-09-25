import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { IosInstallModal } from './IosInstallModal';

export const PwaInstallBanner: React.FC = () => {
  const { canInstall, isIOS, isInstalled, isDismissed, promptInstall, dismiss } = usePWAInstall();
  const [showIosModal, setShowIosModal] = useState(false);

  if (isInstalled || isDismissed || !canInstall) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
    } else {
      await promptInstall();
    }
  };

  return (
    <>
      <div 
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-lg animate-in slide-in-from-top-4 fade-in duration-300"
        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
      >
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF7F0]/95 dark:bg-[#141A16]/95 border border-stone-200/90 dark:border-stone-800/90 text-[#141A16] dark:text-[#FAF7F0] shadow-xl shadow-stone-900/10 dark:shadow-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src="/brand/artifix-icon-192.png"
                alt="Artifix App"
                className="w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-700/80 shadow-sm object-contain bg-white dark:bg-stone-900 p-1"
              />
            </div>

            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-[#141A16] dark:text-white tracking-[-0.02em] flex items-center gap-1">
                <span>Arti</span>
                <span className="text-[#BD5324] dark:text-[#E07A4B]">fix</span>
                <span className="font-semibold text-stone-600 dark:text-stone-300 ml-0.5">App</span>
              </h4>
              <p className="text-[12px] text-[#556259] dark:text-stone-400 truncate mt-0.5 font-normal">
                Instant milestone alerts & offline job site access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#123E2A] hover:bg-[#0E3222] text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition cursor-pointer"
              aria-label="Dismiss installation prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <IosInstallModal isOpen={showIosModal} onClose={() => setShowIosModal(false)} />
    </>
  );
};
