import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  showcaseTitle?: React.ReactNode;
  showcaseSubtitle?: string;
  showcasePills?: string[];
  showcaseFooter?: string;
}

const DEFAULT_PILLS = [
  'Escrow Milestones',
  'Verified Artisans',
  'Instant Payouts',
  'Background Checks',
  'Dispute Protection',
  'Monad Web3',
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  showcaseTitle = (
    <>
      Build <span className="text-[#34d399]">trust.</span>
      <br />
      Work safely.
    </>
  ),
  showcaseSubtitle = 'Hire vetted artisans, protect project funds with milestone escrow, and enjoy guaranteed quality delivery across every trade.',
  showcasePills = DEFAULT_PILLS,
  showcaseFooter = 'Milestone escrow payments secured on Monad blockchain.',
}) => {
  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col lg:flex-row font-sans selection:bg-[#0e3827] selection:text-white relative overflow-x-hidden">
      {/* ============================================================ */}
      {/* 1. LEFT SHOWCASE CARD (Desktop >= lg)                         */}
      {/* ============================================================ */}
      <div className="hidden lg:flex lg:w-1/2 p-3 sm:p-4 lg:p-5 h-screen sticky top-0">
        <div className="w-full h-full bg-[#0e3524] rounded-[32px] p-8 sm:p-12 lg:p-14 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl border border-emerald-950/20">
          {/* Bespoke Architectural Construction Background Drawing Layer */}
          <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
            <img
              src="/images/auth/engineer-construction-sketch.jpg?v=2"
              alt=""
              className="w-full h-full object-cover object-center opacity-75 filter contrast-110"
            />
            {/* Deep rich forest gradient vignette to ensure crystal clear text contrast on left side */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0e3524] via-[#0e3524]/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e3524] via-transparent to-[#0e3524]/40" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          {/* Top Logo */}
          <div className="relative z-10">
            <Link
              to="/"
              className="inline-block group focus:outline-none focus:ring-2 focus:ring-white/40 rounded-lg"
              aria-label="Artifix Home"
            >
              <img
                src="/brand/logo1-dark.png"
                alt="Artifix"
                className="h-9 lg:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Middle Content: Title, Subtitle, Feature Pills */}
          <div className="relative z-10 my-auto py-6">
            <h1
              style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
              className="text-4xl lg:text-[46px] xl:text-[50px] font-extrabold tracking-tight leading-[1.1] text-white"
            >
              {showcaseTitle}
            </h1>

            <p
              style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
              className="text-sm lg:text-[15px] text-emerald-100/80 leading-relaxed max-w-md mt-5"
            >
              {showcaseSubtitle}
            </p>

            {/* Feature Pills (2 Rows) */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5 mt-8 max-w-lg">
              {showcasePills.map((pill, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-xs text-xs sm:text-[13px] font-medium text-white/90 border border-white/10 transition-colors select-none font-['Plus_Jakarta_Sans',system-ui,sans-serif]"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Footer Note + Subtle Pill Bar */}
          <div className="relative z-10 pt-4">
            <p className="text-xs text-emerald-200/70 font-normal">
              {showcaseFooter}
            </p>
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-6" />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. RIGHT FORM CONTAINER (With Architectural Drawings)        */}
      {/* ============================================================ */}
      <div className="w-full lg:w-1/2 min-h-screen lg:h-screen lg:overflow-y-auto flex flex-col items-center justify-between px-5 sm:px-8 lg:px-12 py-10 lg:py-12 bg-white relative">
        {/* Background Architectural Drawings (Built from scratch, NOT cropped screenshot) */}
        {/* Top-Right: Construction Tower Crane (lattice boom extending over top-right corner) */}
        <div className="hidden sm:block absolute top-0 right-0 pointer-events-none select-none overflow-hidden z-0 w-[420px] sm:w-[480px] lg:w-[540px] h-[260px] sm:h-[300px]">
          <img
            src="/images/auth/crane-sketch.png?v=2"
            alt=""
            className="w-full h-full object-contain object-top-right opacity-45 mix-blend-multiply transform translate-x-28 -translate-y-8 scale-125"
          />
        </div>

        {/* Bottom-Right: Construction Hard Hat / Safety Helmet (nestled in bottom-right corner) */}
        <div className="hidden sm:block absolute bottom-0 right-0 pointer-events-none select-none overflow-hidden z-0 w-[300px] sm:w-[360px] lg:w-[420px] h-[260px] sm:h-[300px]">
          <img
            src="/images/auth/helmet-sketch.png?v=2"
            alt=""
            className="w-full h-full object-contain object-bottom-right opacity-45 mix-blend-multiply transform translate-x-10 translate-y-10 scale-105"
          />
        </div>

        {/* Top Logo for Mobile Screens (< lg) */}
        <div className="lg:hidden w-full max-w-[460px] flex justify-center mb-6 relative z-10">
          <Link to="/" className="inline-block group focus:outline-none" aria-label="Artifix Home">
            <img
              src="/brand/logo1.png"
              alt="Artifix"
              className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Center Auth Card / Form Body */}
        <div className="w-full max-w-[460px] my-auto relative z-10">
          {children}
        </div>

        {/* Subtle bottom spacing filler */}
        <div className="w-full h-2 relative z-10" />
      </div>
    </div>
  );
};

