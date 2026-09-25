import React, { useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
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
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/95 border border-sky-500/30 text-slate-100 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/brand/artifix-icon-192.png"
              alt="Artifix App"
              className="w-10 h-10 rounded-xl border border-slate-700 shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">Install Artifix App</h4>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-400">
                  <Sparkles className="w-2.5 h-2.5" /> Fast
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Instant escrow alerts & offline contract access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition shadow-md shadow-sky-500/20 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
