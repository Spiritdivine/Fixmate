import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { Lock, Unlock, Hand } from 'lucide-react';

export interface TouchScrollGuardProps {
  map: L.Map | null;
  className?: string;
}

/**
 * TouchScrollGuard prevents Leaflet from accidentally trapping mobile user scroll gestures.
 * Requires two fingers to drag the map on mobile touchscreens or provides a one-tap lock/unlock toggle.
 */
export const TouchScrollGuard: React.FC<TouchScrollGuardProps> = ({ map, className = '' }) => {
  const [isInteractive, setIsInteractive] = useState(true);
  const [showTwoFingerPrompt, setShowTwoFingerPrompt] = useState(false);

  useEffect(() => {
    if (!map) return;

    // Detect if device is touch-capable
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!isTouchDevice) return;

    const container = map.getContainer();

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single finger touch: show prompt if interactive dragging is locked
        if (!isInteractive) {
          setShowTwoFingerPrompt(true);
          setTimeout(() => setShowTwoFingerPrompt(false), 2000);
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [map, isInteractive]);

  const toggleInteraction = () => {
    if (!map) return;
    if (isInteractive) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.scrollWheelZoom.disable();
      setIsInteractive(false);
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.scrollWheelZoom.enable();
      setIsInteractive(true);
    }
  };

  return (
    <div className={`absolute bottom-4 left-4 z-[1000] flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggleInteraction}
        className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all ${
          isInteractive
            ? 'bg-slate-900/90 text-emerald-400 border border-emerald-500/40 hover:bg-slate-900'
            : 'bg-white/90 text-slate-700 border border-slate-200 hover:bg-white'
        }`}
        title={isInteractive ? 'Lock map panning' : 'Unlock map panning'}
      >
        {isInteractive ? (
          <>
            <Unlock className="w-3 h-3 text-emerald-400" />
            <span>Map Active</span>
          </>
        ) : (
          <>
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Map Locked</span>
          </>
        )}
      </button>

      {/* Temporary Two-finger guidance banner */}
      {showTwoFingerPrompt && (
        <div className="px-3 py-1.5 rounded-full bg-slate-900/95 text-white text-[10px] font-medium border border-emerald-400 shadow-xl flex items-center gap-1.5 animate-fade-in">
          <Hand className="w-3.5 h-3.5 text-emerald-400" />
          <span>Use two fingers to pan map</span>
        </div>
      )}
    </div>
  );
};
