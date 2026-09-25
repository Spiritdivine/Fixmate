import React from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <img
            src="/brand/artifix-icon-192.png"
            alt="Artifix App Icon"
            className="w-12 h-12 rounded-xl border border-slate-700 shadow"
          />
          <div>
            <h3 className="font-bold text-base text-white">Install Artifix App</h3>
            <p className="text-xs text-slate-400">Add to your iPhone Home Screen</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-slate-300">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">Step 1: Tap Share</p>
              <p className="text-slate-400 mt-0.5">Tap the Share icon in the Safari bottom menu toolbar.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">Step 2: Add to Home Screen</p>
              <p className="text-slate-400 mt-0.5">Scroll down the menu list and tap <strong className="text-white">"Add to Home Screen"</strong>.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold">
              ✓
            </div>
            <div>
              <p className="font-semibold text-slate-100">Step 3: Confirm</p>
              <p className="text-slate-400 mt-0.5">Tap <strong className="text-white">"Add"</strong> in the top-right corner to launch Artifix standalone.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition shadow-lg shadow-sky-500/20"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
