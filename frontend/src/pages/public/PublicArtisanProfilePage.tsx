import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Share2,
  Calendar,
  Layers,
  ChevronLeft,
  X,
  ExternalLink,
  Award,
  
  ArrowRight,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Sliders,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { ArtisanProfile, Review, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Avatar } from '../../components/ui/Avatar';
import { AuthIntentModal } from '../../components/public/AuthIntentModal';
import { ShareProfileModal } from '../../components/public/ShareProfileModal';
import { BeforeAfterSlider } from '../../components/public/BeforeAfterSlider';
import { trackEvent } from '../../lib/posthog';
import { SeoHead } from '../../components/seo/SeoHead';

export const PublicArtisanProfilePage: React.FC = () => {
  const { artisanId, id } = useParams<{ artisanId?: string; id?: string }>();
  const effectiveId = artisanId || id;

  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'services' | 'reviews'>('overview');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // 1. Fetch Artisan Profile
  const {
    data: artisan,
    isLoading: isArtisanLoading,
    isError: isArtisanError,
    refetch: refetchArtisan,
  } = useQuery<ArtisanProfile>({
    queryKey: ['public-artisan-profile', effectiveId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ArtisanProfile | { artisan: ArtisanProfile }>>(
        `/profiles/artisans/${effectiveId}`
      );
      const res = (data.data as any)?.id ? (data.data as ArtisanProfile) : (data.data as any)?.artisan;
      return res;
    },
    enabled: !!effectiveId,
  });

  // 2. Fetch Artisan Reviews
  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery<Review[]>({
    queryKey: ['public-artisan-reviews', artisan?.userId],
    queryFn: async () => {
      if (!artisan?.userId) return [];
      const { data } = await apiClient.get<ApiResponse<Review[] | { reviews: Review[] }>>(
        `/reviews/artisan/${artisan.userId}`
      );
      const list = Array.isArray(data.data) ? data.data : (data.data as any)?.reviews;
      return list || [];
    },
    enabled: !!artisan?.userId,
  });

  // Dynamic Document Title for SEO & Shareability
  useEffect(() => {
    if (artisan) {
      const name = artisan.businessName || artisan.user?.email?.split('@')[0] || 'Artisan';
      const trade = artisan.skills?.[0]?.skill?.name || 'Artisan';
      document.title = `${name} – Verified ${trade} in ${artisan.state} | Artifix`;
    }
  }, [artisan]);

  // Handle escape to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    if (lightboxImage) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxImage]);

  if (isArtisanLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="w-9 h-9 text-[#123E2A] animate-spin" />
        <p className="text-sm font-semibold text-stone-500">
          Loading verified artisan profile...
        </p>
      </div>
    );
  }

  if (isArtisanError || !artisan) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-white rounded-3xl border border-stone-200 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#141A16] mb-2">
          Artisan Profile Not Found
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          The requested artisan profile may have moved or is temporarily unavailable.
        </p>
        <Link
          to="/artisans"
          className="bg-[#123E2A] hover:bg-[#0E3222] text-white text-xs font-semibold px-6 py-3 rounded-full transition-colors inline-block"
        >
          Browse All Verified Artisans
        </Link>
      </div>
    );
  }

  const ratingVal =
    typeof artisan.ratingAvg === 'number'
      ? artisan.ratingAvg
      : parseFloat(String(artisan.ratingAvg || '5.0'));

  const primaryTrade =
    artisan.skills?.[0]?.skill?.category?.name ||
    artisan.skills?.[0]?.skill?.name ||
    'Certified Tradesman';

  const shareUrl = `${window.location.origin}/p/${artisan.id}`;
  const artisanName = artisan.businessName || artisan.user?.email?.split('@')[0] || 'Verified Artisan';
  const locationName = [artisan.lgaCity, artisan.state || 'Nigeria'].filter(Boolean).join(', ');
  const seoTitle = `${artisanName} – Verified ${primaryTrade} in ${locationName} | Artifix`;
  const seoDesc = `Hire ${artisanName}, verified ${primaryTrade} in ${locationName}. Rated ★ ${ratingVal.toFixed(1)} (${reviews.length} reviews) with ${artisan.completedJobsCount || 0} completed projects. 100% Escrow Protected on Artifix.`;
  const ogImageUrl = `/api/v1/og/artisan/${artisan.id}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: artisanName,
    image: artisan.user?.avatarUrl || undefined,
    description: seoDesc,
    address: {
      '@type': 'PostalAddress',
      addressLocality: artisan.lgaCity || 'Lagos',
      addressRegion: artisan.state || 'Lagos',
      addressCountry: 'NG',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(ratingVal.toFixed(1)),
      reviewCount: Math.max(1, reviews.length),
    },
  };

  // Portfolio items with media
  const validPortfolios = (artisan.portfolios || []).filter((p) => p.mediaUrls && p.mediaUrls.length > 0);

  // Before & After images candidates (if first portfolio has >= 2 images)
  const hasBeforeAfter = validPortfolios.length > 0 && validPortfolios[0].mediaUrls.length >= 2;
  const beforeImageUrl = hasBeforeAfter ? validPortfolios[0].mediaUrls[0] : null;
  const afterImageUrl = hasBeforeAfter ? validPortfolios[0].mediaUrls[1] : null;

  return (
    <div className="w-full pb-28">
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        canonical={shareUrl}
        ogType="profile"
        ogImage={ogImageUrl}
        ogImageAlt={`${artisanName} - Verified ${primaryTrade}`}
        twitterCard="summary_large_image"
        jsonLd={jsonLd}
      />
      
      {/* ============================================================ */}
      {/* 1. TOP COVER & PROFILE HERO SECTION                          */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/70 pt-6 sm:pt-10 pb-8 sm:pb-12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb & Top Actions */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              to="/artisans"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#123E2A] transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Directory</span>
            </Link>

            {/* Share Profile Action Button */}
            <button
              type="button"
              onClick={() => {
                setIsShareModalOpen(true);
                trackEvent('artisan_share_clicked', { artisan_id: artisan.id });
              }}
              className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 text-[#141A16] border border-stone-200 text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-sm active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-[#123E2A]" />
              <span>Share Profile</span>
            </button>
          </div>

          {/* Profile Identity Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-stone-200/70 relative overflow-hidden">
            
            {/* Background Decorative Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#123E2A] via-[#108A00] to-emerald-400" />

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 sm:gap-8">
              
              {/* Left Identity: Avatar + Names + Badges */}
              <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6 min-w-0 flex-1">
                
                {/* Large Avatar */}
                <div className="relative shrink-0">
                  <Avatar
                    src={artisan.user?.avatarUrl || undefined}
                    name={artisan.businessName || artisan.user?.email || 'Artisan'}
                    size="xl"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-[#FAF7F0] shadow-md object-cover"
                  />
                  {artisan.user?.isKycVerified && (
                    <div
                      title="NIN / BVN Identity Verified"
                      className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-[#108A00] text-white flex items-center justify-center shadow-md ring-2 ring-white"
                    >
                      <CheckCircle2 className="w-5 h-5 fill-current" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  
                  {/* Category Pill & Availability */}
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span className="bg-[#FAF7F0] text-[#123E2A] text-xs font-bold px-3 py-1 rounded-md border border-stone-200/60 uppercase tracking-wide">
                      {primaryTrade}
                    </span>

                    {artisan.isAvailable ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200/60">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Available for Booking
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-stone-100 text-stone-500 text-xs font-medium px-3 py-1 rounded-full">
                        Currently Engaged
                      </span>
                    )}
                  </div>

                  {/* Business Name */}
                  <h1
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#141A16] tracking-tight mb-2 leading-tight"
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    {artisan.businessName || 'Verified Artisan'}
                  </h1>

                  {/* Tagline */}
                  <p className="text-sm sm:text-base text-[#556259] leading-relaxed mb-4 font-normal max-w-2xl">
                    {artisan.tagline || 'Specialist craftsman offering certified milestone installations and repairs.'}
                  </p>

                  {/* Location & Experience Meta */}
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-stone-600 font-medium flex-wrap">
                    <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
                      <MapPin className="w-4 h-4 text-[#123E2A] shrink-0" />
                      <span>{artisan.lgaCity || 'Lagos'}, {artisan.state}</span>
                    </div>

                    <span className="text-stone-300">•</span>

                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#123E2A] shrink-0" />
                      <span>{artisan.yearsOfExperience || 5}+ Years Field Experience</span>
                    </div>

                    <span className="text-stone-300">•</span>

                    <div className="flex items-center gap-1.5 text-[#108A00] font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Monad Escrow Tested</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right CTA Box (Desktop) */}
              <div className="shrink-0 flex flex-col items-start md:items-end gap-2.5 pt-2 border-t md:border-t-0 border-stone-100">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Typical Daily Rate
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#141A16]">
                  {artisan.hourlyRate ? `₦${Number(artisan.hourlyRate).toLocaleString()}` : 'From ₦15,000'}
                  <span className="text-xs font-normal text-stone-500"> /day</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#123E2A] hover:bg-[#0E3222] text-white font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full transition-all shadow-md active:scale-95"
                >
                  <span>Request Quote / Hire</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* 4-Card Trust Metrics Strip */}
            <div className="mt-8 pt-7 border-t border-stone-100 grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-[#FAF7F0] p-4 rounded-2xl">
                <div className="flex items-center gap-1 text-amber-500 font-extrabold text-xl sm:text-2xl mb-0.5">
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <span>{ratingVal.toFixed(1)}</span>
                </div>
                <span className="text-xs text-stone-600 font-medium">
                  {artisan.reviewCount || 0} Verified Reviews
                </span>
              </div>

              <div className="bg-[#FAF7F0] p-4 rounded-2xl">
                <div className="text-xl sm:text-2xl font-extrabold text-[#141A16] mb-0.5">
                  {artisan.completedJobsCount || 0}
                </div>
                <span className="text-xs text-stone-600 font-medium">
                  Completed Projects
                </span>
              </div>

              <div className="bg-[#FAF7F0] p-4 rounded-2xl">
                <div className="text-xl sm:text-2xl font-extrabold text-[#108A00] mb-0.5">
                  100%
                </div>
                <span className="text-xs text-stone-600 font-medium">
                  Milestone Release Rate
                </span>
              </div>

              <div className="bg-[#FAF7F0] p-4 rounded-2xl">
                <div className="text-xl sm:text-2xl font-extrabold text-[#141A16] mb-0.5">
                  0%
                </div>
                <span className="text-xs text-stone-600 font-medium">
                  Dispute History
                </span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. TABBED CONTENT & STICKY ACTION RAIL                       */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-stone-200/80 pb-3 mb-8 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#123E2A] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#141A16] hover:bg-white'
            }`}
          >
            Overview &amp; Background
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'portfolio'
                ? 'bg-[#123E2A] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#141A16] hover:bg-white'
            }`}
          >
            <span>Proof of Work Gallery</span>
            <span className="text-[11px] bg-white/20 px-1.5 py-0.2 rounded-full">
              {validPortfolios.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'bg-[#123E2A] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#141A16] hover:bg-white'
            }`}
          >
            <span>Services &amp; Rates</span>
            <span className="text-[11px] bg-white/20 px-1.5 py-0.2 rounded-full">
              {artisan.services?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-[#123E2A] text-white shadow-sm'
                : 'text-stone-600 hover:text-[#141A16] hover:bg-white'
            }`}
          >
            <span>Client Reviews</span>
            <span className="text-[11px] bg-white/20 px-1.5 py-0.2 rounded-full">
              {reviews.length}
            </span>
          </button>
        </div>

        {/* 2-Column Split: Content (8 Cols) vs Sticky Rail (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ======================================================== */}
          {/* LEFT 8 COLS: TAB PANELS                                  */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ---------------------------------------------------- */}
            {/* TAB 1: OVERVIEW & BACKGROUND                         */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Bio & Craftsmanship Story */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
                  <h3
                    className="text-lg sm:text-xl font-bold text-[#141A16] mb-3"
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    Craftsmanship &amp; Biography
                  </h3>
                  <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed font-normal whitespace-pre-line mb-6">
                    {artisan.bio ||
                      `${artisan.businessName || 'This artisan'} is a vetted professional specializing in high-quality ${primaryTrade} for residential complexes and commercial properties across Nigeria. Backed by verified client reviews and strict compliance with the Artifix escrow framework.`}
                  </p>

                  {/* Skills Pills */}
                  {artisan.skills && artisan.skills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2.5">
                        Verified Skills &amp; Specialties
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {artisan.skills.map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-[#FAF7F0] text-[#141A16] text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200/60"
                          >
                            {item.skill?.name || 'Skill'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Service Areas & Coverage */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
                  <h3
                    className="text-lg sm:text-xl font-bold text-[#141A16] mb-3"
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    Service Location &amp; Workshop
                  </h3>
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#123E2A]/10 text-[#123E2A] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-[#141A16]">
                        {artisan.address || `${artisan.lgaCity}, ${artisan.state}`}
                      </span>
                      <p className="text-xs text-stone-500">
                        Available for on-site call-outs and contract engagements across {artisan.state} and neighboring regions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Escrow Guarantee Highlight */}
                <div className="bg-[#123E2A] rounded-3xl p-6 sm:p-8 text-white">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>How Escrow Protects You</span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Zero financial risk with Monad smart contract escrow
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-normal mb-4">
                    When you hire through Artifix, your funds are deposited into an on-chain escrow contract. The artisan begins work immediately, but payment is only disbursed once milestones are completed to your full satisfaction.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-white text-[#123E2A] hover:bg-stone-100 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Hire with Escrow Protection</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 2: PROOF OF WORK & BEFORE/AFTER                  */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                
                {/* Interactive Before & After Slider (If Available) */}
                {hasBeforeAfter && beforeImageUrl && afterImageUrl && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#141A16]">
                          Featured Transformation
                        </h3>
                        <p className="text-xs text-stone-500">
                          {validPortfolios[0].title || 'Before and after comparison of completed job'}
                        </p>
                      </div>
                      <span className="bg-[#108A00]/10 text-[#108A00] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Verified Proof
                      </span>
                    </div>

                    <BeforeAfterSlider
                      beforeImage={beforeImageUrl}
                      afterImage={afterImageUrl}
                      beforeLabel="Initial State"
                      afterLabel="Completed Work"
                      title={validPortfolios[0].title}
                    />
                  </div>
                )}

                {/* Portfolio Project Cards Grid */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
                  <h3
                    className="text-lg sm:text-xl font-bold text-[#141A16] mb-4"
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    Completed Projects Gallery ({validPortfolios.length})
                  </h3>

                  {validPortfolios.length === 0 ? (
                    <div className="py-12 text-center text-stone-500">
                      <Layers className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                      <p className="text-sm">No photo portfolio items added yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {validPortfolios.map((item) => (
                        <div
                          key={item.id}
                          className="group border border-stone-200 rounded-2xl overflow-hidden bg-[#FAF7F0] flex flex-col justify-between"
                        >
                          {/* Image Thumbnail with Lightbox Click */}
                          <div
                            className="aspect-[16/10] overflow-hidden relative cursor-pointer"
                            onClick={() => setLightboxImage(item.mediaUrls[0])}
                          >
                            <img
                              src={item.mediaUrls[0]}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-6 h-6" />
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-[#141A16] mb-1">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {item.completionDate && (
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium pt-2 border-t border-stone-200/60 mt-auto">
                                <Calendar className="w-3 h-3" />
                                <span>Completed {formatDate(item.completionDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 3: SERVICES & TRANSPARENT RATES                  */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'services' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
                <div className="mb-6">
                  <h3
                    className="text-lg sm:text-xl font-bold text-[#141A16] mb-1"
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    Services &amp; Standard Rates
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500">
                    Transparent benchmark pricing in Nigerian Naira. Custom scopes can also be requested.
                  </p>
                </div>

                {(!artisan.services || artisan.services.length === 0) ? (
                  <div className="py-12 text-center text-stone-500">
                    <Sliders className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <p className="text-sm">No custom service catalog packages published yet.</p>
                    <p className="text-xs text-stone-400 mt-1">
                      You can request a direct quote for any bespoke project.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {artisan.services.map((service) => (
                      <div
                        key={service.id}
                        className="bg-[#FAF7F0] rounded-2xl p-5 border border-stone-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold text-[#141A16] mb-1">
                            {service.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-3">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                            <Clock className="w-3.5 h-3.5 text-[#123E2A]" />
                            <span>Estimated Turnaround: {service.deliveryDays} {service.deliveryDays === 1 ? 'day' : 'days'}</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-200/60">
                          <div className="text-right">
                            <span className="block text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                              Service Estimate
                            </span>
                            <span className="text-lg sm:text-xl font-extrabold text-[#123E2A]">
                              ₦{Number(service.price).toLocaleString()}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsAuthModalOpen(true)}
                            className="bg-[#123E2A] hover:bg-[#0E3222] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-sm active:scale-95"
                          >
                            Select &amp; Hire
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 4: CLIENT REVIEWS & TESTIMONIALS                 */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
                
                {/* Rating Overview Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-200/70 mb-6">
                  <div>
                    <h3
                      className="text-lg sm:text-xl font-bold text-[#141A16] mb-1"
                      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                    >
                      Customer Reviews &amp; Testimonials
                    </h3>
                    <p className="text-xs text-stone-500">
                      Authentic ratings from verified client escrow milestones
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-extrabold text-[#141A16]">
                      {ratingVal.toFixed(1)}
                    </span>
                    <div>
                      <div className="flex items-center gap-0.5 text-amber-500 mb-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(ratingVal) ? 'fill-amber-400 text-amber-500' : 'text-stone-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-stone-500 font-medium">
                        Based on {reviews.length} reviews
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                {isReviewsLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-12 text-center text-stone-500">
                    <Star className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No reviews recorded yet.</p>
                    <p className="text-xs text-stone-400 mt-1">
                      Be the first client to book and review this artisan!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-5 rounded-2xl bg-[#FAF7F0] border border-stone-200/60 text-left"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={rev.reviewer?.avatarUrl || undefined}
                              name={rev.reviewer?.clientProfile?.firstName || 'Client'}
                              size="sm"
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <span className="block text-xs font-bold text-[#141A16]">
                                {rev.reviewer?.clientProfile?.firstName
                                  ? `${rev.reviewer.clientProfile.firstName} ${rev.reviewer.clientProfile.lastName?.[0] || ''}.`
                                  : 'Verified Client'}
                              </span>
                              <span className="block text-[10px] text-stone-400">
                                {formatDate(rev.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rev.overallRating ? 'fill-amber-400 text-amber-500' : 'text-stone-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                          "{rev.comment}"
                        </p>

                        {/* Artisan Reply if exists */}
                        {rev.artisanReply && (
                          <div className="mt-3 pl-3.5 border-l-2 border-[#123E2A] text-xs text-stone-600 bg-white/70 p-2.5 rounded-r-lg">
                            <span className="block font-bold text-[#123E2A] mb-0.5">
                              {artisan.businessName || 'Artisan'} Response:
                            </span>
                            <p className="font-normal">{rev.artisanReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>

          {/* ======================================================== */}
          {/* RIGHT 4 COLS: STICKY BOOKING RAIL (Desktop)              */}
          {/* ======================================================== */}
          <aside className="lg:col-span-4 sticky top-24 space-y-6">
            
            {/* Booking Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-md">
              <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                Hire Verified Specialist
              </span>
              
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-extrabold text-[#141A16]">
                  {artisan.hourlyRate ? `₦${Number(artisan.hourlyRate).toLocaleString()}` : 'From ₦15,000'}
                </span>
                <span className="text-xs text-stone-500 font-medium">/ estimated day</span>
              </div>

              {/* Booking CTAs */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full bg-[#123E2A] hover:bg-[#0E3222] text-white font-bold text-sm py-3.5 px-6 rounded-full transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Request Quote / Hire</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-[#141A16] font-semibold text-xs py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-[#123E2A]" />
                  <span>Share via WhatsApp / Social</span>
                </button>
              </div>

              {/* Guarantees Checklist */}
              <div className="space-y-2.5 pt-5 border-t border-stone-100">
                <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                  <Check className="w-4 h-4 text-[#108A00] shrink-0" />
                  <span>Funds held in smart escrow</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                  <Check className="w-4 h-4 text-[#108A00] shrink-0" />
                  <span>Release payment only after inspection</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                  <Check className="w-4 h-4 text-[#108A00] shrink-0" />
                  <span>NIN &amp; BVN identity verified</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                  <Check className="w-4 h-4 text-[#108A00] shrink-0" />
                  <span>24h platform dispute mediation</span>
                </div>
              </div>
            </div>

            {/* In-Person Job Site Card */}
            <div className="bg-[#FAF7F0] rounded-2xl p-5 border border-stone-200/70 text-center">
              <span className="block text-xs font-bold text-[#141A16] mb-1">
                Are you looking at physical work?
              </span>
              <p className="text-[11px] text-stone-500 leading-relaxed mb-3">
                Scan this artisan’s QR code to verify past projects on site.
              </p>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="text-xs font-bold text-[#123E2A] underline hover:text-[#0B3B24]"
              >
                View QR Code
              </button>
            </div>

          </aside>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. MOBILE FLOATING ACTION BAR (< lg)                         */}
      {/* ============================================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="block text-[10px] text-stone-400 font-semibold uppercase">
            Estimated Rate
          </span>
          <span className="text-sm font-bold text-[#141A16]">
            {artisan.hourlyRate ? `₦${Number(artisan.hourlyRate).toLocaleString()}` : 'From ₦15,000'}
            <span className="text-[10px] text-stone-400 font-normal"> /day</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="p-2.5 rounded-full border border-stone-200 bg-stone-50 text-stone-700"
            aria-label="Share profile"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-[#123E2A] text-white font-bold text-xs py-2.5 px-5 rounded-full shadow-sm flex items-center gap-1 active:scale-95"
          >
            <span>Request Quote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Fullscreen project proof"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Auth Intent Conversion Modal */}
      <AuthIntentModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        artisan={artisan}
      />

      {/* Social Share Modal */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        artisan={artisan}
        shareUrl={shareUrl}
      />

    </div>
  );
};

export default PublicArtisanProfilePage;
