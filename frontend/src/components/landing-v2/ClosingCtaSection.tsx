import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LANDING_IMAGES } from '../../assets/landing-assets';

interface ClosingCtaSectionProps {
  videoSrc?: string;
  posterSrc?: string;
}

export const ClosingCtaSection: React.FC<ClosingCtaSectionProps> = ({
  videoSrc,
  posterSrc,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <section 
      aria-label="Get started with Artifix"
      className="w-full py-14 sm:py-20 bg-[#FAF7F0] relative overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Curved Card Container with Cinematic Video Background */}
        <div className="bg-[#123E2A] text-white rounded-3xl sm:rounded-[36px] p-8 sm:p-14 lg:p-20 text-center relative overflow-hidden shadow-2xl">
          
          {/* ============================================================ */}
          {/* BACKGROUND VIDEO LAYER                                       */}
          {/* ============================================================ */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={posterSrc || LANDING_IMAGES.welder}
              className="absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-700 opacity-65"
              aria-hidden="true"
            >
              {videoSrc ? (
                <source src={videoSrc} type="video/mp4" />
              ) : (
                <>
                  <source src="/videos/artisan-loop.webm" type="video/webm" />
                  <source src="/videos/artisan-loop.mp4" type="video/mp4" />
                </>
              )}
            </video>

            {/* Deep Brand Green Gradient Overlay (Ensures AAA Text Legibility) */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#123E2A]/90 via-[#123E2A]/80 to-[#123E2A]/92 mix-blend-multiply" />
            <div className="absolute inset-0 bg-[#0F2D1F]/40 backdrop-blur-[0.5px]" />
          </div>

          {/* Subtle decorative glowing atmospheric polygons */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#1A5338] rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C2653E]/20 rounded-full blur-3xl opacity-40 pointer-events-none" />

          {/* ============================================================ */}
          {/* FOREGROUND CONTENT LAYER                                     */}
          {/* ============================================================ */}
          <div className="relative z-10 max-w-[760px] mx-auto">
            
            {/* Top Risk Reversal Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-[0.18em] uppercase mb-5 border border-white/10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              START WITH ZERO CASH ADVANCE RISK
            </div>

            {/* Main Headline */}
            <h2 
              className="text-3xl sm:text-4xl lg:text-[48px] font-bold text-white leading-[1.12] tracking-[-0.02em] mb-5 drop-shadow-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Ready to experience{' '}
              <span 
                className="font-serif italic font-normal text-[#E8D4C3]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                trust without compromise
              </span>?
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-stone-200 leading-[1.65] font-normal mb-8 max-w-[620px] mx-auto drop-shadow-xs">
              Join thousands of Nigerian homeowners, diaspora investors, and verified master craftsmen building a transparent, escrow-protected service economy.
            </p>

            {/* Dual Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <Link
                to="/register?role=CLIENT"
                className="inline-flex items-center gap-2 bg-[#FAF7F0] text-[#123E2A] text-xs sm:text-sm font-bold px-7 sm:px-8 py-3.5 rounded-full hover:bg-white transition-all shadow-lg active:scale-95 group"
              >
                <span>Find an Artisan Now</span>
                <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </Link>

              <Link
                to="/register?role=ARTISAN"
                className="inline-flex items-center border border-white/40 text-white text-xs sm:text-sm font-bold px-7 sm:px-8 py-3.5 rounded-full hover:bg-white/10 hover:border-white/70 transition-all active:scale-95"
              >
                Apply as a Verified Craftsman
              </Link>
            </div>

            {/* Trust Assurances Footer */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-300 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>No upfront subscription</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>Milestone escrow vault</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>48-hour dispute tribunal</span>
              </div>
            </div>

          </div>

          {/* Discreet Ambient Video Play/Pause Toggle (Bottom-Right) */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
            title={isPlaying ? 'Pause background video' : 'Play background video'}
            className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400 pointer-events-auto"
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

        </div>

      </div>
    </section>
  );
};

export default ClosingCtaSection;
