import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Modular Full-Page Landing V2 Sections
import { CategoryGridSection } from '../components/landing-v2/CategoryGridSection';
import { HowItWorksSection } from '../components/landing-v2/HowItWorksSection';
import { SponsorBarSection } from '../components/landing-v2/SponsorBarSection';
import { DualPerspectiveSection } from '../components/landing-v2/DualPerspectiveSection';
import { TradesShowcaseSection } from '../components/landing-v2/TradesShowcaseSection';
import { TrustInfrastructureSection } from '../components/landing-v2/TrustInfrastructureSection';
import { SocialProofSection } from '../components/landing-v2/SocialProofSection';
import { FaqSection } from '../components/landing-v2/FaqSection';
import { ClosingCtaSection } from '../components/landing-v2/ClosingCtaSection';
import { EditorialFooter } from '../components/landing-v2/EditorialFooter';

export function LandingPageV2() {
  const [activeTab, setActiveTab] = useState<'home' | 'how' | 'artisans' | 'customers' | 'about'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key press and prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#141A16] font-sans antialiased selection:bg-[#133E2B] selection:text-white flex flex-col justify-between overflow-x-clip scroll-smooth">
      
      {/* ============================================================ */}
      {/* 1. TOP HEADER / NAVIGATION                                  */}
      {/* ============================================================ */}
      <header className="w-full relative z-40 bg-[#FAF7F0]/95 backdrop-blur-md sticky top-0 border-b border-stone-200/50">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-4 pb-3 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Left Brand Logo */}
          <Link to="/v2" className="flex items-center group select-none shrink-0" aria-label="Artifix Home">
            <img
              src="/brand/logo1.png"
              alt="Artifix"
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>

          {/* Center Navigation Links (Visible on tablet & desktop >= md) */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-8 text-xs lg:text-[13px] font-medium text-stone-600">
            <a
              href="#home"
              onClick={() => setActiveTab('home')}
              className={`relative py-1 whitespace-nowrap transition-colors ${
                activeTab === 'home' ? 'text-[#141A16] font-bold' : 'hover:text-[#141A16]'
              }`}
            >
              Home
              {activeTab === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#141A16] rounded-full" />
              )}
            </a>

            <a
              href="#how-it-works"
              onClick={() => setActiveTab('how')}
              className={`whitespace-nowrap transition-colors ${activeTab === 'how' ? 'text-[#141A16] font-bold' : 'hover:text-[#141A16]'}`}
            >
              How It Works
            </a>

            <a
              href="#for-artisans"
              onClick={() => setActiveTab('artisans')}
              className={`whitespace-nowrap transition-colors ${activeTab === 'artisans' ? 'text-[#141A16] font-bold' : 'hover:text-[#141A16]'}`}
            >
              For Artisans
            </a>

            <a
              href="#for-customers"
              onClick={() => setActiveTab('customers')}
              className={`whitespace-nowrap transition-colors ${activeTab === 'customers' ? 'text-[#141A16] font-bold' : 'hover:text-[#141A16]'}`}
            >
              For Customers
            </a>

            <a
              href="#categories"
              className="whitespace-nowrap hover:text-[#141A16] transition-colors"
            >
              Categories
            </a>

            <a
              href="#trades"
              className="whitespace-nowrap hover:text-[#141A16] transition-colors"
            >
              Trades
            </a>

            <a
              href="#about"
              onClick={() => setActiveTab('about')}
              className={`whitespace-nowrap transition-colors ${activeTab === 'about' ? 'text-[#141A16] font-bold' : 'hover:text-[#141A16]'}`}
            >
              Trust &amp; Escrow
            </a>
          </nav>

          {/* Right Login & Get Started Group (Desktop/Tablet >= md) */}
          <div className="hidden md:flex items-center gap-3.5 lg:gap-6 shrink-0">
            <Link
              to="/login"
              className="text-xs lg:text-[13px] font-semibold text-[#141A16] hover:text-stone-600 transition-colors whitespace-nowrap"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 bg-[#123E2A] text-white text-xs lg:text-[13px] font-semibold px-4 lg:px-6 py-2 lg:py-2.5 rounded-full hover:bg-[#0E3222] transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <span>Get Started</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Mobile Hamburger Menu Toggle Button (< md) */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#141A16] hover:bg-stone-200/60 active:scale-95 transition-all"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================ */}
      {/* MOBILE NAVIGATION DRAWER OVERLAY (< md)                      */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden flex flex-col justify-between"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#141A16]/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full bg-[#FAF7F0] border-b border-stone-200/80 shadow-2xl px-6 pt-5 pb-8 flex flex-col gap-6 animate-in slide-in-from-top duration-200">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between">
              <Link 
                to="/v2" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center group select-none"
                aria-label="Artifix Home"
              >
                <img
                  src="/brand/logo1.png"
                  alt="Artifix"
                  className="h-8 sm:h-9 w-auto object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#141A16] hover:bg-stone-200/60 active:scale-95 transition-all"
              >
                <svg className="w-6 h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col gap-2 pt-2 text-[15px] font-semibold text-stone-700">
              <a
                href="#home"
                onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
                className={`text-left py-2 px-3 rounded-lg transition-colors ${
                  activeTab === 'home' ? 'bg-[#123E2A]/10 text-[#123E2A] font-bold' : 'hover:bg-stone-200/40'
                }`}
              >
                Home
              </a>
              <a
                href="#how-it-works"
                onClick={() => { setActiveTab('how'); setMobileMenuOpen(false); }}
                className="py-2 px-3 rounded-lg hover:bg-stone-200/40 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#for-artisans"
                onClick={() => { setActiveTab('artisans'); setMobileMenuOpen(false); }}
                className="py-2 px-3 rounded-lg hover:bg-stone-200/40 transition-colors"
              >
                For Artisans
              </a>
              <a
                href="#for-customers"
                onClick={() => { setActiveTab('customers'); setMobileMenuOpen(false); }}
                className="py-2 px-3 rounded-lg hover:bg-stone-200/40 transition-colors"
              >
                For Customers
              </a>
              <a
                href="#categories"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-stone-200/40 transition-colors"
              >
                Categories
              </a>
              <a
                href="#trades"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-stone-200/40 transition-colors"
              >
                Verified Trades
              </a>
              <a
                href="#about"
                onClick={() => { setActiveTab('about'); setMobileMenuOpen(false); }}
                className="py-2 px-3 rounded-lg hover:bg-stone-200/40 transition-colors"
              >
                Trust &amp; Escrow
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-stone-200/40 transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex flex-col gap-3 pt-2 border-t border-stone-200/70">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-sm font-bold text-[#141A16] border border-stone-300 rounded-full hover:bg-stone-200/40 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 text-sm font-bold text-white bg-[#123E2A] rounded-full hover:bg-[#0E3222] shadow-md transition-all active:scale-98"
              >
                Get Started →
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MAIN HERO SECTION                                         */}
      {/* ============================================================ */}
      <main id="home" className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8 flex-1 flex flex-col justify-center">
        
        {/* Split Grid: stacks on mobile (< md), 2-column on tablet & desktop (>= md) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 lg:gap-8 items-center">
          
          {/* -------------------------------------------------------- */}
          {/* LEFT COLUMN: HERO COPY & CTAS                            */}
          {/* -------------------------------------------------------- */}
          <div className="md:col-span-6 flex flex-col items-start z-10 pr-0 md:pr-2 lg:pr-4">
            
            {/* Tagline / Eyebrow */}
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-2.5 sm:mb-4">
              TRUSTED ARTISANS • SECURE ESCROW • VERIFIED WORK
            </div>

            {/* Main Headline */}
            <h1 
              className="text-[32px] xs:text-[36px] sm:text-[42px] md:text-[38px] lg:text-[48px] xl:text-[56px] font-bold text-[#141A16] leading-[1.08] tracking-[-0.03em] mb-3.5 sm:mb-5"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
            >
              Hire skilled artisans with <span className="font-serif italic font-normal text-[#121814]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>confidence.</span>
            </h1>

            {/* Subparagraph */}
            <p className="text-[13px] sm:text-[14px] lg:text-[15px] text-[#556259] leading-[1.65] max-w-[500px] mb-6 sm:mb-8 font-normal">
              Find verified professionals, secure payments through escrow, and release funds only when work is completed as agreed.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-6">
              <Link
                to="/register?role=CLIENT"
                className="inline-flex items-center gap-2 bg-[#123E2A] text-white text-xs sm:text-[13px] font-semibold px-5 sm:px-6 py-3 rounded-full hover:bg-[#0E3222] transition-all shadow-md active:scale-95"
              >
                <span>Find an Artisan</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                to="/register?role=ARTISAN"
                className="inline-flex items-center border border-[#123E2A] text-[#123E2A] text-xs sm:text-[13px] font-semibold px-5 sm:px-6 py-3 rounded-full hover:bg-[#123E2A]/5 transition-all active:scale-95"
              >
                Become an Artisan
              </Link>
            </div>

          </div>

          {/* -------------------------------------------------------- */}
          {/* RIGHT COLUMN: PROPORTIONALLY SCALED HERO COLLAGE         */}
          {/* -------------------------------------------------------- */}
          <div className="md:col-span-6 relative w-full flex flex-col justify-center items-center select-none pt-2 pb-2">
            
            {/* Outer Responsive Wrapper: Reserves the exact scaled height */}
            <div className="relative w-[320px] xs:w-[360px] sm:w-[440px] md:w-[390px] lg:w-[476px] xl:w-[504px] h-[315px] xs:h-[355px] sm:h-[435px] md:h-[385px] lg:h-[468px] xl:h-[495px] transition-all duration-300">
              
              {/* Inner Scaled Canvas (560px baseline scaled proportionally) */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 origin-top scale-[0.57] xs:scale-[0.64] sm:scale-[0.79] md:scale-[0.70] lg:scale-[0.85] xl:scale-[0.90] w-[560px] h-[550px] pointer-events-auto"
              >

                {/* ==================================================== */}
                {/* BACKDROP LAYER 1: Warm Terracotta Aerial Rooftops     */}
                {/* ==================================================== */}
                <div 
                  className="absolute -right-4 -top-2 w-[340px] h-[570px] overflow-hidden pointer-events-none z-0"
                  style={{
                    clipPath: 'polygon(38% 0%, 100% 0%, 100% 82%, 22% 100%, 0% 78%)',
                    borderRadius: '32px'
                  }}
                >
                  <img
                    src="/images/hero/neighborhood-bg.jpg"
                    alt="Neighborhood Aerial View"
                    className="w-full h-full object-cover filter saturate-125 sepia-[0.35]"
                  />
                  <div className="absolute inset-0 bg-[#E8D4C3] mix-blend-multiply opacity-55" />
                </div>

                {/* ==================================================== */}
                {/* BACKDROP LAYER 2: Deep Forest Green Angular Polygon  */}
                {/* ==================================================== */}
                <div 
                  className="absolute left-[130px] -top-2 w-[410px] h-[510px] bg-[#1A5338] shadow-2xl pointer-events-none z-[1]"
                  style={{
                    clipPath: 'polygon(28% 0%, 100% 0%, 98% 76%, 76% 100%, 0% 92%, 0% 28%)',
                    borderRadius: '40px'
                  }}
                />

                {/* ==================================================== */}
                {/* BACKDROP LAYER 3: Soft Olive/Sage Polygon Facet     */}
                {/* ==================================================== */}
                <div 
                  className="absolute left-[75px] top-[105px] w-[320px] h-[310px] bg-[#75906E] pointer-events-none z-[2]"
                  style={{
                    clipPath: 'polygon(0% 16%, 86% 0%, 100% 82%, 58% 100%, 6% 86%)',
                    borderRadius: '38px'
                  }}
                />

                {/* ==================================================== */}
                {/* IMAGE 1 (TOP-LEFT): CARPENTER                        */}
                {/* ==================================================== */}
                <div 
                  className="absolute left-0 top-5 w-[250px] h-[180px] overflow-hidden shadow-xl z-10 hover:scale-[1.02] transition-transform duration-300"
                  style={{
                    transform: 'skewY(-9deg)',
                    borderRadius: '26px'
                  }}
                >
                  <img
                    src="/images/hero/hero-carpenter-v2.jpg"
                    alt="Skilled Carpenter woodworking in workshop"
                    className="w-full h-full object-cover object-center scale-125"
                    style={{ transform: 'skewY(9deg)' }}
                  />
                </div>

                {/* ==================================================== */}
                {/* IMAGE 2 (TOP-RIGHT): ELECTRICIAN                     */}
                {/* ==================================================== */}
                <div 
                  className="absolute right-6 top-6 w-[230px] h-[170px] overflow-hidden shadow-lg z-10 hover:scale-[1.02] transition-transform duration-300"
                  style={{
                    clipPath: 'polygon(0% 0%, 75% 0%, 100% 22%, 100% 100%, 0% 100%)',
                    borderRadius: '26px'
                  }}
                >
                  <img
                    src="/images/hero/hero-electrician-v2.jpg"
                    alt="Certified Electrician working on distribution panel"
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* ==================================================== */}
                {/* IMAGE 3 (BOTTOM-RIGHT): PLUMBER                      */}
                {/* ==================================================== */}
                <div 
                  className="absolute right-6 top-[185px] w-[230px] h-[200px] overflow-hidden shadow-lg z-10 hover:scale-[1.02] transition-transform duration-300"
                  style={{
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 68% 100%, 0% 100%)',
                    borderRadius: '26px'
                  }}
                >
                  <img
                    src="/images/hero/hero-plumber-v2.jpg"
                    alt="Master Plumber assembling white conduit water pipes"
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* ==================================================== */}
                {/* IMAGE 4 (CENTER HERO): TRANSPARENT PNG CUTOUT        */}
                {/* ==================================================== */}
                <div 
                  className="absolute left-[85px] -top-4 w-[410px] h-[550px] pointer-events-none z-20"
                >
                  <img
                    src="/images/hero/hero-artisan-cutout-perfect.png?v=4"
                    alt="Verified Artifix Technician in yellow hard hat"
                    className="w-full h-full object-contain object-top"
                    style={{
                      filter: 'drop-shadow(0 18px 32px rgba(0, 0, 0, 0.30))'
                    }}
                  />
                </div>

                {/* ==================================================== */}
                {/* FLOATING BADGE: "Verified Artisan" (Top Right)      */}
                {/* ==================================================== */}
                <div className="absolute top-12 right-[170px] z-30 bg-white rounded-xl shadow-[0_8px_22px_rgba(0,0,0,0.14)] px-3.5 py-2 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#1C5839] text-white flex items-center justify-center shadow-sm">
                    <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="text-xs font-bold text-[#141A16] tracking-tight whitespace-nowrap">
                    Verified Artisan
                  </div>
                </div>

                {/* ==================================================== */}
                {/* FLOATING CARD: "Bathroom Renovation" ESCROW STEPPER */}
                {/* ==================================================== */}
                <div className="absolute top-[215px] left-[10px] z-30 bg-white rounded-2xl shadow-[0_16px_36px_rgba(0,0,0,0.14)] p-4 w-[210px] backdrop-blur-sm">
                  
                  {/* Header: Thumbnail + Price */}
                  <div className="flex items-center gap-2.5 mb-2.5 pb-2 border-b border-stone-100">
                    <img
                      src="/images/hero/bathroom.jpg"
                      alt="Renovated Bathroom"
                      className="w-10 h-10 rounded-lg object-cover shadow-inner"
                    />
                    <div>
                      <div className="text-[10px] font-semibold text-stone-600 leading-tight">
                        Bathroom Renovation
                      </div>
                      <div className="text-sm font-extrabold text-[#141A16]">
                        ₦180,000
                      </div>
                    </div>
                  </div>

                  {/* Vertical Stepper with thin connector line */}
                  <div className="relative pl-4 space-y-2 text-[10px]">
                    <div className="absolute left-[6px] top-1.5 bottom-1.5 w-[1.5px] bg-stone-200 -z-0" />

                    {/* Step 1: Funded */}
                    <div className="relative flex items-center gap-2">
                      <div className="absolute -left-4 w-3.5 h-3.5 rounded-full bg-[#1B5438] text-white flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <span className="font-semibold text-stone-700">Funded</span>
                    </div>

                    {/* Step 2: Work in Progress (Active) */}
                    <div className="relative flex items-center gap-2">
                      <div className="absolute -left-4 w-3.5 h-3.5 rounded-full border-2 border-[#1B5438] bg-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1B5438] animate-pulse" />
                      </div>
                      <span className="font-bold text-[#141A16]">Work in Progress</span>
                    </div>

                    {/* Step 3: Verification */}
                    <div className="relative flex items-center gap-2">
                      <div className="absolute -left-4 w-3.5 h-3.5 rounded-full bg-stone-200 border-2 border-white" />
                      <span className="text-stone-400 font-medium">Verification</span>
                    </div>

                    {/* Step 4: Funds Release */}
                    <div className="relative flex items-center gap-2">
                      <div className="absolute -left-4 w-3.5 h-3.5 rounded-full bg-stone-200 border-2 border-white" />
                      <span className="text-stone-400 font-medium">Funds Release</span>
                    </div>
                  </div>

                </div>

                {/* ==================================================== */}
                {/* FLOATING DARK CARD: "Secure Escrow" Dual Payment     */}
                {/* ==================================================== */}
                <div className="absolute bottom-4 right-6 z-30 bg-[#0D1815] text-white rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.35)] w-[290px] backdrop-blur-md">
                  
                  <div className="text-[13px] font-bold tracking-tight text-white mb-0.5">
                    Secure Escrow
                  </div>
                  <div className="text-[10px] text-stone-400 mb-2.5">
                    Your funds are safe until the work is verified.
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* NGN Rail */}
                    <div className="bg-[#182622] rounded-xl p-2 flex items-center gap-2 hover:bg-[#20322d] transition-colors">
                      <div className="w-6 h-6 rounded-full bg-white text-stone-950 font-black flex items-center justify-center text-[10px] shrink-0">
                        ₦
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-bold leading-tight text-white">NGN</div>
                        <div className="text-[8px] text-stone-400 truncate leading-tight">Pay with card or bank transfer</div>
                      </div>
                    </div>

                    {/* MON Rail */}
                    <div className="bg-[#182622] rounded-xl p-2 flex items-center gap-2 hover:bg-[#20322d] transition-colors">
                      <div className="w-6 h-6 rounded-full bg-[#836EF9] text-white font-black flex items-center justify-center text-[10px] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full border border-white" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-bold leading-tight text-white">MON</div>
                        <div className="text-[8px] text-stone-400 truncate leading-tight">Pay with crypto (Monad)</div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Mobile-only Handwritten Script placed directly beneath the collage */}
            <div className="block md:hidden mt-3 mb-2 text-center transform -rotate-[3deg]">
              <div 
                className="text-2xl text-[#1E573B] font-bold leading-[1.1] inline-block"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                <span>Real People. Real Skills. Real Trust.</span>
                <svg className="w-full h-2.5 text-[#1E573B] mt-0.5" viewBox="0 0 100 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M2 8 C 25 3, 70 3, 98 6" strokeLinecap="round" />
                </svg>
              </div>
            </div>

          </div>

        </div>

        {/* ============================================================ */}
        {/* 3. UNIFIED BOTTOM TRUST ROW & MONAD ATTRIBUTION              */}
        {/* ============================================================ */}
        <div className="w-full pt-4 sm:pt-5 pb-2 border-t border-stone-200/50 mt-2 sm:mt-4">
          
          {/* DESKTOP (>= md): Static 3-Part Layout */}
          <div className="hidden md:flex items-center justify-between gap-4">
            
            {/* Left/Center: 5 Trust Feature Icons */}
            <div className="flex items-center gap-4 lg:gap-6 w-auto">
              
              {/* Feature 1: Verified Artisans */}
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#141A16] mb-1 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 stroke-[1.7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <span className="text-[10px] lg:text-[11px] font-medium text-[#2C3630] leading-tight max-w-[85px]">
                  Verified Artisans
                </span>
              </div>

              {/* Feature 2: Smart Contract Escrow */}
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#141A16] mb-1 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 stroke-[1.7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="5" cy="8" r="2" />
                    <circle cx="19" cy="8" r="2" />
                    <circle cx="12" cy="20" r="2" />
                    <path strokeLinecap="round" d="M7 9l3 2M17 9l-3 2M12 15v3" />
                  </svg>
                </div>
                <span className="text-[10px] lg:text-[11px] font-medium text-[#2C3630] leading-tight max-w-[85px]">
                  Smart Contract Escrow
                </span>
              </div>

              {/* Feature 3: Dual Payment Rails */}
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#141A16] mb-1 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 stroke-[1.7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                    <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                  </svg>
                </div>
                <span className="text-[10px] lg:text-[11px] font-medium text-[#2C3630] leading-tight max-w-[95px]">
                  Dual Payment Rails (NGN &amp; MON)
                </span>
              </div>

              {/* Feature 4: Proof of Work Verification */}
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#141A16] mb-1 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 stroke-[1.7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <span className="text-[10px] lg:text-[11px] font-medium text-[#2C3630] leading-tight max-w-[85px]">
                  Proof of Work Verification
                </span>
              </div>

              {/* Feature 5: Dispute Resolution */}
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#141A16] mb-1 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 stroke-[1.7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    <circle cx="18" cy="18" r="2.5" />
                  </svg>
                </div>
                <span className="text-[10px] lg:text-[11px] font-medium text-[#2C3630] leading-tight max-w-[85px]">
                  Dispute Resolution
                </span>
              </div>

            </div>

            {/* Middle: Tablet/Desktop Cursive Note */}
            <div className="select-none transform -rotate-[5deg] shrink-0">
              <div 
                className="text-base lg:text-xl text-[#1E573B] font-bold leading-[1.1] whitespace-nowrap"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                <div>Real People.</div>
                <div>Real Skills.</div>
                <div className="relative inline-block">
                  Real Trust.
                  <svg className="w-full h-2 text-[#1E573B] mt-0.5" viewBox="0 0 100 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 8 C 25 3, 70 3, 98 6" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right: Monad Attribution Badge */}
            <div className="flex items-center gap-2 text-stone-600 text-xs lg:text-[11px] font-medium select-none shrink-0">
              <div className="w-4 h-4 rounded bg-[#836EF9] flex items-center justify-center text-white shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <span className="whitespace-nowrap">Powered by Monad Blockchain</span>
            </div>

          </div>

          {/* MOBILE (< md): Continuous Automatic Moving Slider */}
          <div className="md:hidden relative w-full overflow-hidden py-1">
            {/* Edge fade masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#FAF7F0] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#FAF7F0] to-transparent z-10" />

            {/* Continuous Marquee Track */}
            <div className="animate-marquee flex items-center gap-6 py-1">
              {[1, 2].map((cycle) => (
                <React.Fragment key={cycle}>
                  {/* Verified Artisans */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#123E2A] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#2C3630] whitespace-nowrap">Verified Artisans</span>
                  </div>

                  {/* Smart Contract Escrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#123E2A] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3" />
                        <circle cx="5" cy="8" r="2" />
                        <circle cx="19" cy="8" r="2" />
                        <circle cx="12" cy="20" r="2" />
                        <path strokeLinecap="round" d="M7 9l3 2M17 9l-3 2M12 15v3" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#2C3630] whitespace-nowrap">Smart Contract Escrow</span>
                  </div>

                  {/* Dual Payment Rails */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#123E2A] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="4" />
                        <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#2C3630] whitespace-nowrap">Dual Payment Rails (NGN &amp; MON)</span>
                  </div>

                  {/* Proof of Work */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#123E2A] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#2C3630] whitespace-nowrap">Proof of Work Verification</span>
                  </div>

                  {/* Dispute Resolution */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#123E2A] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        <circle cx="18" cy="18" r="2.5" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-[#2C3630] whitespace-nowrap">Dispute Resolution</span>
                  </div>

                  {/* Cursive badge */}
                  <div className="flex items-center px-3 py-1 rounded-full bg-[#123E2A]/8 text-[#1E573B] shrink-0">
                    <span className="text-xs font-bold whitespace-nowrap" style={{ fontFamily: "'Caveat', cursive" }}>
                      Real People. Real Skills. Real Trust.
                    </span>
                  </div>

                  {/* Monad attribution badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs shrink-0">
                    <div className="w-3.5 h-3.5 rounded bg-[#836EF9] flex items-center justify-center text-white">
                      <span className="w-1 h-1 rounded-full bg-white" />
                    </div>
                    <span className="text-[11px] font-medium whitespace-nowrap">Powered by Monad</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* ============================================================ */}
      {/* 4. FULL-PAGE EDITORIAL LANDING SECTIONS                      */}
      {/* ============================================================ */}
      <CategoryGridSection />
      <HowItWorksSection />
      <SponsorBarSection />
      <DualPerspectiveSection />
      <TradesShowcaseSection />
      <TrustInfrastructureSection />
      <FaqSection />
      <ClosingCtaSection />

      {/* ============================================================ */}
      {/* 5. COMPREHENSIVE EDITORIAL FOOTER                            */}
      {/* ============================================================ */}
      <EditorialFooter />

    </div>
  );
}

export default LandingPageV2;
