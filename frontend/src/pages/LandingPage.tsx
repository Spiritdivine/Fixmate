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
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LANDING_IMAGES } from '../assets/landing-assets';
import { ArtisanDoodles } from '../components/ui/ArtisanDoodles';
import {
  SolarEnergyHugeIcon,
  ElectricalHugeIcon,
  PlumbingHugeIcon,
  CarpentryHugeIcon,
  MasonryHugeIcon,
  WeldingHugeIcon,
  IdentityAuditHugeIcon,
  SmartContractVaultHugeIcon,
  ProofOfWorkAuditHugeIcon,
  DisputeTribunalHugeIcon,
  ScopeContractHugeIcon,
  FundEscrowHugeIcon,
  VisualInspectionHugeIcon,
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

export const LandingPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'artisan'>('client');
  const [selectedPayment, setSelectedPayment] = useState<'paystack' | 'monad'>('paystack');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submittedLead, setSubmittedLead] = useState<{ name: string; email: string; role: 'client' | 'artisan' } | null>(null);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    // Default to the warm editorial light canvas as seen in the referenced design
    document.documentElement.classList.remove('dark');
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

  const scrollToWaitlist = (role?: 'client' | 'artisan') => {
    if (role) {
      setSelectedRole(role);
    }
    setMobileMenuOpen(false);
    document.getElementById('waitlist-hero')?.scrollIntoView({ behavior: 'smooth' });
    const input = document.querySelector<HTMLInputElement>('#waitlist-name-input') || document.querySelector<HTMLInputElement>('#waitlist-hero input');
    setTimeout(() => input?.focus(), 300);
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@') || !fullName.trim()) return;

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#BD5324', '#0284C7', '#10B981', '#F59E0B'],
    });

    const lead = { name: fullName.trim(), email: email.trim(), role: selectedRole };
    setSubmittedLead(lead);
    setWaitlistSubmitted(true);
    try {
      localStorage.setItem('artifix_waitlist_lead', JSON.stringify(lead));
    } catch {
      // ignore storage issues if private mode
    }
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-amber-200 selection:text-stone-900 artifix-canvas overflow-x-hidden ${isDarkMode ? 'dark' : ''}`}>
      
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION                                            */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#F5EFEB]/90 dark:bg-[#0E1310]/90 border-b border-stone-300/60 dark:border-stone-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img
              src="/brand/artifix-icon-transparent.png"
              alt="Artifix"
              className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
              Artifix
            </span>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
            <a href="#how-it-works" className="hover:text-stone-950 dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#for-clients" className="hover:text-stone-950 dark:hover:text-white transition-colors">
              For Clients
            </a>
            <a href="#for-artisans" className="hover:text-stone-950 dark:hover:text-white transition-colors">
              For Artisans
            </a>
            <a href="#trades" className="hover:text-stone-950 dark:hover:text-white transition-colors">
              Trades
            </a>
            <a href="#trust" className="hover:text-stone-950 dark:hover:text-white transition-colors">
              Trust
            </a>
            <a href="#faq" className="hover:text-stone-950 dark:hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => scrollToWaitlist()}
              className="px-4 sm:px-5 py-2.5 rounded-full bg-[#BD5324] hover:bg-[#A64319] text-white text-xs sm:text-sm font-bold tracking-tight shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
            >
              <span className="inline sm:hidden">Join Waitlist</span>
              <span className="hidden sm:inline">Join Priority Waitlist</span>
            </button>

            {/* Light/Dark Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors shrink-0"
            >
              {isDarkMode ? <SunHugeIcon size={18} className="text-[#BD5324]" /> : <MoonHugeIcon size={18} className="text-[#BD5324]" />}
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors shrink-0"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-300/80 dark:border-stone-800 bg-[#F5EFEB]/98 dark:bg-[#0E1310]/98 px-6 py-6 backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-4 text-sm font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200 dark:border-stone-800/60 hover:text-[#BD5324] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#for-clients"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200 dark:border-stone-800/60 hover:text-[#BD5324] transition-colors"
              >
                For Clients
              </a>
              <a
                href="#for-artisans"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200 dark:border-stone-800/60 hover:text-[#BD5324] transition-colors"
              >
                For Artisans
              </a>
              <a
                href="#trades"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200 dark:border-stone-800/60 hover:text-[#BD5324] transition-colors"
              >
                Certified Trades
              </a>
              <a
                href="#trust"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200 dark:border-stone-800/60 hover:text-[#BD5324] transition-colors"
              >
                The Trust Layer
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-stone-200 dark:border-stone-800/60 hover:text-[#BD5324] transition-colors"
              >
                FAQ
              </a>
            </nav>
            <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => scrollToWaitlist()}
                className="w-full py-3 rounded-full bg-[#BD5324] text-white text-xs font-bold uppercase tracking-wider shadow-md text-center"
              >
                Join Priority Waitlist
              </button>
            </div>
          </div>
        )}
      </header>


      {/* ============================================================ */}
      {/* 2. THE HERO SECTION (REPLICATING THE REFERENCED DESIGN)      */}
      {/* ============================================================ */}
      <section className="relative pt-6 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Illustrative Floating Artisan Doodles (Subtle Hand-drawn Background) */}
        <ArtisanDoodles />

        {/* Subtle Architectural Drafting Marks */}
        <div className="absolute top-8 left-12 hidden md:block text-[11px] font-mono text-stone-400 dark:text-stone-600 select-none">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 border-t border-l border-stone-400 dark:border-stone-600" />
            <span>3.3792° N</span>
          </div>
          <div className="pl-4">7.3986° E</div>
        </div>

        <div className="absolute top-12 right-20 hidden md:block text-[11px] font-mono text-stone-400 dark:text-stone-600 select-none">
          <span>+ GRID REF #AF-2026</span>
        </div>

        {/* Hero Grid Container */}
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-center relative z-10 pt-4">
          
          {/* ========================================== */}
          {/* LEFT COLLAGE OF CARDS (Span 3 on XL)       */}
          {/* ========================================== */}
          <div className="hidden xl:flex xl:col-span-3 flex-col gap-6 relative">
            
            {/* Card 1: Electrician Photo Card (tilted -4deg) */}
            <div className="relative transform -rotate-3 hover:rotate-0 transition-transform duration-300 w-64">
              <div className="relative rounded-xl overflow-hidden shadow-xl border border-stone-300/80 dark:border-stone-800 bg-stone-900">
                <img
                  src={LANDING_IMAGES.electrician}
                  alt="Electrician at work"
                  className="w-full h-44 object-cover filter contrast-[1.05]"
                />
                <div className="absolute bottom-2.5 left-2.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-950/85 backdrop-blur-sm text-[11px] font-bold text-white tracking-wider uppercase border border-stone-700/60">
                    <span className="text-emerald-400">ELECTRICIAN</span>
                    <span className="text-stone-400">/</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Check className="w-3 h-3 stroke-[3]" /> NIN VERIFIED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Artisan Trade Passport Card (tilted -1deg) */}
            <div className="relative transform -rotate-1 hover:rotate-0 transition-transform duration-300 w-72 -mt-2">
              {/* Pushpin at top */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-stone-700 border-2 border-amber-600 shadow-md z-20" />
              
              <div className="paper-card rounded-xl p-4 shadow-2xl relative text-stone-900 dark:text-stone-100">
                <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-2">
                  ARTISAN TRADE PASSPORT
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={LANDING_IMAGES.babatunde}
                    alt="Babatunde O."
                    className="w-12 h-12 rounded-lg object-cover border border-stone-300 shadow-sm"
                  />
                  <div>
                    <div className="text-sm font-bold leading-tight">Babatunde O.</div>
                    <div className="text-[10px] font-mono text-stone-500 uppercase">Master Solar Technician</div>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="space-y-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 border-t border-stone-200 dark:border-stone-800 pt-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    <span>NIN VERIFIED</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    <span>PHONE VERIFIED</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    <span>TRADE CERTIFIED</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1 text-center py-1.5 px-2 bg-stone-100 dark:bg-stone-900 rounded-lg text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-800 mb-3">
                  <div>
                    <div className="text-xs font-black">127</div>
                    <div className="text-[8px] font-mono text-stone-500 uppercase">JOBS</div>
                  </div>
                  <div>
                    <div className="text-xs font-black">98.7%</div>
                    <div className="text-[8px] font-mono text-stone-500 uppercase">ON TIME</div>
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center justify-center gap-0.5">
                      4.9 <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="text-[8px] font-mono text-stone-500 uppercase">RATING</div>
                  </div>
                </div>

                {/* Card footer with ID, QR and Wax Stamp */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-200/80 dark:border-stone-800">
                  <div>
                    <div className="text-[9px] font-mono text-stone-400">ID: AF / 00921</div>
                    <div className="w-7 h-7 bg-stone-200 dark:bg-stone-800 rounded flex items-center justify-center mt-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="3" height="3" />
                        <rect x="18" y="18" width="3" height="3" />
                      </svg>
                    </div>
                  </div>

                  {/* Embossed Terracotta Wax Stamp */}
                  <div className="wax-seal w-14 h-14 rounded-full flex flex-col items-center justify-center text-amber-50 border border-amber-900/40 transform rotate-6 shadow-md select-none">
                    <div className="text-[7px] font-black uppercase tracking-tighter leading-none">VERIFIED</div>
                    <div className="text-[9px] font-extrabold tracking-tight">ARTIFIX</div>
                    <div className="text-[6px] font-mono">2026 SEAL</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Card 3: Solar Tech Photo (tilted -3deg) */}
            <div className="relative transform -rotate-3 hover:rotate-0 transition-transform duration-300 w-60 -mt-2">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-stone-300/80 dark:border-stone-800 bg-stone-900">
                <img
                  src={LANDING_IMAGES.solarTech}
                  alt="Solar technician installing panels"
                  className="w-full h-32 object-cover filter contrast-[1.05]"
                />
                <div className="absolute bottom-2 left-2">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-950/85 backdrop-blur-sm text-[10px] font-bold text-white tracking-wider uppercase border border-stone-700/60">
                    <span className="text-emerald-400">SOLAR TECH</span>
                    <span className="text-stone-400">/</span>
                    <span className="text-emerald-400">✓ VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Plumbing Photo Card (tilted -1deg) */}
            <div className="relative transform -rotate-1 hover:rotate-0 transition-transform duration-300 w-56 -mt-2">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-stone-300/80 dark:border-stone-800 bg-stone-900">
                <img
                  src={LANDING_IMAGES.plumber}
                  alt="Plumber working with pipe wrench"
                  className="w-full h-28 object-cover filter contrast-[1.05]"
                />
                <div className="absolute bottom-2 left-2">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-950/85 backdrop-blur-sm text-[10px] font-bold text-white tracking-wider uppercase border border-stone-700/60">
                    <span className="text-emerald-400">PLUMBING</span>
                    <span className="text-stone-400">/</span>
                    <span className="text-emerald-400">✓ VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Floating Payment Choice Card */}
            <div className="relative transform rotate-2 hover:rotate-0 transition-transform duration-300 w-64 -mt-2">
              <div className="rounded-xl p-3.5 bg-[#171E18] text-white shadow-2xl border border-stone-700/60">
                <div className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-2">
                  CHOOSE PAYMENT
                </div>

                <div className="space-y-2">
                  {/* Paystack Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('paystack')}
                    className={`w-full text-left flex items-center justify-between p-2 rounded-lg border transition-all ${
                      selectedPayment === 'paystack'
                        ? 'border-amber-500/80 bg-stone-800/80'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-[#BD5324]/20 border border-[#BD5324]/40 flex items-center justify-center text-[#BD5324]">
                        <CreditCardHugeIcon size={14} className="text-[#BD5324]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Paystack</div>
                        <div className="text-[9px] text-stone-400">NGN • Card / Bank Transfer</div>
                      </div>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedPayment === 'paystack' ? 'border-[#BD5324]' : 'border-stone-600'
                    }`}>
                      {selectedPayment === 'paystack' && (
                        <div className="w-2 h-2 rounded-full bg-[#BD5324]" />
                      )}
                    </div>
                  </button>

                  <div className="text-center text-[8px] font-mono text-stone-500">OR</div>

                  {/* Monad Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('monad')}
                    className={`w-full text-left flex items-center justify-between p-2 rounded-lg border transition-all ${
                      selectedPayment === 'monad'
                        ? 'border-[#BD5324]/80 bg-stone-800/80'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-[#BD5324]/20 border border-[#BD5324]/40 flex items-center justify-center text-[#BD5324]">
                        <MonadTokenHugeIcon size={14} className="text-[#BD5324]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Monad</div>
                        <div className="text-[9px] text-stone-400">$MON • Crypto</div>
                      </div>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedPayment === 'monad' ? 'border-purple-500' : 'border-stone-600'
                    }`}>
                      {selectedPayment === 'monad' && (
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: Carpentry Photo */}
            <div className="relative transform -rotate-2 hover:rotate-0 transition-transform duration-300 w-56 -mt-2">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-stone-300/80 dark:border-stone-800 bg-stone-900">
                <img
                  src={LANDING_IMAGES.carpenter}
                  alt="Carpenter planing wood"
                  className="w-full h-28 object-cover filter contrast-[1.05]"
                />
                <div className="absolute bottom-2 left-2">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-950/85 backdrop-blur-sm text-[10px] font-bold text-white tracking-wider uppercase border border-stone-700/60">
                    <span className="text-emerald-400">CARPENTRY</span>
                    <span className="text-stone-400">/</span>
                    <span className="text-emerald-400">✓ VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

          </div>


          {/* ========================================== */}
          {/* ========================================== */}
          {/* CENTER HERO COPY & ACTIONS (Span 6 on XL)  */}
          {/* ========================================== */}
          <div className="xl:col-span-6 flex flex-col items-center text-center px-2 sm:px-4">
            
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm text-[11px] font-mono text-stone-700 dark:text-stone-300 mb-6 sm:mb-8 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider">Live on Monad Testnet</span>
              <span className="hidden sm:inline text-stone-400">|</span>
              <span className="uppercase text-amber-700 dark:text-amber-400 font-bold">Early Access Open</span>
            </div>

            {/* Massive Headline with Highlight Pill */}
            <h1 className="text-3xl sm:text-5xl lg:text-[58px] font-black tracking-tight text-stone-900 dark:text-stone-100 leading-[1.15] sm:leading-[1.12] max-w-2xl mb-6">
              Hire the right hands. <br />
              Protect the work. <br />
              <span className="text-highlight-pill mr-2.5">
                Release the money
              </span>
              <span>when it&apos;s done.</span>
            </h1>

            {/* Subtitle Paragraph */}
            <p className="text-sm sm:text-base md:text-lg text-stone-600 dark:text-stone-300 max-w-xl mb-7 sm:mb-8 leading-relaxed font-normal px-1">
              Artifix connects clients with verified artisans through milestone-based escrow, proof-of-work and transparent settlement.
            </p>

            {/* Segmented Dual Role Toggle Switch */}
            <div className="p-1 sm:p-1.5 rounded-full bg-stone-200/90 dark:bg-stone-900/90 border border-stone-300/80 dark:border-stone-800 flex items-center gap-1 mb-8 shadow-inner max-w-full">
              <button
                type="button"
                onClick={() => setSelectedRole('client')}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all ${
                  selectedRole === 'client'
                    ? 'bg-[#262B25] text-white shadow-md'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <ClientProfileHugeIcon size={14} className={selectedRole === 'client' ? 'text-white' : 'text-[#BD5324]'} />
                <span>I Need a Pro</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('artisan')}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all ${
                  selectedRole === 'artisan'
                    ? 'bg-[#262B25] text-white shadow-md'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <ArtisanCraftsmanHugeIcon size={14} className={selectedRole === 'artisan' ? 'text-white' : 'text-[#BD5324]'} />
                <span>I&apos;m a Skilled Artisan</span>
              </button>
            </div>

            {/* Waitlist Form Card */}
            <div id="waitlist-hero" className="w-full max-w-lg mb-8">
              {!waitlistSubmitted ? (
                <form
                  onSubmit={handleWaitlistSubmit}
                  className="p-3 sm:p-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl border border-stone-300/90 dark:border-stone-700 shadow-xl text-left"
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
                        placeholder="Your full name (e.g. Tunde Balogun)"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#BD5324] focus:border-transparent transition-all"
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
                        placeholder="Your email address (e.g. tunde@gmail.com)"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#BD5324] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-xl bg-[#BD5324] hover:bg-[#A64319] text-white text-xs font-bold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] group"
                  >
                    <span>
                      {selectedRole === 'client'
                        ? 'Join Priority Waitlist as Client'
                        : 'Join Priority Waitlist as Artisan'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              ) : (
                <div className="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-emerald-300 dark:border-emerald-800 shadow-xl text-left transition-all">
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Wave 1 Priority Pass</span>
                      </div>
                      <h4 className="text-base font-black text-stone-900 dark:text-white">
                        You&apos;re on the list, {submittedLead?.name || 'Partner'}!
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-1">
                        We&apos;ve reserved your priority spot as a{' '}
                        <span className="font-bold text-[#BD5324]">
                          {submittedLead?.role === 'artisan' ? 'Verified Master Artisan' : 'Founding Client'}
                        </span>
                        . An early onboarding invite will be sent to{' '}
                        <span className="font-mono font-medium text-stone-800 dark:text-stone-200">
                          {submittedLead?.email}
                        </span>
                        .
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 dark:text-stone-400">
                      0% platform fee entitlement locked
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWaitlistSubmitted(false);
                        setEmail('');
                        setFullName('');
                      }}
                      className="text-[#BD5324] hover:underline font-semibold"
                    >
                      Register another email
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Social Proof Row */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-stone-700 dark:text-stone-300">
              {/* Overlapping Avatar Stack */}
              <div className="flex -space-x-2">
                {LANDING_IMAGES.avatars.map((avatar, idx) => (
                  <img
                    key={idx}
                    src={avatar}
                    alt="Artifix member"
                    className="w-8 h-8 rounded-full border-2 border-[#F5EFEB] dark:border-[#0E1310] object-cover"
                  />
                ))}
              </div>

              {/* Stars & Rating */}
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span className="font-bold text-stone-900 dark:text-white">4.9/5</span>
              </div>

              <span className="text-stone-500 dark:text-stone-400">
                from 2,400+ homeowners &amp; contractors
              </span>
            </div>

            {/* Reassurance note replacing /register link */}
            <div className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Priority access invitations roll out weekly to verified accounts</span>
            </div>

            {/* ============================================================ */}
            {/* TABLET & MOBILE VISUAL SHOWCASE (Visible below XL screens)  */}
            {/* ============================================================ */}
            <div className="xl:hidden mt-12 w-full max-w-lg flex flex-col gap-6 text-left">
              
              {/* Responsive Live Milestone Escrow Card */}
              <div className="rounded-2xl p-4 sm:p-5 bg-[#141C15] text-white shadow-2xl border border-stone-700/60 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE MILESTONE ESCROW #AF-9021
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
                </div>

                <div className="text-sm sm:text-base font-bold text-white mb-2">
                  Solar Inverter &amp; Lithium Battery Setup
                </div>

                {/* Artisan Row */}
                <div className="flex items-center gap-2.5 mb-3 text-[11px] text-stone-300">
                  <img
                    src={LANDING_IMAGES.babatunde}
                    alt="Babatunde O."
                    className="w-7 h-7 rounded-full object-cover border border-stone-600"
                  />
                  <div>
                    <span className="font-semibold text-white">Artisan: Babatunde O.</span>
                    <span className="text-[10px] text-stone-400 block leading-tight">Master Solar Technician • NIN Verified ✓</span>
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-1.5 text-[11px] mb-3.5 border-t border-stone-800 pt-2.5">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-stone-300 flex items-center gap-1.5 font-mono">
                      <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-[9px] text-emerald-400">01</span>
                      Survey
                    </span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Completed
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 bg-amber-950/30 -mx-2 px-2 rounded">
                    <span className="text-amber-200 font-semibold flex items-center gap-1.5 font-mono">
                      <span className="w-4 h-4 rounded-full bg-amber-900 border border-amber-500/50 flex items-center justify-center text-[9px] text-amber-300">02</span>
                      Installation
                    </span>
                    <span className="text-[#BD5324] font-medium flex items-center gap-1 text-[10px] bg-[#BD5324]/20 border border-[#BD5324]/40 px-2 py-0.5 rounded-full">
                      <VaultLockHugeIcon size={11} className="text-[#BD5324]" /> Locked in Escrow
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 text-stone-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <span className="w-4 h-4 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-[9px]">03</span>
                      Inspection
                    </span>
                    <span className="text-stone-500 text-[10px]">⚪ Pending</span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 text-stone-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <span className="w-4 h-4 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-[9px]">04</span>
                      Release
                    </span>
                    <span className="text-stone-500 text-[10px]">⚪ Locked</span>
                  </div>
                </div>

                {/* Escrow Value Box */}
                <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">ESCROW VALUE</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment('paystack')}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${
                          selectedPayment === 'paystack'
                            ? 'bg-[#0BA4DB]/40 text-[#0BA4DB] border-[#0BA4DB]'
                            : 'text-stone-500 border-stone-700'
                        }`}
                      >
                        Paystack NGN
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPayment('monad')}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${
                          selectedPayment === 'monad'
                            ? 'bg-[#836EF9]/40 text-[#836EF9] border-[#836EF9]'
                            : 'text-stone-500 border-stone-700'
                        }`}
                      >
                        MONAD Testnet
                      </button>
                    </div>
                  </div>
                  <div className="text-xl font-extrabold tracking-tight text-white">
                    {selectedPayment === 'paystack' ? '₦240,000' : '415 $MON'}
                  </div>
                  <div className="text-[10px] font-mono text-stone-400">
                    {selectedPayment === 'paystack' ? '≈ 415 $MON' : '≈ ₦240,000 NGN'}
                  </div>
                </div>

                {/* Proof of Work */}
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
                    PROOF OF WORK
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="relative rounded-lg overflow-hidden border border-stone-800">
                      <img
                        src={LANDING_IMAGES.proofBefore}
                        alt="Before: Empty utility wall"
                        className="w-full h-16 sm:h-20 object-cover"
                      />
                      <div className="p-1 bg-stone-950/90 text-[8px] text-stone-300 font-mono">
                        <span className="font-bold text-amber-400">Before</span>
                        <div className="truncate text-stone-400">Empty utility wall</div>
                      </div>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border border-stone-800">
                      <img
                        src={LANDING_IMAGES.proofAfter}
                        alt="After: 5kVA Inverter rack wiring"
                        className="w-full h-16 sm:h-20 object-cover"
                      />
                      <div className="p-1 bg-stone-950/90 text-[8px] text-stone-300 font-mono">
                        <span className="font-bold text-emerald-400">After</span>
                        <div className="truncate text-stone-400">5kVA Inverter rack wiring</div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Pill */}
                  <div className="w-full py-1.5 px-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approved by Client • Ready for Instant Settlement</span>
                  </div>
                </div>
              </div>

              {/* Responsive Artisan Trade Passport Card */}
              <div className="paper-card rounded-2xl p-4 sm:p-5 shadow-xl text-stone-900 dark:text-stone-100">
                <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400 mb-2">
                  ARTISAN TRADE PASSPORT
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={LANDING_IMAGES.babatunde}
                    alt="Babatunde O."
                    className="w-12 h-12 rounded-lg object-cover border border-stone-300 shadow-sm"
                  />
                  <div>
                    <div className="text-sm font-bold leading-tight">Babatunde O.</div>
                    <div className="text-[10px] font-mono text-stone-500 uppercase">Master Solar Technician</div>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="grid grid-cols-3 gap-1 text-[10px] font-medium text-stone-700 dark:text-stone-300 border-t border-stone-200 dark:border-stone-800 pt-2 mb-3">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    <span>NIN VERIFIED</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    <span>PHONE VERIFIED</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    <span>TRADE CERTIFIED</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1 text-center py-2 px-2 bg-stone-100 dark:bg-stone-900 rounded-lg text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-800 mb-3">
                  <div>
                    <div className="text-xs font-black">127</div>
                    <div className="text-[8px] font-mono text-stone-500 uppercase">JOBS</div>
                  </div>
                  <div>
                    <div className="text-xs font-black">98.7%</div>
                    <div className="text-[8px] font-mono text-stone-500 uppercase">ON TIME</div>
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center justify-center gap-0.5">
                      4.9 <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="text-[8px] font-mono text-stone-500 uppercase">RATING</div>
                  </div>
                </div>

                {/* Footer with ID and Wax Seal */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 dark:border-stone-800">
                  <div className="text-[9px] font-mono text-stone-400">ID: AF / 00921 • Monad 10143 Verified</div>
                  <div className="wax-seal w-12 h-12 rounded-full flex flex-col items-center justify-center text-amber-50 border border-amber-900/40 transform rotate-3 shadow-md select-none">
                    <div className="text-[6px] font-black uppercase tracking-tighter leading-none">VERIFIED</div>
                    <div className="text-[8px] font-extrabold tracking-tight">ARTIFIX</div>
                    <div className="text-[5px] font-mono">2026 SEAL</div>
                  </div>
                </div>
              </div>

            </div>

          </div>


          {/* ========================================== */}
          {/* RIGHT COLLAGE OF CARDS (Span 3 on XL)      */}
          {/* ========================================== */}
          <div className="hidden xl:flex xl:col-span-3 flex-col gap-6 relative">
            
            {/* Top Right Group: Villa + Rooftop Worker */}
            <div className="flex items-start justify-end gap-3 -mr-6">
              {/* Card 1A: Luxury Villa Architecture with Tape */}
              <div className="relative transform rotate-3 hover:rotate-0 transition-transform duration-300 w-52">
                <div className="relative rounded-xl overflow-hidden shadow-xl border border-stone-300/80 dark:border-stone-800 bg-stone-900">
                  <img
                    src={LANDING_IMAGES.villa}
                    alt="Modern architectural home"
                    className="w-full h-32 object-cover filter contrast-[1.05]"
                  />
                  {/* Tape Label */}
                  <div className="absolute top-2 right-2 transform rotate-2">
                    <span className="tape-strip">Modern homes. Better living.</span>
                  </div>
                </div>
              </div>

              {/* Card 1B: Rooftop Construction Worker with Tape */}
              <div className="relative transform rotate-6 hover:rotate-0 transition-transform duration-300 w-40 -mt-2">
                <div className="relative rounded-xl overflow-hidden shadow-xl border border-stone-300/80 dark:border-stone-800 bg-stone-900">
                  <img
                    src={LANDING_IMAGES.roofer}
                    alt="Rooftop construction worker"
                    className="w-full h-36 object-cover filter contrast-[1.05]"
                  />
                  {/* Tape Label */}
                  <div className="absolute bottom-2 right-2 transform -rotate-2">
                    <span className="tape-strip">Real people. Real skills.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: THE STAR - Live Milestone Escrow Card (tilted -2deg) */}
            <div className="relative transform -rotate-1 hover:rotate-0 transition-transform duration-300 w-[330px] -ml-8 z-20">
              <div className="rounded-2xl p-4 bg-[#141C15] text-white shadow-2xl border border-stone-700/60 font-sans">
                
                {/* Header */}
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE MILESTONE ESCROW #AF-9021
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
                </div>

                <div className="text-sm font-bold text-white mb-2">
                  Solar Inverter &amp; Lithium Battery Setup
                </div>

                {/* Artisan Row */}
                <div className="flex items-center gap-2.5 mb-3.5 text-[11px] text-stone-300">
                  <img
                    src={LANDING_IMAGES.babatunde}
                    alt="Babatunde O."
                    className="w-6 h-6 rounded-full object-cover border border-stone-600"
                  />
                  <div>
                    <span className="font-semibold text-white">Artisan: Babatunde O.</span>
                    <span className="text-[10px] text-stone-400 block leading-tight">Master Solar Technician • NIN Verified ✓</span>
                  </div>
                </div>

                {/* 4 Milestones Timeline */}
                <div className="space-y-1.5 text-[11px] mb-4 border-t border-stone-800 pt-2.5">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-stone-300 flex items-center gap-1.5 font-mono">
                      <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-[9px] text-emerald-400">01</span>
                      Survey
                    </span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Completed
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 bg-amber-950/30 -mx-2 px-2 rounded">
                    <span className="text-amber-200 font-semibold flex items-center gap-1.5 font-mono">
                      <span className="w-4 h-4 rounded-full bg-amber-900 border border-amber-500/50 flex items-center justify-center text-[9px] text-amber-300">02</span>
                      Installation
                    </span>
                    <span className="text-[#BD5324] font-medium flex items-center gap-1 text-[10px] bg-[#BD5324]/20 border border-[#BD5324]/40 px-2 py-0.5 rounded-full">
                      <VaultLockHugeIcon size={11} className="text-[#BD5324]" /> Locked in Escrow
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 text-stone-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <span className="w-4 h-4 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-[9px]">03</span>
                      Inspection
                    </span>
                    <span className="text-stone-500 text-[10px]">⚪ Pending</span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 text-stone-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <span className="w-4 h-4 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-[9px]">04</span>
                      Release
                    </span>
                    <span className="text-stone-500 text-[10px]">⚪ Locked</span>
                  </div>
                </div>

                {/* Escrow Value Display Box */}
                <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 mb-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">ESCROW VALUE</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#0BA4DB]/30 text-[#0BA4DB] border border-[#0BA4DB]/40">
                        Paystack
                      </span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#836EF9]/30 text-[#836EF9] border border-[#836EF9]/40">
                        MONAD
                      </span>
                    </div>
                  </div>
                  <div className="text-xl font-extrabold tracking-tight text-white">
                    {selectedPayment === 'paystack' ? '₦240,000' : '415 $MON'}
                  </div>
                  <div className="text-[10px] font-mono text-stone-400">
                    {selectedPayment === 'paystack' ? '≈ 415 $MON' : '≈ ₦240,000 NGN'}
                  </div>
                </div>

                {/* Proof of Work Before / After */}
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
                    PROOF OF WORK
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="relative rounded-lg overflow-hidden border border-stone-800">
                      <img
                        src={LANDING_IMAGES.proofBefore}
                        alt="Before: Empty utility wall"
                        className="w-full h-16 object-cover"
                      />
                      <div className="p-1 bg-stone-950/90 text-[8px] text-stone-300 font-mono">
                        <span className="font-bold text-amber-400">Before</span>
                        <div className="truncate text-stone-400">Empty utility wall</div>
                      </div>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border border-stone-800">
                      <img
                        src={LANDING_IMAGES.proofAfter}
                        alt="After: 5kVA Inverter rack wiring"
                        className="w-full h-16 object-cover"
                      />
                      <div className="p-1 bg-stone-950/90 text-[8px] text-stone-300 font-mono">
                        <span className="font-bold text-emerald-400">After</span>
                        <div className="truncate text-stone-400">5kVA Inverter rack wiring</div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Pill */}
                  <div className="w-full py-1.5 px-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approved by Client</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Card 3: Pinned Job Contract Docket & Stats */}
            <div className="flex items-start gap-4 -mt-2">
              
              {/* Job Contract Paper Card */}
              <div className="paper-card rounded-xl p-3 shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-300 w-44 text-stone-900 dark:text-stone-100 relative">
                {/* Paper clip */}
                <div className="absolute -top-3 right-3 w-3 h-6 rounded-full border-2 border-amber-600/80 bg-transparent" />

                <div className="text-[9px] font-mono uppercase tracking-wider text-stone-500 mb-1">
                  JOB CONTRACT
                </div>
                <div className="text-xs font-bold leading-tight">Solar Installation</div>
                <div className="text-[9px] font-mono text-stone-500 mb-2">5kVA Inverter System</div>

                <div className="space-y-1 text-[10px] font-medium border-t border-stone-200 dark:border-stone-800 pt-1.5">
                  <div className="flex items-center gap-1.5">
                    <JobContractDocketHugeIcon size={12} className="text-[#BD5324]" />
                    <span>4 Milestones</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-white">
                    <NairaCoinsHugeIcon size={12} className="text-[#BD5324]" />
                    <span>₦800,000 Total</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#BD5324] font-semibold">
                    <ShieldCheckHugeIcon size={12} className="text-[#BD5324]" />
                    <span>Escrow Protected</span>
                  </div>
                </div>
              </div>

              {/* Stats Paper Card */}
              <div className="paper-card rounded-xl p-2.5 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300 w-32 text-stone-900 dark:text-stone-100">
                <div className="space-y-1.5 text-center">
                  <div>
                    <div className="text-sm font-black">127</div>
                    <div className="text-[8px] font-mono text-stone-500 uppercase">COMPLETED JOBS</div>
                  </div>
                  <div className="border-t border-stone-200 dark:border-stone-800 pt-1">
                    <div className="text-sm font-black">98.7%</div>
                    <div className="text-[8px] font-mono text-stone-500 uppercase">ON-TIME DELIVERY</div>
                  </div>
                  <div className="border-t border-stone-200 dark:border-stone-800 pt-1">
                    <div className="text-sm font-black flex items-center justify-center gap-0.5">
                      4.9 <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="text-[8px] font-mono text-stone-500 uppercase">VERIFIED RATING</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Card 4: Worker Photo with Tape Note (tilted 3deg) */}
            <div className="relative transform rotate-3 hover:rotate-0 transition-transform duration-300 w-60 self-end -mt-2">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-stone-300/80 dark:border-stone-800 bg-stone-900">
                <img
                  src={LANDING_IMAGES.welder}
                  alt="Skilled technician in workshop"
                  className="w-full h-28 object-cover filter contrast-[1.05]"
                />
                <div className="absolute bottom-2 right-2 transform -rotate-1">
                  <span className="tape-strip">Skilled hands. Stronger economy.</span>
                </div>
              </div>
            </div>

            {/* Card 5: Commercial & Residential Building Photo */}
            <div className="relative transform -rotate-2 hover:rotate-0 transition-transform duration-300 w-52 self-start -mt-2">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-stone-300/80 dark:border-stone-800 bg-stone-900">
                <img
                  src={LANDING_IMAGES.building}
                  alt="Commercial architecture"
                  className="w-full h-24 object-cover filter contrast-[1.05]"
                />
                <div className="absolute top-2 left-2">
                  <span className="tape-strip">Commercial &amp; Residential</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Center Scroll Indicator with Drafting Crosshair */}
        <div className="mt-14 flex flex-col items-center justify-center select-none text-stone-400 dark:text-stone-600">
          <a
            href="#how-it-works"
            className="flex flex-col items-center gap-1.5 group hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center text-[10px] font-mono tracking-widest uppercase group-hover:border-stone-500 transition-colors">
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </div>
            <span className="text-[10px] font-mono tracking-widest uppercase">SCROLL</span>
          </a>
        </div>

      </section>


      {/* ============================================================ */}
      {/* 3. HOW IT WORKS (THE 4-STEP ESCROW LIFECYCLE)                */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-300/60 dark:border-stone-800 bg-white/50 dark:bg-stone-950/40">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-widest text-[#BD5324] font-bold mb-2">
              The Protocol Flow
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white mb-4">
              How Artifix Protects Both Sides
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
              No more upfront contractor abandonment. No more unpaid artisan invoices. Every naira or token is locked securely in milestone smart escrow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="paper-card rounded-2xl p-6 shadow-sm flex flex-col justify-between relative group hover:border-[#BD5324]/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-mono text-sm font-bold flex items-center justify-center">
                  01
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center">
                  <ScopeContractHugeIcon className="w-5 h-5 text-[#BD5324]" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white mb-2">
                  Scope &amp; Agree Milestones
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Client and verified artisan break the project down into transparent deliverables with clear due dates and costs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 text-[11px] font-mono text-[#BD5324]">
                ✓ Smart Contract Generated
              </div>
            </div>

            {/* Step 2 */}
            <div className="paper-card rounded-2xl p-6 shadow-sm flex flex-col justify-between relative group hover:border-[#BD5324]/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#BD5324] text-white font-mono text-sm font-bold flex items-center justify-center">
                  02
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center">
                  <FundEscrowHugeIcon className="w-5 h-5 text-[#BD5324]" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white mb-2">
                  Fund Escrow Safe
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Client deposits funds via Paystack (NGN cards/transfers) or Monad Testnet ($MON). Artisan is notified that money is guaranteed.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 text-[11px] font-mono text-[#BD5324] font-semibold">
                🔒 100% Locked &amp; Insured
              </div>
            </div>

            {/* Step 3 */}
            <div className="paper-card rounded-2xl p-6 shadow-sm flex flex-col justify-between relative group hover:border-[#BD5324]/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-mono text-sm font-bold flex items-center justify-center">
                  03
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center">
                  <VisualInspectionHugeIcon className="w-5 h-5 text-[#BD5324]" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white mb-2">
                  Proof of Work Inspection
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Artisan submits timestamped Before/After photos and site completion notes directly through their Artisan Portal.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 text-[11px] font-mono text-[#BD5324]">
                📸 Visual Audit Trail
              </div>
            </div>

            {/* Step 4 */}
            <div className="paper-card rounded-2xl p-6 shadow-sm flex flex-col justify-between relative group hover:border-[#BD5324]/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#BD5324] text-white font-mono text-sm font-bold flex items-center justify-center">
                  04
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center">
                  <InstantSettlementHugeIcon className="w-5 h-5 text-[#BD5324]" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white mb-2">
                  Instant Release
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Client approves the milestone with one tap. Escrow releases funds immediately to the artisan&apos;s bank account or Web3 wallet.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 text-[11px] font-mono text-[#BD5324] font-semibold">
                ⚡ Zero Settlement Delay
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ============================================================ */}
      {/* 4. CERTIFIED TRADES DIRECTORY                                */}
      {/* ============================================================ */}
      <section id="trades" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-300/60 dark:border-stone-800">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#BD5324] font-bold mb-2">
                Hands of Excellence
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
                Vetted Across Core Trades
              </h2>
            </div>
            <p className="text-stone-600 dark:text-stone-400 text-sm max-w-md mt-3 md:mt-0">
              Only verified artisans with validated identity, technical evaluations, and background checks carry the Artifix Trade Passport.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Trade 1: Solar & Clean Energy */}
            <div className="paper-card rounded-2xl p-6 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <SolarEnergyHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                Solar &amp; Power Inverters
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                Certified solar installers, battery rack wiremen, inverter sizing engineers, and clean energy technicians.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
                <span className="w-2 h-2 rounded-full bg-[#BD5324]" />
                <span>84 Active Certified Pros</span>
              </div>
            </div>

            {/* Trade 2: Electrical Engineering */}
            <div className="paper-card rounded-2xl p-6 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ElectricalHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                Electrical Engineering
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                Industrial panel wiring, conduit runs, generator changeovers, surge suppression, and smart home automation.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
                <span className="w-2 h-2 rounded-full bg-[#BD5324]" />
                <span>120 Active Certified Pros</span>
              </div>
            </div>

            {/* Trade 3: Precision Plumbing */}
            <div className="paper-card rounded-2xl p-6 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PlumbingHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                Precision Plumbing
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                PPR &amp; PVC pressure piping, borehole pump installation, drainage systems, and premium sanitary fittings.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
                <span className="w-2 h-2 rounded-full bg-[#BD5324]" />
                <span>95 Active Certified Pros</span>
              </div>
            </div>

            {/* Trade 4: Carpentry & Cabinetry */}
            <div className="paper-card rounded-2xl p-6 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CarpentryHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                Carpentry &amp; Cabinetry
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                Custom kitchen cabinetry, hardwood roofing rafters, flush doors, and architectural woodwork finishing.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
                <span className="w-2 h-2 rounded-full bg-[#BD5324]" />
                <span>110 Active Certified Pros</span>
              </div>
            </div>

            {/* Trade 5: Masonry & Tiling */}
            <div className="paper-card rounded-2xl p-6 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MasonryHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                Masonry &amp; Precision Tiling
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                Structural blocklaying, porcelain floor tiling, wall cladding, and laser-level leveling for high-end properties.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
                <span className="w-2 h-2 rounded-full bg-[#BD5324]" />
                <span>78 Active Certified Pros</span>
              </div>
            </div>

            {/* Trade 6: Welding & Metal Fabrication */}
            <div className="paper-card rounded-2xl p-6 hover:shadow-xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <WeldingHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                Welding &amp; Metal Fabrication
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
                Structural steel beams, wrought iron security gates, burglary bars, and stainless steel handrails.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
                <span className="w-2 h-2 rounded-full bg-[#BD5324]" />
                <span>65 Active Certified Pros</span>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ============================================================ */}
      {/* 5. THE TRUST & VERIFICATION ARCHITECTURE                     */}
      {/* ============================================================ */}
      <section id="trust" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-300/60 dark:border-stone-800 bg-[#F5EFEB]/50 dark:bg-stone-900/30">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-widest text-[#BD5324] font-bold mb-2">
              Security by Design
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white mb-4">
              The Four Pillars of the Trust Layer
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
              We eliminated the guesswork from hiring blue-collar services. Here is how your money and property are shielded from start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Pillar 1 */}
            <div className="paper-card rounded-2xl p-8 flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center shrink-0">
                <IdentityAuditHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                  Government Identity &amp; NIN Verification
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  Every artisan is verified against government databases with biometric National Identity Number (NIN) and phone verification. Anonymous contractors cannot operate on Artifix.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="paper-card rounded-2xl p-8 flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center shrink-0">
                <SmartContractVaultHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                  Monad Blockchain &amp; Paystack Escrow
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  Choose between automated Web3 smart contracts on Monad Testnet (Chain ID 10143) with deterministic release, or fiat settlements via Paystack. Funds are locked in tamper-proof custody.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="paper-card rounded-2xl p-8 flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center shrink-0">
                <ProofOfWorkAuditHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                  Verifiable Proof of Work Audit
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  Before a milestone can be claimed, the artisan uploads high-resolution Before &amp; After photos with geolocation and milestone checklists for full client inspection.
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="paper-card rounded-2xl p-8 flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#BD5324]/10 dark:bg-[#BD5324]/20 text-[#BD5324] flex items-center justify-center shrink-0">
                <DisputeTribunalHugeIcon className="w-7 h-7 text-[#BD5324]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-2">
                  Neutral Dispute Tribunal &amp; Arbitration
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  If work does not meet agreed specifications, the client or artisan can open a dispute. Our certified master inspectors review the evidence and issue binding escrow settlements within 48 hours.
                </p>
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
              <span className="tape-strip mb-4">FOR HOMEOWNERS &amp; BUILDERS</span>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mb-4">
                Never lose sleep over contractor work again.
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                Get high-quality renovations, solar installations, electrical and plumbing work done right. Funds remain in escrow until you personally inspect and approve each stage.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium mb-8">
                <li className="flex items-center gap-2.5">
                  <CertifiedBadgeHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Curated database of verified master craftsmen</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheckHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Multi-milestone escrow breakdown</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ProofOfWorkAuditHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Before/After visual audit before approving payout</span>
                </li>
              </ul>
            </div>

            <div>
              <button
                type="button"
                onClick={() => scrollToWaitlist('client')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs uppercase tracking-wider hover:bg-stone-800 dark:hover:bg-stone-100 transition-all shadow-md active:scale-95"
              >
                <span>Join Waitlist as Client</span>
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
              <span className="tape-strip mb-4">FOR MASTER ARTISANS</span>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mb-4">
                Work with confidence. Get paid on time, every time.
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                Stop chasing clients for invoices. When funds are locked in Artifix Escrow before you purchase materials or begin work, payment is guaranteed the moment you deliver.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium mb-8">
                <li className="flex items-center gap-2.5">
                  <CertifiedBadgeHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Digital Artisan Trade Passport with verifiable seal</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheckHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Guaranteed milestone funds before project start</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <InstantSettlementHugeIcon className="w-4 h-4 text-[#BD5324] shrink-0" />
                  <span>Direct payout to your Nigerian bank account or Monad wallet</span>
                </li>
              </ul>
            </div>

            <div>
              <button
                type="button"
                onClick={() => scrollToWaitlist('artisan')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#BD5324] hover:bg-[#A64319] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                <span>Join Waitlist as Artisan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>


      {/* ============================================================ */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ)                          */}
      {/* ============================================================ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-stone-300/60 dark:border-stone-800 bg-[#F5EFEB]/50 dark:bg-stone-900/30">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-14">
            <div className="text-xs font-mono uppercase tracking-widest text-[#BD5324] font-bold mb-2">
              Clarifications
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does the milestone escrow protect my money as a client?',
                a: 'When you fund a job, your money is held in neutral custody (via Paystack escrow vault or Monad smart contract). The artisan cannot withdraw the funds until you review the submitted Proof of Work photos and approve that specific milestone. If work is substandard, funds remain safe.',
              },
              {
                q: 'How do artisans know they will actually get paid?',
                a: 'Before you start work on any milestone, Artifix verifies that the client has deposited 100% of the milestone value into escrow. The client cannot unilaterally cancel or withdraw the funds without your agreement or an approved dispute resolution.',
              },
              {
                q: 'What is the Monad Testnet integration?',
                a: 'Artifix is deployed on Monad Testnet (Chain ID 10143). Users can choose to settle contracts in $MON crypto tokens with lightning-fast finality and minimal gas fees, or use standard Nigerian Naira (NGN) via Paystack cards and bank transfers.',
              },
              {
                q: 'How does the Artisan Trade Passport verification work?',
                a: 'Artisans submit their National Identity Number (NIN), phone number, proof of previous installations, and undergo technical vetting. Once approved, an official cryptographic passport with a QR code and verified seal is generated.',
              },
              {
                q: 'What happens if there is a dispute on a project?',
                a: 'Either party can trigger the Dispute Center. An assigned Artifix inspector reviews the job contract specifications, communication log, and Before/After photographic evidence to enforce a fair release or partial refund within 48 hours.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="paper-card rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-stone-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                      activeFaq === idx ? 'transform rotate-180 text-[#BD5324]' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ============================================================ */}
      {/* 8. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-stone-300/80 dark:border-stone-800 bg-[#F5EFEB] dark:bg-[#0E1310] text-stone-600 dark:text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <img
                src="/brand/artifix-icon-transparent.png"
                alt="Artifix"
                className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-black text-stone-900 dark:text-white">Artifix</span>
            </Link>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              The verified artisan trust network. Milestone escrow, proof-of-work, and transparent settlements for modern infrastructure.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Monad Testnet 10143</span>
            </div>
          </div>

          <div>
            <div className="font-mono uppercase tracking-widest text-stone-900 dark:text-white font-bold text-[11px] mb-3">
              Platform
            </div>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-stone-900 dark:hover:text-white">How It Works</a></li>
              <li><a href="#trades" className="hover:text-stone-900 dark:hover:text-white">Trades Directory</a></li>
              <li><a href="#trust" className="hover:text-stone-900 dark:hover:text-white">The Trust Layer</a></li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToWaitlist('client')}
                  className="text-left hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  Client Early Access
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToWaitlist('artisan')}
                  className="text-left hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  Artisan Priority Waitlist
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-mono uppercase tracking-widest text-stone-900 dark:text-white font-bold text-[11px] mb-3">
              Security &amp; Web3
            </div>
            <ul className="space-y-2 font-mono text-[11px]">
              <li><span className="text-stone-500">Chain ID: 10143</span></li>
              <li><span className="text-stone-500">Monad Testnet Escrow</span></li>
              <li><span className="text-stone-500">Paystack NGN Gateway</span></li>
              <li><span className="text-stone-500">NIN Identity Verification</span></li>
              <li><a href="#trust" className="hover:text-stone-900 dark:hover:text-white">Dispute Arbitration</a></li>
            </ul>
          </div>

          <div>
            <div className="font-mono uppercase tracking-widest text-stone-900 dark:text-white font-bold text-[11px] mb-3">
              Early Access &amp; Network
            </div>
            <ul className="space-y-2 font-mono text-[11px]">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToWaitlist()}
                  className="text-left text-[#BD5324] font-bold hover:underline transition-colors"
                >
                  Join Priority Waitlist ↑
                </button>
              </li>
              <li>
                <span className="text-stone-500">Early Access Wave 1 (Q2 2026)</span>
              </li>
              <li>
                <span className="text-stone-500">Lagos • Abuja • Port Harcourt</span>
              </li>
              <li>
                <span className="text-stone-500">Verified Contractor Whitelist</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-stone-300/60 dark:border-stone-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-stone-500">
          <div>
            &copy; {new Date().getFullYear()} Artifix Network. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer">Security Audits</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
