import React from 'react';
import { Share, PlusSquare, X, Check } from 'lucide-react';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-[#FAF7F0] dark:bg-[#141A16] border border-stone-200 dark:border-stone-800 p-6 text-[#141A16] dark:text-[#FAF7F0] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <img
            src="/brand/artifix-icon-192.png"
            alt="Artifix App Icon"
            className="w-12 h-12 rounded-xl border border-stone-200 dark:border-stone-700/80 shadow-sm p-1 bg-white dark:bg-stone-900 object-contain"
          />
          <div>
            <h3 className="font-bold text-base text-[#141A16] dark:text-white tracking-[-0.02em] flex items-center gap-1">
              <span>Install Arti</span>
              <span className="text-[#BD5324] dark:text-[#E07A4B]">fix</span>
            </h3>
            <p className="text-xs text-[#556259] dark:text-stone-400">Add to your iPhone Home Screen</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-[#556259] dark:text-stone-300">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-sm">
            <div className="p-2 rounded-lg bg-[#123E2A]/10 text-[#123E2A] dark:bg-[#123E2A]/30 dark:text-emerald-400 border border-[#123E2A]/20 shrink-0">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-[#141A16] dark:text-white">Step 1: Tap Share</p>
              <p className="text-[#556259] dark:text-stone-400 mt-0.5">Tap the Share icon in the Safari bottom menu toolbar.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-sm">
            <div className="p-2 rounded-lg bg-[#123E2A]/10 text-[#123E2A] dark:bg-[#123E2A]/30 dark:text-emerald-400 border border-[#123E2A]/20 shrink-0">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-[#141A16] dark:text-white">Step 2: Add to Home Screen</p>
              <p className="text-[#556259] dark:text-stone-400 mt-0.5">Scroll down the share options and tap <strong className="text-[#141A16] dark:text-white">"Add to Home Screen"</strong>.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-sm">
            <div className="p-2 rounded-lg bg-[#BD5324]/10 text-[#BD5324] dark:bg-[#BD5324]/30 dark:text-[#E07A4B] border border-[#BD5324]/20 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-[#141A16] dark:text-white">Step 3: Confirm</p>
              <p className="text-[#556259] dark:text-stone-400 mt-0.5">Tap <strong className="text-[#141A16] dark:text-white">"Add"</strong> in the top-right corner to launch Artifix standalone.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 px-4 rounded-full text-xs font-semibold bg-[#123E2A] hover:bg-[#0E3222] text-white transition-all shadow-md active:scale-95 cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
