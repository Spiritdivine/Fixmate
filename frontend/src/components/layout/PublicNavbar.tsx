import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { trackEvent } from '../../lib/posthog';

export const PublicNavbar: React.FC = () => {
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAboutExpanded, setMobileAboutExpanded] = useState(false);

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  // Auto-close open dropdown and mobile menu on route change
  useEffect(() => {
    setAboutDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Handle outside clicks to close desktop dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setAboutDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Close on Escape key press and prevent background scroll when mobile drawer is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAboutDropdownOpen(false);
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

  // Hover intent helpers with safe delay buffer
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setAboutDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setAboutDropdownOpen(false);
    }, 180);
  };

  const isAboutActive =
    aboutDropdownOpen ||
    location.pathname.startsWith('/about') ||
    location.pathname.startsWith('/guarantee') ||
    location.pathname.startsWith('/pricing') ||
    location.pathname.startsWith('/privacy') ||
    location.pathname.startsWith('/terms') ||
    location.pathname.startsWith('/security');

  const aboutSubItems = [
    {
      label: 'About',
      path: '/about',
      desc: 'Our company story, mission, and physical hubs in Lekki and Abuja.',
    },
    {
      label: 'Guarantee',
      path: '/guarantee',
      desc: 'Deliverable warranty, 48-hour cure window & 3-tier arbitration tribunal.',
    },
    {
      label: 'Pricing & fees',
      path: '/pricing',
      desc: 'Flat 5% escrow fee, zero upfront paywalls & live fee calculator.',
    },
    {
      label: 'Privacy policy',
      path: '/privacy',
      desc: 'Zero raw BVN storage, cryptographic privacy & NDPA 2023 compliance.',
    },
    {
      label: 'Terms of services',
      path: '/terms',
      desc: 'Milestone release rules, 14-day defect warranty & platform conditions.',
    },
    {
      label: 'Smart contract audit',
      path: '/security',
      desc: '0 critical vulnerabilities, audited Monad EVM bytecode & bug bounty.',
    },
  ];

  return (
    <>
      {/* ============================================================ */}
      {/* 1. TOP HEADER / NAVIGATION                                  */}
      {/* ============================================================ */}
      <header
        ref={navContainerRef}
        className="w-full relative z-40 bg-[#FAF7F0]/95 backdrop-blur-md sticky top-0 border-b border-stone-200/50"
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-4 pb-3 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Left Brand Logo */}
          <Link
            to="/v2"
            className="flex items-center group select-none shrink-0"
            aria-label="Artifix Home"
          >
            <img
              src="/brand/logo1.png"
              alt="Artifix"
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>

          {/* Center Navigation Links (Visible on tablet & desktop >= md) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs lg:text-[13px] font-medium text-stone-600">
            
            {/* 1. Find Artisans */}
            <Link
              to="/artisans"
              className={`py-1.5 transition-colors font-medium ${
                location.pathname.startsWith('/artisans')
                  ? 'text-[#141A16] font-semibold'
                  : 'hover:text-[#141A16]'
              }`}
            >
              Find Artisans
            </Link>

            {/* 2. Jobs Board */}
            <Link
              to="/jobs"
              className={`py-1.5 transition-colors font-medium ${
                location.pathname.startsWith('/jobs')
                  ? 'text-[#141A16] font-semibold'
                  : 'hover:text-[#141A16]'
              }`}
            >
              Jobs Board
            </Link>

            {/* 3. About (The Only Dropdown) */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setAboutDropdownOpen((prev) => !prev)}
                aria-expanded={aboutDropdownOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 py-1.5 transition-colors font-medium cursor-pointer ${
                  isAboutActive
                    ? 'text-[#141A16] font-semibold'
                    : 'hover:text-[#141A16]'
                }`}
              >
                <span>About</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    aboutDropdownOpen ? 'rotate-180 text-[#123E2A]' : 'text-stone-400'
                  }`}
                />
              </button>

              {/* Desktop Dropdown Panel: About & Trust */}
              {aboutDropdownOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[420px] bg-[#FAF7F0] border border-stone-200/90 rounded-2xl shadow-2xl shadow-stone-900/10 p-2.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 z-50"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {aboutSubItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="group block px-3 py-2.5 rounded-xl hover:bg-stone-200/50 transition-colors"
                    >
                      <div className="text-xs font-bold text-[#141A16] group-hover:text-[#123E2A] transition-colors flex items-center justify-between">
                        <span>{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-stone-400" />
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug mt-0.5 font-normal line-clamp-1">
                        {item.desc}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Contact */}
            <Link
              to="/contact"
              className={`py-1.5 transition-colors font-medium ${
                location.pathname.startsWith('/contact')
                  ? 'text-[#141A16] font-semibold'
                  : 'hover:text-[#141A16]'
              }`}
            >
              Contact
            </Link>

          </nav>

          {/* Right Action Controls: Log In & Get Started Button */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5 shrink-0">
            <Link
              to="/login"
              onClick={() => trackEvent('landing_v2_auth_clicked', { target: 'login', location: 'header' })}
              className="text-xs lg:text-[13px] font-semibold text-[#141A16] hover:text-stone-600 transition-colors whitespace-nowrap"
            >
              Log In
            </Link>
            <Link
              to="/register"
              onClick={() => trackEvent('landing_v2_cta_clicked', { target: 'get_started', location: 'header' })}
              className="inline-flex items-center gap-1.5 bg-[#123E2A] text-white text-xs lg:text-[13px] font-semibold px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl hover:bg-[#0E3222] transition-all shadow-sm active:scale-95 whitespace-nowrap"
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
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#141A16] hover:bg-stone-200/60 active:scale-95 transition-all"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MOBILE SLIDE-OVER DRAWER (< md)                           */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-full max-w-[340px] bg-[#FAF7F0] h-full shadow-2xl z-10 p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250">
            
            {/* Top Bar: Brand & Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200/80">
              <Link
                to="/v2"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center"
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

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-2 pt-3 text-sm font-semibold text-stone-700">
              
              {/* 1. Find Artisans */}
              <Link
                to="/artisans"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200/80 bg-white/60 hover:bg-stone-100/60 transition-colors font-bold text-[#141A16]"
              >
                <span>Find Artisans</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              {/* 2. Jobs Board */}
              <Link
                to="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200/80 bg-white/60 hover:bg-stone-100/60 transition-colors font-bold text-[#141A16]"
              >
                <span>Jobs Board</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

              {/* 3. About (The Only Dropdown / Accordion) */}
              <div className="border border-stone-200/80 rounded-xl overflow-hidden bg-white/60">
                <button
                  type="button"
                  onClick={() => setMobileAboutExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left font-bold text-[#141A16] hover:bg-stone-100/60 transition-colors"
                >
                  <span>About</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileAboutExpanded ? 'rotate-180 text-[#123E2A]' : 'text-stone-400'
                    }`}
                  />
                </button>

                {mobileAboutExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-stone-100 space-y-1 bg-stone-50/60">
                    {aboutSubItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between py-2 px-2.5 rounded-lg text-xs font-medium text-stone-700 hover:text-[#123E2A] hover:bg-stone-200/50 transition-colors"
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Contact */}
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-stone-200/80 bg-white/60 hover:bg-stone-100/60 transition-colors font-bold text-[#141A16]"
              >
                <span>Contact</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>

            </nav>

            {/* Auth Buttons: Log In & Get Started Button */}
            <div className="flex flex-col gap-3 pt-4 border-t border-stone-200/70">
              <Link
                to="/login"
                onClick={() => {
                  trackEvent('landing_v2_auth_clicked', { target: 'login', location: 'mobile_drawer' });
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-3 text-sm font-bold text-[#141A16] border border-stone-300 rounded-xl hover:bg-stone-200/40 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => {
                  trackEvent('landing_v2_cta_clicked', { target: 'get_started', location: 'mobile_drawer' });
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-3 text-sm font-bold text-white bg-[#123E2A] rounded-xl hover:bg-[#0E3222] shadow-md transition-all active:scale-98"
              >
                Get Started →
              </Link>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default PublicNavbar;
