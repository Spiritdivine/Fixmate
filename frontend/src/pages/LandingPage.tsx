import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Star,
  ChevronDown,
  Check,
  ArrowUpRight,
  Menu,
  X,
  User,
  Mail,
  Wrench,
  Loader2,
  Users,
  ShieldCheck,
  Shield,
  MapPin,
  
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { trackEvent } from '../lib/posthog';
import { LANDING_IMAGES } from '../assets/landing-assets';
import { WAITLIST_HERO_ASSETS } from '../assets/waitlist-curated-assets';
import { ArtisanDoodles } from '../components/ui/ArtisanDoodles';
import {
  ProofOfWorkAuditHugeIcon,
  InstantSettlementHugeIcon,
  ShieldCheckHugeIcon,
  CertifiedBadgeHugeIcon,
  ClientProfileHugeIcon,
  ArtisanCraftsmanHugeIcon,
  CreditCardHugeIcon,
  MonadTokenHugeIcon,
  VaultLockHugeIcon,
  JobContractDocketHugeIcon,
  NairaCoinsHugeIcon,
  SunHugeIcon,
  MoonHugeIcon,
} from '../components/ui/HugeIcons';
import { SeoHead } from '../components/seo/SeoHead';

export const FixmateLogo: React.FC<{ light?: boolean; className?: string }> = ({ light = false, className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative w-10 h-10 shrink-0">
      <svg viewBox="0 0 44 44" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M8 8C8 6.89543 8.89543 6 10 6H24C25.1046 6 26 6.89543 26 8V12.5C26 13.6046 25.1046 14.5 24 14.5H16.5V18.5H22C23.1046 18.5 24 19.3954 24 20.5V23.5C24 24.6046 23.1046 25.5 22 25.5H16.5V36C16.5 37.1046 15.6046 38 14.5 38H10C8.89543 38 8 37.1046 8 36V8Z"
          fill={light ? "#00A86B" : "#0A2818"}
        />
        <path
          d="M20 12C20 10.8954 20.8954 10 22 10H36C37.1046 10 38 10.8954 38 12V16.5C38 17.6046 37.1046 18.5 36 18.5H28.5V22.5H34C35.1046 22.5 36 23.3954 36 24.5V27.5C36 28.6046 35.1046 29.5 34 29.5H28.5V36C28.5 37.1046 27.6046 38 26.5 38H22C20.8954 38 20 37.1046 20 36V12Z"
          fill={light ? "#FFFFFF" : "#00A86B"}
        />
      </svg>
    </div>
    <div className="flex flex-col">
      <span className={`text-2xl font-black tracking-tight leading-none ${light ? 'text-white' : 'text-[#0A261B] dark:text-white'}`}>
        Fixmate
      </span>
      <span className={`text-[10px] font-bold tracking-wider uppercase mt-1 ${light ? 'text-emerald-300' : 'text-[#0D6D4C] dark:text-emerald-400'}`}>
        Find <span className="mx-1">•</span> Connect <span className="mx-1">•</span> Fix
      </span>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'artisan'>('client');
  const [selectedPayment, setSelectedPayment] = useState<'paystack' | 'monad'>('paystack');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [craftOrSkill, setCraftOrSkill] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<{
    name: string;
    email: string;
    role: 'client' | 'artisan';
    craftOrSkill?: string;
  } | null>(null);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(12483);
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    // Default to the warm editorial light canvas as seen in the referenced design
    document.documentElement.classList.remove('dark');
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const scrollToWaitlist = (role?: 'client' | 'artisan', sourceLocation: string = 'general') => {
    trackEvent('waitlist_cta_clicked', {
      role_target: role || 'unspecified',
      source_location: sourceLocation,
    });
    if (role) {
      setSelectedRole(role);
    }
    document.getElementById('waitlist-name-input')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('waitlist-name-input')?.focus();
    }, 300);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);

    const lead = {
      name: fullName.trim() || 'Waitlist Member',
      email: email.trim().toLowerCase(),
      role: selectedRole,
      craftOrSkill: selectedRole === 'artisan' ? craftOrSkill.trim() : undefined,
    };

    // Forward to Google Sheets Web App if configured
    const sheetUrl = import.meta.env.VITE_WAITLIST_SHEET_URL;
    if (sheetUrl) {
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors', // Standard for Google Apps Script redirects
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(lead),
        });
      } catch (err) {
        console.warn('Google Sheets sync warning:', err);
      }
    }

    // Save lead to local storage for demo/persistence
    try {
      const existingRaw = localStorage.getItem('artifix_waitlist_leads');
      const leads = existingRaw ? JSON.parse(existingRaw) : [];
      leads.push({ ...lead, timestamp: new Date().toISOString() });
      localStorage.setItem('artifix_waitlist_leads', JSON.stringify(leads));
    } catch {
      // Ignore local storage write errors
    }

    // Track waitlist submission success in PostHog
    trackEvent('waitlist_submitted', {
      role: selectedRole,
      email: email.trim().toLowerCase(),
    });

    // Small delay for authentic feel
    await new Promise((r) => setTimeout(r, 400));

    // Blast celebratory confetti
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00A86B', '#0A261B', '#10B981', '#34D399'],
    });

    setSubmittedLead(lead);
    setWaitlistCount((prev) => prev + 1);
    setIsSubmitting(false);
    setWaitlistSubmitted(true);
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-amber-200 selection:text-stone-900 ${isDarkMode ? 'dark bg-[#0E1310] text-stone-100' : 'bg-[#F5EFEB] text-stone-900'} dark:bg-[#0E1310] dark:text-stone-100 overflow-x-clip transition-colors duration-200`}>
      <SeoHead
        title="Artifix — The Verified Artisan Trust Network | Smart Escrow Protection"
        description="Hire ID-verified plumbers, electricians, solar installers, and carpenters in Nigeria. Guaranteed zero-dispute milestone deliverables with Monad EVM smart contract escrow."
        canonical="https://artifix.app/"
        ogType="website"
        ogImage="/api/v1/og/default"
        ogImageAlt="Artifix Verified Artisan Trust Network"
        twitterCard="summary_large_image"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Artifix',
          url: 'https://artifix.app',
          description: 'The Verified Artisan Trust Network with zero-dispute deliverable settlements.',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://artifix.app/artisans?search={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION (Streamlined — Focused Conversion)         */}
      {/* ============================================================ */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#F5EFEB]/95 dark:bg-[#0E1310]/95 backdrop-blur-md shadow-sm border-b border-stone-300/80 dark:border-stone-800'
            : 'bg-[#F5EFEB]/80 dark:bg-[#0E1310]/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Main Brand Logo */}
          <Link to="/" className="flex items-center group shrink-0 focus:outline-none" aria-label="Artifix Home">
            <img
              src="/brand/logo1.png"
              alt="Artifix"
              className="h-10 sm:h-11 md:h-12 w-auto object-contain dark:hidden transition-transform duration-200 group-hover:scale-105"
            />
            <img
              src="/brand/logo1-dark.png"
              alt="Artifix"
              className="h-10 sm:h-11 md:h-12 w-auto object-contain hidden dark:block transition-transform duration-200 group-hover:scale-105"
            />
          </Link>

          {/* Right Action Items */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => scrollToWaitlist(undefined, 'navbar')}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#BD5324] hover:bg-[#A64319] text-white text-xs sm:text-sm font-bold tracking-tight shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <span>Join Waitlist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Light/Dark Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full border border-stone-300/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
            >
              {isDarkMode ? <SunHugeIcon size={17} className="text-amber-400" /> : <MoonHugeIcon size={17} className="text-stone-800" />}
            </button>
          </div>

        </div>
      </header>


      {/* ============================================================ */}
      {/* 2. THE HERO SECTION (EXACT REFERENCE REDESIGN)               */}
      {/* ============================================================ */}
      <section className="relative pt-6 sm:pt-10 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Subtle Decorative Doodles Background */}
        <ArtisanDoodles />

        <div className="max-w-7xl mx-auto">
          
          {/* Main Dual-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
            
            {/* ========================================================= */}
            {/* LEFT COLUMN: HERO HEADLINE, VALUE COPY & FORM            */}
            {/* ========================================================= */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              
              

              {/* Title Typography: Script "Join the" + Bold "WAITLIST" */}
              <div className="relative mb-5 sm:mb-6">
                <div className="flex items-center gap-2 font-caveat text-4xl sm:text-5xl md:text-6xl text-[#1C1917] dark:text-stone-100 font-bold -rotate-1 select-none">
                  <span>Join the</span>
                  {/* Dynamic Motion Flare Dashes */}
                  <svg className="w-8 h-8 text-[#BD5324] -mt-2 shrink-0" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M4 14L10 8" />
                    <path d="M12 18L18 12" />
                    <path d="M10 26L20 22" />
                  </svg>
                </div>

                <div className="relative inline-block mt-1">
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[82px] font-black uppercase tracking-tight text-[#00A86B] dark:text-[#10B981] -rotate-1 drop-shadow-sm font-sans leading-none">
                    WAITLIST
                  </h1>
                  {/* Dynamic Green Brush Underline */}
                  <svg
                    viewBox="0 0 320 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-4 sm:h-5 text-[#00A86B] dark:text-[#10B981] -mt-1 sm:-mt-2"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M3 14C60 6 180 3 317 12C240 18 100 22 3 14Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>

              {/* Supporting Value Proposition Heading & Paragraph */}
              <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-stone-900 dark:text-white tracking-tight leading-[1.18] mb-3.5 font-sans">
                The safer way to hire and get work done.
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-lg mb-6">
                Be among the first to experience a better way to hire skilled professionals. Artifix combines artisan verification, escrow protection, and transparent project tracking in one platform.
              </p>

              {/* Segmented Dual Role Toggle Switch */}
              <div className="p-1 sm:p-1.5 rounded-full bg-stone-200/90 dark:bg-stone-900/90 border border-stone-300/80 dark:border-stone-800 flex items-center gap-1 mb-5 shadow-inner max-w-full">
                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedRole === 'client'
                      ? 'bg-[#262B25] dark:bg-[#1E2721] text-white shadow-md'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <ClientProfileHugeIcon size={14} className={selectedRole === 'client' ? 'text-white' : 'text-[#BD5324]'} />
                  <span>Hire an Artisan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('artisan')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedRole === 'artisan'
                      ? 'bg-[#262B25] dark:bg-[#1E2721] text-white shadow-md'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <ArtisanCraftsmanHugeIcon size={14} className={selectedRole === 'artisan' ? 'text-white' : 'text-[#BD5324]'} />
                  <span>Join as an Artisan</span>
                </button>
              </div>

              {/* Restored Waitlist Form Card */}
              <div id="waitlist-hero" className="w-full max-w-lg mb-4">
                {!waitlistSubmitted ? (
                  <form
                    onSubmit={handleWaitlistSubmit}
                    className="p-3.5 sm:p-4 bg-white/95 dark:bg-[#131B16]/95 backdrop-blur-md rounded-2xl border border-stone-300/90 dark:border-stone-800 shadow-xl text-left"
                  >
                    <div className="space-y-2.5 mb-3">
                      {/* Full Name Input */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="waitlist-name-input"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#18231C] border border-stone-300/80 dark:border-stone-700 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#BD5324] focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Email Input */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="waitlist-email-input"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email address"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#18231C] border border-stone-300/80 dark:border-stone-700 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#BD5324] focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Craft / Skill Input (Artisan Only) */}
                      {selectedRole === 'artisan' && (
                        <div className="relative animate-in fade-in duration-200">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <input
                            id="waitlist-craft-input"
                            type="text"
                            value={craftOrSkill}
                            onChange={(e) => setCraftOrSkill(e.target.value)}
                            placeholder="Trade (e.g. Solar, Plumbing, Electrical)"
                            required={selectedRole === 'artisan'}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-[#18231C] border border-stone-300/80 dark:border-stone-700 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#BD5324] focus:border-transparent transition-all"
                          />
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-6 rounded-xl bg-[#BD5324] hover:bg-[#A64319] disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer group"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Reserving spot...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {selectedRole === 'client'
                              ? 'Join Client Waitlist'
                              : 'Join Artisan Waitlist'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-[#131B16]/95 border border-emerald-400 dark:border-emerald-800 shadow-xl text-left transition-all">
                    <div className="flex items-start gap-3.5 mb-2.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Early Access</span>
                        </div>
                        <h4 className="text-base font-black text-stone-900 dark:text-white">
                          You&apos;re on the list, {submittedLead?.name || 'Partner'}!
                        </h4>
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-1">
                          We reserved your spot as a{' '}
                          <span className="font-bold text-[#BD5324]">
                            {submittedLead?.role === 'artisan' ? 'Verified Artisan' : 'Client'}
                          </span>
                          . Priority invitations rollout in Q2 2026.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust statement under form */}
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-8">
                <ShieldCheck className="w-4 h-4 text-[#00A86B]" />
                <span>No spam. Just important updates.</span>
              </div>

              {/* 3 Quick Soft-Mint Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-xl">
                {/* Feature 1: For Artisans */}
                <a
                  href="#for-artisans"
                  className="p-4 sm:p-4.5 rounded-[20px] bg-[#EAF5EF] dark:bg-[#131D17] border border-[#D5EDE0] dark:border-stone-800 hover:border-[#BD5324]/60 dark:hover:border-[#BD5324]/60 hover:shadow-md transition-all group block text-left"
                >
                  <div className="text-[#0A261B] dark:text-emerald-300 mb-2.5">
                    <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="8" r="4" />
                      <path d="M3 23C3 18.5 6.5 16 11 16" />
                      <path d="M19 16L24 21M22 13L25 16" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#0B281B] dark:text-stone-200 group-hover:text-[#BD5324] transition-colors">
                    <span>For Artisans</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    Showcase your skills and get more opportunities.
                  </p>
                </a>

                {/* Feature 2: For Customers */}
                <a
                  href="#for-clients"
                  className="p-4 sm:p-4.5 rounded-[20px] bg-[#EAF5EF] dark:bg-[#131D17] border border-[#D5EDE0] dark:border-stone-800 hover:border-[#BD5324]/60 dark:hover:border-[#BD5324]/60 hover:shadow-md transition-all group block text-left"
                >
                  <div className="text-[#0A261B] dark:text-emerald-300 mb-2.5">
                    <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="8" r="4" fill="currentColor" />
                      <path d="M3 23C3 18.5 6.5 16 11 16" fill="currentColor" />
                      <circle cx="21" cy="18" r="4" fill="#00A86B" />
                      <path d="M21 16L21.6 17.3L23 17.4L21.9 18.4L22.3 19.8L21 19L19.7 19.8L20.1 18.4L19 17.4L20.4 17.3Z" fill="white" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#0B281B] dark:text-stone-200 group-hover:text-[#BD5324] transition-colors">
                    <span>For Customers</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    Find trusted artisans and get your tasks done with ease.
                  </p>
                </a>

                {/* Feature 3: Secure & Fair */}
                <a
                  href="#escrow"
                  className="p-4 sm:p-4.5 rounded-[20px] bg-[#EAF5EF] dark:bg-[#131D17] border border-[#D5EDE0] dark:border-stone-800 hover:border-[#BD5324]/60 dark:hover:border-[#BD5324]/60 hover:shadow-md transition-all group block text-left"
                >
                  <div className="text-[#0A261B] dark:text-emerald-300 mb-2.5">
                    <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3L5 7V13C5 19 8.8 24.5 14 26C19.2 24.5 23 19 23 13V7L14 3Z" />
                      <path d="M9.5 13.5L12.5 16.5L18.5 10.5" strokeWidth="2.5" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#0B281B] dark:text-stone-200 group-hover:text-[#BD5324] transition-colors">
                    <span>Secure &amp; Fair</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    Powered by blockchain and smart contracts.
                  </p>
                </a>
              </div>

            </div>


            {/* ========================================================= */}
            {/* RIGHT COLUMN: SHAPED CRAFTSPEOPLE IMAGERY & PHONE CARD    */}
            {/* ========================================================= */}
            <div className="lg:col-span-6 relative flex items-center justify-center pt-8 sm:pt-10 lg:pt-0">
              
              {/* Central Sizing Stage Container */}
              <div className="relative w-full max-w-[340px] xs:max-w-[390px] sm:max-w-[460px] lg:max-w-[500px] h-[420px] xs:h-[460px] sm:h-[510px] lg:h-[560px] flex items-center justify-center">

                {/* Background Organic Mint Backdrop Shape / Blob */}
                <div
                  className="absolute inset-0 bg-[#D4ECE1]/85 dark:bg-emerald-950/40 pointer-events-none -z-10"
                  style={{
                    borderRadius: '46% 54% 62% 38% / 40% 60% 40% 60%',
                    transform: 'scale(1.02) rotate(-4deg)',
                  }}
                />

                {/* ------------------------------------------------------ */}
                {/* IMAGE 1: Top Center-Left (Tailor / Seamstress)          */}
                {/* Shape: Cathedral Arch / Tombstone                      */}
                {/* ------------------------------------------------------ */}
                <div className="absolute -top-2 sm:-top-3 left-[25%] sm:left-[26%] -translate-x-1/2 w-32 xs:w-36 sm:w-42 lg:w-46 h-40 xs:h-46 sm:h-52 lg:h-56 z-10">
                  <div className="relative w-full h-full rounded-t-[72px] xs:rounded-t-[84px] sm:rounded-t-[96px] rounded-b-[16px] sm:rounded-b-[20px] overflow-hidden shadow-xl bg-stone-900">
                    <img
                      src={WAITLIST_HERO_ASSETS.tailor}
                      onError={(e) => {
                        e.currentTarget.src = WAITLIST_HERO_ASSETS.tailorFallback;
                      }}
                      alt="Artisan tailor seamstress at sewing machine"
                      className="w-full h-full object-cover object-[center_25%] filter contrast-[1.05]"
                    />
                  </div>

                  {/* Radiating 3 Green Flare Dashes on Top Right */}
                  <div className="absolute -top-2.5 -right-4 sm:-top-3.5 sm:-right-6 text-[#00A86B] pointer-events-none select-none">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M5 22L12 6" />
                      <path d="M14 22L19 9" />
                      <path d="M21 22L25 12" />
                    </svg>
                  </div>
                </div>

                {/* ------------------------------------------------------ */}
                {/* IMAGE 2: Top Right (Electrician on Breaker Panel)      */}
                {/* Shape: Angled Tilted Parallelogram Banner              */}
                {/* ------------------------------------------------------ */}
                <div className="absolute top-2.5 sm:top-4 right-0 sm:right-1 w-28 xs:w-32 sm:w-38 lg:w-42 h-28 xs:h-32 sm:h-38 lg:h-42 z-10 rotate-[3.5deg]">
                  {/* Floating Hand-written Script Annotation */}
                  <div className="absolute -top-8 xs:-top-9 sm:-top-11 -left-4 xs:-left-6 sm:-left-8 -rotate-6 font-caveat text-[#0A261B] dark:text-emerald-300 text-xs xs:text-sm sm:text-base lg:text-lg font-bold leading-tight select-none pointer-events-none whitespace-nowrap z-30">
                    <div>Skilled People.</div>
                    <div>Real Work.</div>
                    <div className="relative inline-block">
                      <span>Better Outcomes.</span>
                      <svg
                        viewBox="0 0 100 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-1.5 text-[#00A86B] absolute -bottom-1 left-0 opacity-80"
                        preserveAspectRatio="none"
                      >
                        <path d="M2 5C30 1 70 1 98 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative w-full h-full rounded-[18px] xs:rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-xl bg-stone-900">
                    <img
                      src={WAITLIST_HERO_ASSETS.electrician}
                      onError={(e) => {
                        e.currentTarget.src = WAITLIST_HERO_ASSETS.electricianFallback;
                      }}
                      alt="Electrician working on panel"
                      className="w-full h-full object-cover filter contrast-[1.05]"
                    />
                  </div>
                </div>

                {/* ------------------------------------------------------ */}
                {/* IMAGE 3: Middle-Left (Potter Shaping Clay)             */}
                {/* Shape: Asymmetrical Rounded Pebble / Shield Mask       */}
                {/* ------------------------------------------------------ */}
                <div className="absolute top-[38%] xs:top-[40%] -left-1.5 xs:-left-2 sm:-left-3 w-30 xs:w-34 sm:w-40 lg:w-44 h-30 xs:h-34 sm:h-40 lg:h-44 z-10">
                  <div
                    className="relative w-full h-full overflow-hidden shadow-xl bg-stone-900 rounded-[38px_14px_38px_14px] sm:rounded-[50px_18px_50px_18px]"
                  >
                    <img
                      src={WAITLIST_HERO_ASSETS.potter}
                      onError={(e) => {
                        e.currentTarget.src = WAITLIST_HERO_ASSETS.potterAlt;
                      }}
                      alt="Ceramic potter artisan shaping clay"
                      className="w-full h-full object-cover filter contrast-[1.05]"
                    />
                  </div>
                </div>

                {/* ------------------------------------------------------ */}
                {/* IMAGE 4: Lower-Right (Beadworker / Jewelry Artisan)    */}
                {/* Shape: Vertical Elongated Capsule Arch                 */}
                {/* ------------------------------------------------------ */}
                <div className="absolute bottom-3 xs:bottom-4 sm:bottom-5 right-0 sm:right-0 w-26 xs:w-30 sm:w-34 lg:w-38 h-38 xs:h-42 sm:h-48 lg:h-54 z-10">
                  <div className="relative w-full h-full rounded-[26px] xs:rounded-[30px] sm:rounded-[36px] overflow-hidden shadow-xl bg-stone-900">
                    <img
                      src={WAITLIST_HERO_ASSETS.jewelry}
                      onError={(e) => {
                        e.currentTarget.src = WAITLIST_HERO_ASSETS.jewelryAlt;
                      }}
                      alt="Artisan crafting wire bead jewelry"
                      className="w-full h-full object-cover filter contrast-[1.05]"
                    />
                  </div>
                </div>

                {/* ------------------------------------------------------ */}
                {/* CENTERPIECE: 3D FLOATING MOBILE PHONE SCREEN CARD      */}
                {/* ------------------------------------------------------ */}
                <div className="relative z-20 w-full max-w-[215px] xs:max-w-[235px] sm:max-w-[265px] lg:max-w-[290px] transform -rotate-[3.5deg] hover:rotate-0 transition-transform duration-500">
                  <div className="bg-[#071F15] dark:bg-[#07150E] rounded-[26px] xs:rounded-[28px] sm:rounded-[32px] p-3.5 xs:p-4 sm:p-5 border-2 border-white/60 dark:border-stone-700/70 shadow-2xl shadow-emerald-950/40 text-white">
                    
                    {/* Top Status Bar */}
                    <div className="flex items-center justify-between mb-2.5 sm:mb-3.5">
                      {/* Brand Logo Mini */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <img
                          src="/brand/artifix-icon-dark.png"
                          alt="Artifix"
                          className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain shrink-0"
                        />
                        <span className="text-xs sm:text-sm font-black tracking-tight text-white">Artifix</span>
                      </div>

                      {/* Waitlist Pill Status Badge */}
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 rounded-full bg-[#0D3825] border border-emerald-500/30 text-[9px] sm:text-[10px] font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Waitlist</span>
                      </div>
                    </div>

                    {/* Notification Heading */}
                    <div className="mb-1.5 sm:mb-2">
                      <div className="text-sm xs:text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                        You&apos;re on the
                      </div>
                      <div className="text-base xs:text-lg sm:text-xl font-black text-[#10B981] leading-tight">
                        waitlist!
                      </div>
                    </div>

                    <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-stone-300 leading-relaxed">
                      We&apos;ll notify you as soon as we&apos;re ready. Thanks for being early!
                    </p>

                    {/* Waitlist Stat Count Card */}
                    <div className="bg-[#0D3323] dark:bg-[#0A261B] border border-[#164D35] rounded-lg sm:rounded-xl p-2 xs:p-2.5 sm:p-3 my-2 sm:my-3 flex items-center gap-2 sm:gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-black text-white tracking-tight leading-none">
                          {waitlistCount.toLocaleString()}
                        </div>
                        <div className="text-[8px] sm:text-[9px] text-emerald-200/80 font-medium mt-0.5">
                          people already on the waitlist
                        </div>
                      </div>
                    </div>

                    {/* "What you'll get" Value Checklist */}
                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="text-[10px] sm:text-[11px] font-bold text-stone-200 uppercase tracking-wider mb-1 sm:mb-1.5">
                        What you&apos;ll get
                      </div>
                      
                      {[
                        'Early access to the platform',
                        'Exclusive launch perks',
                        'Product updates & sneak peeks',
                        'Priority support',
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 sm:gap-2 text-[10px] xs:text-[11px] sm:text-xs text-stone-200">
                          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#10B981] flex items-center justify-center text-[#071F15] shrink-0">
                            <Check className="w-2 h-2 stroke-[3]" />
                          </div>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Handwritten Slogan inside Phone Card */}
                    <div className="mt-3 pt-2 sm:mt-4 sm:pt-2.5 border-t border-emerald-900/50 text-center select-none">
                      <div className="font-caveat text-emerald-200 text-sm sm:text-base font-bold leading-tight">
                        Real People. Real Skills. Real Trust.
                      </div>
                      <svg
                        viewBox="0 0 160 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-24 sm:w-28 h-1.5 text-[#00A86B] mx-auto mt-0.5 sm:mt-1 opacity-80"
                        preserveAspectRatio="none"
                      >
                        <path d="M2 6C35 2 110 2 158 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>

                  </div>
                </div>

                {/* ------------------------------------------------------ */}
                {/* BOTTOM HAND-DRAWN ANNOTATION: ARROW + SCRIPT           */}
                {/* ------------------------------------------------------ */}
                <div className="absolute -bottom-7 xs:-bottom-8 sm:-bottom-9 left-2 xs:left-4 sm:left-8 flex items-center gap-1.5 sm:gap-2 font-caveat text-[#00965E] dark:text-emerald-400 text-lg xs:text-xl sm:text-2xl font-bold -rotate-6 select-none pointer-events-none">
                  {/* Curved Arrow SVG */}
                  <svg className="w-7 h-7 sm:w-9 sm:h-9 text-[#00965E] dark:text-emerald-400 -mt-1 shrink-0" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M34 32C24 34 14 28 10 16M10 16L16 14M10 16L12 22" />
                  </svg>
                  <div className="leading-[1.1] text-left">
                    <div>It only</div>
                    <div>takes a minute!</div>
                  </div>
                </div>

              </div>

            </div>

          </div>


          {/* ============================================================ */}
          {/* 3. FULL-WIDTH DARK FOREST GREEN TRUST STRIP                  */}
          {/* ============================================================ */}
          <div className="mt-16 sm:mt-24">
            <div className="bg-[#0A2218] dark:bg-[#071710] border border-transparent dark:border-stone-800/80 rounded-2xl sm:rounded-3xl p-6 sm:px-10 sm:py-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              
              {/* 3 Trust Pillars */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 sm:gap-10 text-white">
                
                {/* Pillar 1: Trusted Artisans */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-950/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-sm sm:text-base font-bold tracking-tight">
                    Trusted Artisans
                  </div>
                </div>

                <div className="hidden sm:block w-px h-8 bg-emerald-800/40" />

                {/* Pillar 2: Real Connections */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-950/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-sm sm:text-base font-bold tracking-tight">
                    Real Connections
                  </div>
                </div>

                <div className="hidden sm:block w-px h-8 bg-emerald-800/40" />

                {/* Pillar 3: Local Services */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-950/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="text-sm sm:text-base font-bold tracking-tight">
                    Local Services
                  </div>
                </div>

              </div>

              {/* Artifix Monogram Logo */}
              <div className="flex items-center gap-3 shrink-0">
                <img
                  src="/brand/artifix-icon-dark.png"
                  alt="Artifix"
                  className="h-10 sm:h-11 w-auto object-contain"
                />
              </div>

            </div>
          </div>

        </div>

      </section>


            {/* ============================================================ */}
      {/* 6. DUAL PATHWAY: FOR CLIENTS VS FOR ARTISANS                 */}
      {/* ============================================================ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-300/60 dark:border-stone-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Client Card */}
          <div id="for-clients" className="paper-card rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden border-2 hover:border-[#BD5324]/50 transition-all">
            <div className="absolute -bottom-6 -right-6 text-[#BD5324]/10 dark:text-[#BD5324]/15 pointer-events-none select-none">
              <ClientProfileHugeIcon size={140} className="w-28 h-28 sm:w-36 sm:h-36" strokeWidth={0.8} />
            </div>

            <div>
              <span className="tape-strip mb-4">FOR PROPERTY OWNERS &amp; BUILDERS</span>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mb-4">
                Hire skilled trades without financial risk.
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                Never pay in full upfront. Funds stay protected in escrow until you inspect and approve each deliverable.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium mb-8">
                <li className="flex items-center gap-2.5">
                  <CertifiedBadgeHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Vetted, background-checked craftsmen</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheckHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Milestone-based fund release</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ProofOfWorkAuditHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Photo proof before payout approval</span>
                </li>
              </ul>
            </div>

            <div>
              <button
                type="button"
                onClick={() => scrollToWaitlist('client', 'dual_perspective_client')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-md active:scale-95"
              >
                <span>Join Client Waitlist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Artisan Card */}
          <div id="for-artisans" className="paper-card rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden border-2 hover:border-[#BD5324]/50 transition-all">
            <div className="absolute -bottom-6 -right-6 text-[#BD5324]/10 dark:text-[#BD5324]/15 pointer-events-none select-none">
              <ArtisanCraftsmanHugeIcon size={140} className="w-28 h-28 sm:w-36 sm:h-36" strokeWidth={0.8} />
            </div>

            <div>
              <span className="tape-strip mb-4">FOR SKILLED ARTISANS</span>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mb-4">
                Work with guaranteed payment.
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                Never chase an invoice. Funds are deposited into escrow before you start work.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium mb-8">
                <li className="flex items-center gap-2.5">
                  <CertifiedBadgeHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Verifiable Trade Passport and seal</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheckHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Milestone funds locked before work begins</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <InstantSettlementHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Direct payout to bank account or wallet</span>
                </li>
              </ul>
            </div>

            <div>
              <button
                type="button"
                onClick={() => scrollToWaitlist('artisan', 'dual_perspective_artisan')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#BD5324] hover:bg-[#A64319] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                <span>Join Artisan Waitlist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>





      {/* ============================================================ */}
      {/* 8. FOOTER (Streamlined — Navigation Links Removed)           */}
      {/* ============================================================ */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-300/80 dark:border-stone-800 bg-[#F5EFEB] dark:bg-[#0A0E0C] text-stone-600 dark:text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Link to="/" className="flex items-center group focus:outline-none" aria-label="Artifix Home">
              <img
                src="/brand/logo1.png"
                alt="Artifix"
                className="h-9 w-auto object-contain dark:hidden transition-transform group-hover:scale-105"
              />
              <img
                src="/brand/logo1-dark.png"
                alt="Artifix"
                className="h-9 w-auto object-contain hidden dark:block transition-transform group-hover:scale-105"
              />
            </Link>
            <span className="hidden sm:inline-block text-stone-300 dark:text-stone-700">|</span>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md">
              The verified trades network connecting Nigerian property owners with vetted craftsmen.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-xs text-stone-500 dark:text-stone-400 text-center sm:text-right">
            <span>&copy; {new Date().getFullYear()} Artifix Network. Built for Nigeria&apos;s craft economy.</span>
            <div className="flex items-center gap-4">
              <span className="hover:text-stone-900 dark:hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-stone-900 dark:hover:text-white cursor-pointer transition-colors">Terms of Service</span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Top ↑
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
