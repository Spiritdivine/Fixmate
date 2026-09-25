import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  CheckCircle2,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  LocateFixed,
  ShieldCheck,
  Briefcase,
  X,
  ChevronRight,
  ChevronLeft,
  
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { ArtisanProfile, JobCategory, ApiResponse } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { MapView } from '../../components/map/MapView';
import { GeolocationService, DEFAULT_NIGERIAN_COORDINATES } from '../../lib/geolocation';
import { AuthIntentModal } from '../../components/public/AuthIntentModal';
import { trackEvent } from '../../lib/posthog';
import { SeoHead } from '../../components/seo/SeoHead';

// Top Nigerian Hubs for Filter Bar
const NIGERIAN_CITIES = [
  { label: 'All Nigeria', value: '' },
  { label: 'Lagos State', value: 'Lagos' },
  { label: 'Abuja (FCT)', value: 'Abuja (FCT)' },
  { label: 'Rivers (Port Harcourt)', value: 'Rivers' },
  { label: 'Oyo (Ibadan)', value: 'Oyo' },
  { label: 'Enugu State', value: 'Enugu' },
  { label: 'Kano State', value: 'Kano' },
  { label: 'Delta (Warri/Asaba)', value: 'Delta' },
];

// Quick Trade Pills
const QUICK_TRADES = [
  { label: 'All Crafts', slug: '' },
  { label: 'Solar & Inverters', slug: 'solar-and-inverters', query: 'Solar' },
  { label: 'Plumbing & Pipes', slug: 'plumbing-and-pipefitting', query: 'Plumbing' },
  { label: 'Electrical Wiring', slug: 'electrical-and-wiring', query: 'Electrical' },
  { label: 'Carpentry & Woodwork', slug: 'carpentry-and-woodwork', query: 'Carpentry' },
  { label: 'POP & Painting', slug: 'painting-and-pop', query: 'Painting' },
  { label: 'AC & Refrigeration', slug: 'hvac-and-ac-repair', query: 'AC' },
  { label: 'Masonry & Tiling', slug: 'masonry-and-tiling', query: 'Masonry' },
];

export const PublicArtisanDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('q') || searchParams.get('trade') || '';
  const initialState = searchParams.get('state') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [minRating, setMinRating] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [page, setPage] = useState<number>(1);
  const [selectedArtisanForModal, setSelectedArtisanForModal] = useState<ArtisanProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Geolocation state for "Near Me"
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    DEFAULT_NIGERIAN_COORDINATES.latitude,
    DEFAULT_NIGERIAN_COORDINATES.longitude,
  ]);
  const [selectedMapArtisanId, setSelectedMapArtisanId] = useState<string | null>(null);

  // Dynamic document title
  useEffect(() => {
    document.title = 'Find Verified Nigerian Artisans | Artifix Escrow Directory';
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Update query params on search/category/state change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedState) params.set('state', selectedState);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCategory, selectedState, setSearchParams]);

  // 1. Fetch Categories for filter dropdown & chips
  const { data: categories = [] } = useQuery<JobCategory[]>({
    queryKey: ['public-job-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<JobCategory[] | { categories: JobCategory[] }>>(
        '/jobs/categories'
      );
      const list = Array.isArray(data.data) ? data.data : (data.data as any)?.categories;
      return list || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. Fetch Artisans (Standard Discovery or Spatial Nearby)
  const { data: artisansData, isLoading, isError, refetch } = useQuery<{
    artisans: ArtisanProfile[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: [
      'public-artisans',
      debouncedSearch,
      selectedCategory,
      selectedState,
      minRating,
      availableOnly,
      page,
      userCoords?.latitude,
      userCoords?.longitude,
    ],
    queryFn: async () => {
      // If user activated GPS and is in near-me mode
      if (userCoords) {
        const queryParams = new URLSearchParams({
          lat: userCoords.latitude.toString(),
          lng: userCoords.longitude.toString(),
          radius: '25',
          page: page.toString(),
          limit: '18',
        });
        if (debouncedSearch) queryParams.append('search', debouncedSearch);
        if (selectedCategory) queryParams.append('categoryId', selectedCategory);
        if (minRating) queryParams.append('minRating', minRating);

        const { data } = await apiClient.get(`/profiles/artisans/nearby?${queryParams.toString()}`);
        return data.data;
      }

      // Standard query
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '18',
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (selectedCategory) queryParams.append('categoryId', selectedCategory);
      if (selectedState) queryParams.append('state', selectedState);

      const { data } = await apiClient.get(`/profiles/artisans?${queryParams.toString()}`);
      return data.data;
    },
  });

  const rawArtisans = artisansData?.artisans || [];
  const meta = artisansData?.meta || { total: 0, page: 1, limit: 18, totalPages: 1 };

  // Client-side filtering for attributes not filtered by basic backend endpoint
  const filteredArtisans = useMemo(() => {
    return rawArtisans.filter((artisan) => {
      if (verifiedOnly && !artisan.user?.isKycVerified) {
        return false;
      }
      if (availableOnly && !artisan.isAvailable) {
        return false;
      }
      if (minRating) {
        const ratingNum = typeof artisan.ratingAvg === 'number' 
          ? artisan.ratingAvg 
          : parseFloat(String(artisan.ratingAvg || '0'));
        if (ratingNum < parseFloat(minRating)) return false;
      }
      return true;
    });
  }, [rawArtisans, verifiedOnly, availableOnly, minRating]);

  // Handle GPS Locate Me
  const handleLocateMe = async () => {
    setIsLocating(true);
    setGeoError(null);
    const result = await GeolocationService.getCurrentPosition();
    setIsLocating(false);

    if (result.coordinates) {
      setUserCoords(result.coordinates);
      setMapCenter([result.coordinates.latitude, result.coordinates.longitude]);
      trackEvent('public_directory_locate_clicked', {
        lat: result.coordinates.latitude,
        lng: result.coordinates.longitude,
      });
    }
    if (result.isFallback && result.error) {
      setGeoError(result.error);
    }
  };

  const handleClearLocation = () => {
    setUserCoords(null);
    setGeoError(null);
    setMapCenter([DEFAULT_NIGERIAN_COORDINATES.latitude, DEFAULT_NIGERIAN_COORDINATES.longitude]);
  };

  const handleHireClick = (artisan: ArtisanProfile) => {
    setSelectedArtisanForModal(artisan);
    setIsAuthModalOpen(true);
    trackEvent('public_directory_hire_clicked', {
      artisan_id: artisan.id,
      artisan_name: artisan.businessName,
    });
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedState('');
    setMinRating('');
    setVerifiedOnly(false);
    setAvailableOnly(false);
    setUserCoords(null);
    setGeoError(null);
    setPage(1);
  };

  return (
    <div className="w-full pb-20">
      <SeoHead
        title="Find Verified Nigerian Artisans | Artifix Escrow Directory"
        description="Search and hire ID-verified electricians, plumbers, solar engineers, carpenters, and painters across Nigeria with 100% money-back smart escrow protection."
        canonical="https://artifixhq.xyz/artisans"
        ogType="website"
        ogImage="/api/v1/og/default"
        ogImageAlt="Artifix Verified Artisans Directory"
        twitterCard="summary_large_image"
      />
      
      {/* ============================================================ */}
      {/* 1. HERO SECTION & PRIMARY SEARCH BAR                         */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/70 pt-10 sm:pt-14 pb-8 sm:pb-12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Badge & Editorial Headline */}
          <div className="max-w-3xl mb-8">

            <h1 
              className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#141A16] leading-[1.12] tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Hire verified craftsmen across{' '}
              <span 
                className="font-serif italic font-normal text-[#123E2A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Nigeria with peace of mind.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#556259] leading-relaxed max-w-2xl font-normal">
              Browse vetted plumbers, solar installers, electricians, and tradesmen in Lagos, Abuja, Port Harcourt, and beyond. Your funds remain safely in smart escrow until you approve the finished work.
            </p>
          </div>

          {/* Unified Search & Location Bar */}
          <div className="bg-white rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-stone-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            
            {/* Search Input */}
            <div className="flex-1 flex items-center px-3.5 py-2">
              <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by trade, skill, or artisan name..."
                className="w-full text-sm sm:text-base text-[#141A16] placeholder:text-stone-400 bg-transparent outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-stone-200" />

            {/* State / City Selector */}
            <div className="flex items-center px-3 py-1.5 sm:py-0 shrink-0">
              <MapPin className="w-4 h-4 text-[#123E2A] mr-2 shrink-0" />
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setUserCoords(null);
                  setPage(1);
                }}
                className="text-xs sm:text-sm font-semibold text-[#141A16] bg-transparent outline-none cursor-pointer pr-4"
              >
                {NIGERIAN_CITIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-stone-200" />

            {/* GPS Near Me Button */}
            <button
              type="button"
              onClick={userCoords ? handleClearLocation : handleLocateMe}
              disabled={isLocating}
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                userCoords
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5 text-[#123E2A]" />
              )}
              <span>{userCoords ? 'Near Me (Active)' : 'Near Me'}</span>
            </button>

            {/* Search Submit / Filter Trigger */}
            <button
              type="button"
              onClick={() => refetch()}
              className="bg-[#123E2A] hover:bg-[#0E3222] text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* GPS Fallback Notice if IP fallback occurred */}
          {geoError && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-lg border border-amber-200/60 max-w-xl">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{geoError}</span>
            </div>
          )}

          {/* Quick Trade Filter Chips */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_TRADES.map((trade) => {
              const isSelected =
                (!trade.slug && !selectedCategory && !debouncedSearch) ||
                (trade.query && debouncedSearch.toLowerCase().includes(trade.query.toLowerCase()));

              return (
                <button
                  key={trade.label}
                  type="button"
                  onClick={() => {
                    if (!trade.query) {
                      setSearchTerm('');
                      setSelectedCategory('');
                    } else {
                      setSearchTerm(trade.query);
                    }
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
                    isSelected
                      ? 'bg-[#123E2A] text-white shadow-sm'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:border-stone-400 hover:text-[#141A16]'
                  }`}
                >
                  {trade.label}
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. FILTER STRIP & VIEW MODE CONTROLS                         */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200/70">
          
          {/* Left: Results Count & Active Filter Indicator */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-bold text-[#141A16]">
              {isLoading ? (
                'Loading verified artisans...'
              ) : (
                <>
                  <span className="text-[#108A00]">{filteredArtisans.length}</span> Verified Artisans Available
                </>
              )}
            </span>

            {/* Clear All pill if any active filter */}
            {(searchTerm || selectedCategory || selectedState || minRating || verifiedOnly || availableOnly || userCoords) && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Right Controls: Filters & Grid/Map View Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 outline-none hover:border-stone-400 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Minimum Rating Dropdown */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 outline-none hover:border-stone-400 cursor-pointer"
            >
              <option value="">Any Rating</option>
              <option value="4.5">★ 4.5 &amp; above</option>
              <option value="4.8">★ 4.8 &amp; above</option>
            </select>

            {/* Verified Badge Only Toggle */}
            <button
              type="button"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                verifiedOnly
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#108A00]" />
              <span>Verified Only</span>
            </button>

            {/* Available Now Toggle */}
            <button
              type="button"
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                availableOnly
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${availableOnly ? 'bg-emerald-600 animate-pulse' : 'bg-stone-300'}`} />
              <span>Available Now</span>
            </button>

            {/* View Mode Toggle: Grid vs Map */}
            <div className="bg-stone-200/70 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#141A16] shadow-sm'
                    : 'text-stone-600 hover:text-[#141A16]'
                }`}
                aria-label="Grid View"
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-[#141A16] shadow-sm'
                    : 'text-stone-600 hover:text-[#141A16]'
                }`}
                aria-label="Map View"
                title="Map View"
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. ARTISANS DISPLAY: GRID OR MAP VIEW                        */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        
        {/* Loading State */}
        {isLoading && (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#123E2A] animate-spin" />
            <p className="text-sm font-medium text-stone-500">
              Fetching vetted craftsmen near you...
            </p>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="w-full py-16 bg-white rounded-3xl p-8 border border-rose-200 text-center max-w-lg mx-auto shadow-sm">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#141A16] mb-1">
              Unable to load artisans
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Please check your network connection and try again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="bg-[#123E2A] text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-[#0E3222] transition-colors"
            >
              Retry Discovery
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredArtisans.length === 0 && (
          <div className="w-full py-16 bg-white rounded-3xl p-8 border border-stone-200 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#FAF7F0] flex items-center justify-center mx-auto mb-4 text-[#123E2A]">
              <Search className="w-7 h-7" />
            </div>
            <h3 
              className="text-xl font-bold text-[#141A16] mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              No artisans found matching your criteria
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mb-6 leading-relaxed">
              We couldn’t find verified craftsmen matching these exact filters. Try broadening your location or resetting filters.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={resetAllFilters}
                className="bg-stone-100 hover:bg-stone-200 text-[#141A16] text-xs font-semibold px-5 py-2.5 rounded-full transition-colors"
              >
                Reset Filters
              </button>
              <Link
                to="/register?role=CLIENT"
                className="bg-[#123E2A] hover:bg-[#0E3222] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors shadow-sm"
              >
                Post a Custom Job Instead
              </Link>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW MODE A: 3-COLUMN EDITORIAL GRID                        */}
        {/* ------------------------------------------------------------ */}
        {!isLoading && !isError && filteredArtisans.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredArtisans.map((artisan) => {
              const ratingVal =
                typeof artisan.ratingAvg === 'number'
                  ? artisan.ratingAvg
                  : parseFloat(String(artisan.ratingAvg || '5.0'));

              // Category label
              const categoryName =
                artisan.skills?.[0]?.skill?.category?.name ||
                artisan.skills?.[0]?.skill?.name ||
                'Skilled Craft';

              return (
                <div
                  key={artisan.id}
                  className="group relative bg-white rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between border border-stone-200/60 text-left select-none"
                >
                  {/* Card Header: Avatar, Name, Verification Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <Link to={`/p/${artisan.id}`} className="flex items-center gap-3 min-w-0 group/info">
                        <Avatar
                          src={artisan.user?.avatarUrl || undefined}
                          name={artisan.businessName || artisan.user?.email || 'Artisan'}
                          size="lg"
                          className="w-12 h-12 rounded-xl ring-2 ring-[#123E2A]/10 shrink-0 transition-transform group-hover/info:scale-105"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-[15px] font-bold text-[#141A16] group-hover/info:text-[#123E2A] transition-colors truncate">
                              {artisan.businessName || 'Verified Artisan'}
                            </h3>
                            {artisan.user?.isKycVerified && (
                              <span
                                title="NIN/BVN Identity Verified"
                                className="text-[#108A00] shrink-0"
                              >
                                <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                              </span>
                            )}
                          </div>
                          <span className="block text-xs text-stone-500 font-medium truncate">
                            {categoryName}
                          </span>
                        </div>
                      </Link>

                      {/* Availability Dot Pill */}
                      {artisan.isAvailable ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-stone-100 text-stone-500 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0">
                          Busy
                        </span>
                      )}
                    </div>

                    {/* Tagline / Bio snippet */}
                    <p className="text-xs text-[#556259] leading-relaxed line-clamp-2 mb-4 font-normal">
                      {artisan.tagline || artisan.bio || 'Experienced verified artisan ready for residential and commercial contracts.'}
                    </p>

                    {/* Key Stats Bar: Rating, Completed Jobs, Location */}
                    <div className="flex items-center gap-3 text-xs text-stone-600 font-medium mb-4 flex-wrap">
                      <div className="flex items-center gap-1 text-[#141A16] font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{ratingVal.toFixed(1)}</span>
                        <span className="text-stone-400 font-normal">({artisan.reviewCount || 0})</span>
                      </div>
                      <span className="text-stone-300">•</span>
                      <div className="text-stone-600 font-medium">
                        <strong className="text-[#141A16]">{artisan.completedJobsCount || 0}</strong> jobs
                      </div>
                      <span className="text-stone-300">•</span>
                      <div className="flex items-center gap-1 text-stone-500 truncate max-w-[130px]">
                        <MapPin className="w-3 h-3 text-[#123E2A] shrink-0" />
                        <span className="truncate">{artisan.lgaCity || artisan.state}</span>
                      </div>
                    </div>

                    {/* Top Skills Tags */}
                    {artisan.skills && artisan.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {artisan.skills.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-[#FAF7F0] text-stone-600 text-[10.5px] font-medium px-2 py-0.5 rounded-md border border-stone-200/50 truncate max-w-[140px]"
                          >
                            {item.skill?.name || 'Skill'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Portfolio Preview Thumbnail Snippet (if available) */}
                    {artisan.portfolios && artisan.portfolios.length > 0 && artisan.portfolios[0].mediaUrls?.length > 0 && (
                      <div className="mb-4 rounded-xl overflow-hidden aspect-[16/8] bg-stone-100 relative group/thumb">
                        <img
                          src={artisan.portfolios[0].mediaUrls[0]}
                          alt={artisan.portfolios[0].title || 'Artisan proof of work'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                          <span className="text-[11px] font-semibold text-white truncate">
                            {artisan.portfolios[0].title || 'Recent Project'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Action Strip */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3 mt-auto">
                    <div>
                      <span className="block text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                        Daily Estimate
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#141A16]">
                        {artisan.hourlyRate ? `₦${Number(artisan.hourlyRate).toLocaleString()}` : 'From ₦15,000'}
                        <span className="text-[10px] font-normal text-stone-500"> /day</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/p/${artisan.id}`}
                        className="text-xs font-semibold text-stone-600 hover:text-[#141A16] px-3 py-2 rounded-full hover:bg-stone-100 transition-colors"
                      >
                        Profile
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleHireClick(artisan)}
                        className="bg-[#123E2A] text-white hover:bg-[#0E3222] text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <span>Hire</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* VIEW MODE B: INTERACTIVE MAP VIEW                           */}
        {/* ------------------------------------------------------------ */}
        {!isLoading && !isError && filteredArtisans.length > 0 && viewMode === 'map' && (
          <div className="w-full h-[620px] rounded-3xl overflow-hidden border border-stone-200 shadow-md relative bg-stone-100">
            <MapView
              center={mapCenter}
              zoom={userCoords ? 13 : 8}
              artisans={filteredArtisans}
              selectedArtisanId={selectedMapArtisanId}
              onSelectArtisan={(id) => setSelectedMapArtisanId(id)}
              onNavigateProfile={(id) => {
                const target = filteredArtisans.find((a) => a.id === id);
                if (target) handleHireClick(target);
              }}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Pagination Strip (in Grid Mode) */}
        {!isLoading && !isError && viewMode === 'grid' && meta.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-full border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: meta.totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`w-9 h-9 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#123E2A] text-white shadow-sm'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="p-2 rounded-full border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </section>

      {/* ============================================================ */}
      {/* 4. HIGH-CONVERSION TRUST FOOTER BANNER                       */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="bg-[#123E2A] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl z-10 text-left">
            
            <h2 
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Get discovered by high-budget clients &amp; guarantee your payouts.
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-normal">
              Join thousands of verified electricians, plumbers, and contractors earning reliably through Monad smart escrow. No bidding commissions, instant settlements.
            </p>
          </div>

          <div className="shrink-0 z-10">
            <Link
              to="/register?role=ARTISAN"
              className="inline-flex items-center gap-2 bg-white text-[#123E2A] hover:bg-stone-100 font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full transition-all shadow-md active:scale-95"
            >
              <span>Apply as Verified Artisan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Auth Intent Conversion Modal */}
      <AuthIntentModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        artisan={selectedArtisanForModal}
      />

    </div>
  );
};

export default PublicArtisanDirectoryPage;
