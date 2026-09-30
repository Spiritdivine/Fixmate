import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ArrowLeft,
  Search,
  Wrench,
  ShieldCheck,
  Briefcase,
  Users,
  HelpCircle,
  ArrowRight,
  Sun,
  Moon,
  Compass,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { ArtisanDoodles } from '../components/ui/ArtisanDoodles';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

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

  const dashboardRoute =
    user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : user?.role === 'CLIENT'
      ? '/client/dashboard'
      : user?.role === 'ARTISAN'
      ? '/artisan/dashboard'
      : '/';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div
      className={`min-h-screen font-sans selection:bg-amber-200 selection:text-stone-900 ${
        isDarkMode ? 'dark bg-[#0E1310] text-stone-100' : 'bg-[#F5EFEB] text-stone-900'
      } overflow-x-clip transition-colors duration-200 flex flex-col justify-between`}
    >
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION (Matching Visitor Homepage Pattern)        */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-300/80 dark:border-stone-800 bg-[#F5EFEB]/90 dark:bg-[#0E1310]/90 backdrop-blur-md">
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
            {user ? (
              <Link to={dashboardRoute}>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#123E2A] hover:bg-[#0e3222] text-white text-xs sm:text-sm font-bold tracking-tight shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>My Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition px-2 py-1"
                >
                  Sign In
                </Link>
                <Link to="/register">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#BD5324] hover:bg-[#A64319] text-white text-xs sm:text-sm font-bold tracking-tight shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </>
            )}

            {/* Light/Dark Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full border border-stone-300/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-800" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MAIN 404 HERO CONTENT WITH ARTISAN DOODLES                */}
      {/* ============================================================ */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 overflow-hidden">
        {/* Subtle Decorative Doodles Background */}
        <ArtisanDoodles />

        <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
          {/* Title Typography: Script "Oops, off the" + Bold "404" */}
          <div className="relative mb-3">
            <div className="flex items-center justify-center gap-2 font-caveat text-3xl sm:text-4xl md:text-5xl text-[#1C1917] dark:text-stone-100 font-bold -rotate-1 select-none">
              <span>Oops, off the</span>
              {/* Dynamic Motion Flare Dashes */}
              <svg
                className="w-7 h-7 text-[#BD5324] -mt-2 shrink-0"
                viewBox="0 0 32 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M4 14L10 8" />
                <path d="M12 18L18 12" />
                <path d="M10 26L20 22" />
              </svg>
            </div>

            <div className="relative inline-block mt-1">
              <h1 className="text-7xl sm:text-8xl md:text-9xl font-black uppercase tracking-tight text-[#00A86B] dark:text-[#10B981] -rotate-1 drop-shadow-sm font-sans leading-none select-none">
                404
              </h1>
              {/* Dynamic Green Brush Underline */}
              <svg
                className="w-full h-4 sm:h-5 text-[#00A86B] dark:text-[#10B981] -mt-1 sm:-mt-2"
                viewBox="0 0 260 20"
                fill="currentColor"
                preserveAspectRatio="none"
              >
                <path d="M5 14 Q 70 4, 130 11 T 255 8 Q 180 18, 100 13 T 5 14 Z" />
              </svg>
            </div>
          </div>

          {/* Subheading Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-stone-900/90 border border-stone-300/80 dark:border-stone-800 shadow-sm backdrop-blur-md mb-4">
            <Compass className="w-3.5 h-3.5 text-[#BD5324] animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Job Site Blueprint Missing
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mb-3">
            This Blueprint Doesn't Exist on the Network
          </h2>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-xl mx-auto mb-8 leading-relaxed">
            The artisan workshop, job contract, or deliverable page you navigated to might have been concluded, moved to another site, or never existed in the escrow registry.
          </p>

          {/* Search Input Bar */}
          <form onSubmit={handleSearch} className="w-full max-w-lg mb-8 relative">
            <div className="relative flex items-center shadow-sm rounded-full bg-white dark:bg-stone-900 border border-stone-300/80 dark:border-stone-700/80 focus-within:ring-2 focus-within:ring-[#00A86B] transition-all">
              <Search className="w-4 h-4 absolute left-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search trades (e.g. Solar Installer, Plumber, Lekki)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-28 py-3 rounded-full bg-transparent text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 sm:px-5 py-2 rounded-full bg-[#BD5324] hover:bg-[#A64319] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-stone-300/80 dark:border-stone-700/80 bg-white/80 dark:bg-stone-900/80 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs sm:text-sm font-bold tracking-tight shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
            <Link to={dashboardRoute}>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00A86B] hover:bg-[#00915c] text-white text-xs sm:text-sm font-bold tracking-tight shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>{user ? 'Return to Dashboard' : 'Return to Home'}</span>
              </button>
            </Link>
          </div>

          {/* Direct Access Portals */}
          <div className="w-full pt-8 border-t border-stone-300/80 dark:border-stone-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-4">
              Explore Active Network Portals
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
              <Link
                to="/artisans"
                className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-300/80 dark:border-stone-800 hover:border-[#00A86B]/50 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00A86B] dark:text-[#10B981] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#00A86B] dark:group-hover:text-[#10B981] transition">
                  Verified Artisans
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Browse vetted trade pros across Nigeria
                </div>
              </Link>

              <Link
                to="/jobs"
                className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-300/80 dark:border-stone-800 hover:border-[#00A86B]/50 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00A86B] dark:text-[#10B981] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#00A86B] dark:group-hover:text-[#10B981] transition">
                  Jobs Marketplace
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Explore funded client requests & milestones
                </div>
              </Link>

              <Link
                to="/security"
                className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-300/80 dark:border-stone-800 hover:border-[#00A86B]/50 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00A86B] dark:text-[#10B981] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#00A86B] dark:group-hover:text-[#10B981] transition">
                  Smart Escrow
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Learn about zero-dispute milestone safety
                </div>
              </Link>

              <Link
                to="/help"
                className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-300/80 dark:border-stone-800 hover:border-[#00A86B]/50 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00A86B] dark:text-[#10B981] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="font-extrabold text-sm text-stone-900 dark:text-stone-100 group-hover:text-[#00A86B] dark:group-hover:text-[#10B981] transition">
                  Support & Help
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Artisan guides & dispute resolution
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 3. FOOTER (Matching Visitor Homepage Pattern)                */}
      {/* ============================================================ */}
      <footer className="w-full border-t border-stone-300/80 dark:border-stone-800/80 py-6 px-4 sm:px-6 lg:px-8 bg-transparent">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 dark:text-stone-200">Artifix</span>
            <span>• The Verified Artisan Trust Network</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/artisans" className="hover:text-stone-900 dark:hover:text-stone-200 transition">
              Artisans
            </Link>
            <Link to="/jobs" className="hover:text-stone-900 dark:hover:text-stone-200 transition">
              Jobs Market
            </Link>
            <Link to="/security" className="hover:text-stone-900 dark:hover:text-stone-200 transition">
              Smart Escrow
            </Link>
            <Link to="/" className="text-[#BD5324] hover:underline font-bold">
              Homepage &rarr;
            </Link>
          </div>
          <div>&copy; {new Date().getFullYear()} Artifix Network. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default NotFoundPage;
