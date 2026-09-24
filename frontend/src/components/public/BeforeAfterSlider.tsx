import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  title?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After Proof',
  title,
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const clampedPercentage = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(clampedPercentage);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  }, [isDragging, handleMove]);

  return (
    <div className={`relative overflow-hidden rounded-2xl select-none bg-stone-100 ${className}`}>
      {/* Title Header if provided */}
      {title && (
        <div className="absolute top-3 left-3.5 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-semibold">
          {title}
        </div>
      )}

      {/* Main Comparison Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[320px] sm:h-[400px] cursor-ew-resize overflow-hidden"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Background Layer: AFTER Image (Revealed on Right) */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        <div className="absolute top-3 right-3 z-10 bg-[#123E2A]/85 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-sm pointer-events-none">
          {afterLabel}
        </div>

        {/* Foreground Layer: BEFORE Image (Clipped by sliderPosition) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none max-w-none"
            style={{
              width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              height: '100%',
            }}
          />

          <div className="absolute top-3 left-3 z-10 bg-[#141A16]/85 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {beforeLabel}
          </div>
        </div>

        {/* Vertical Divider Line & Handle */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[#123E2A] shadow-xl flex items-center justify-center border-2 border-[#123E2A]/20 transition-transform active:scale-95">
            <ChevronsLeftRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Bottom Helper Hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm text-white/90 text-[10px] px-3 py-1 rounded-full pointer-events-none">
          Drag slider to compare transformation
        </div>
      </div>
    </div>
  );
};
