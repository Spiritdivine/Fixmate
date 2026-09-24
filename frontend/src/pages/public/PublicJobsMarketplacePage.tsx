import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  AlertCircle,
  Loader2,
  
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Job, JobCategory, ApiResponse } from '../../types';
import { ArtisanBidIntentModal } from '../../components/public/ArtisanBidIntentModal';
import { useAuthStore } from '../../stores/authStore';
import { trackEvent } from '../../lib/posthog';
import { SeoHead } from '../../components/seo/SeoHead';

// Top Nigerian Hubs for Location Filter
const NIGERIAN_STATES = [
  { label: 'All Locations', value: '' },
  { label: 'Lagos State', value: 'Lagos' },
  { label: 'Abuja (FCT)', value: 'Abuja (FCT)' },
  { label: 'Rivers (Port Harcourt)', value: 'Rivers' },
  { label: 'Oyo State (Ibadan)', value: 'Oyo' },
  { label: 'Enugu State', value: 'Enugu' },
  { label: 'Kano State', value: 'Kano' },
  { label: 'Delta State', value: 'Delta' },
];

export const PublicJobsMarketplacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('q') || '';
  const initialState = searchParams.get('state') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedState, setSelectedState] = useState(initialState);
  const [budgetTier, setBudgetTier] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  useEffect(() => {
    document.title = 'Live Escrow Job Board for Nigerian Artisans | Artifix';
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedState) params.set('state', selectedState);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCategory, selectedState, setSearchParams]);

  // 1. Fetch Categories for Dropdown
  const { data: categories = [] } = useQuery<JobCategory[]>({
    queryKey: ['jobs-categories-filter'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<JobCategory[] | { categories: JobCategory[] }>>(
        '/jobs/categories'
      );
      const list = Array.isArray(data.data) ? data.data : (data.data as any)?.categories;
      return list || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // 2. Fetch Jobs Feed
  const { data: jobsData, isLoading, isError, refetch } = useQuery<{
    jobs: Job[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: [
      'public-jobs-feed',
      debouncedSearch,
      selectedCategory,
      selectedState,
      budgetTier,
      page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedState) params.append('state', selectedState);

      if (budgetTier === 'tier1') {
        params.append('maxBudget', '50000');
      } else if (budgetTier === 'tier2') {
        params.append('minBudget', '50000');
        params.append('maxBudget', '200000');
      } else if (budgetTier === 'tier3') {
        params.append('minBudget', '200000');
        params.append('maxBudget', '500000');
      } else if (budgetTier === 'tier4') {
        params.append('minBudget', '500000');
      }

      const { data } = await apiClient.get(`/jobs?${params.toString()}`);
      return data.data;
    },
  });

  const jobs = jobsData?.jobs || [];
  const meta = jobsData?.meta || { total: 0, page: 1, limit: 15, totalPages: 1 };

  const handleBidClick = (job: Job) => {
    if (user?.role === 'ARTISAN') {
      navigate(`/artisan/jobs/${job.id}/propose`);
    } else {
      setSelectedJobForModal(job);
      setIsBidModalOpen(true);
      trackEvent('public_job_bid_clicked', { job_id: job.id, job_title: job.title });
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedState('');
    setBudgetTier('');
    setPage(1);
  };

  return (
    <div className="w-full pb-24">
      <SeoHead
        title="Live Escrow Job Board for Nigerian Artisans | Artifix"
        description="Browse open artisan jobs and funded service requests across Nigeria. Submit bids directly with smart contract escrow deposits guaranteeing timely payments."
        canonical="https://artifix.app/jobs"
        ogType="website"
        ogImage="/api/v1/og/default"
        ogImageAlt="Artifix Live Escrow Job Board"
        twitterCard="summary_large_image"
      />
      
      {/* ============================================================ */}
      {/* 1. HERO HEADER                                               */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/70 pt-10 sm:pt-14 pb-10 sm:pb-14">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-8">
            

            <h1
              className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#141A16] leading-[1.12] tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Live verified projects waiting for{' '}
              <span
                className="font-serif italic font-normal text-[#123E2A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                skilled artisans.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#556259] leading-relaxed max-w-2xl font-normal">
              Clients and homeowners across Nigeria deposit funds into smart escrow before work begins. Review detailed project scopes, submit proposals, and get paid promptly upon verified milestone completion.
            </p>
          </div>

          {/* Search & Location Bar */}
          <div className="bg-white rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-stone-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            
            <div className="flex-1 flex items-center px-3.5 py-2">
              <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search jobs by keyword, trade, or scope..."
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

            {/* State Selector */}
            <div className="flex items-center px-3 py-1.5 sm:py-0 shrink-0">
              <MapPin className="w-4 h-4 text-[#123E2A] mr-2 shrink-0" />
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setPage(1);
                }}
                className="text-xs sm:text-sm font-semibold text-[#141A16] bg-transparent outline-none cursor-pointer pr-4"
              >
                {NIGERIAN_STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-stone-200" />

            {/* Category Dropdown */}
            <div className="flex items-center px-3 py-1.5 sm:py-0 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="text-xs sm:text-sm font-semibold text-[#141A16] bg-transparent outline-none cursor-pointer pr-4 max-w-[150px] truncate"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Filter Button */}
            <button
              type="button"
              onClick={() => refetch()}
              className="bg-[#123E2A] hover:bg-[#0E3222] text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. FILTER STRIP                                              */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-7 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/70">
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#141A16]">
              {isLoading ? (
                'Loading active contracts...'
              ) : (
                <>
                  <span className="text-[#108A00]">{meta.total}</span> Open Jobs Available
                </>
              )}
            </span>

            {(searchTerm || selectedCategory || selectedState || budgetTier) && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Budget Range Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-stone-500 mr-1 hidden sm:inline">Budget:</span>
            {[
              { label: 'All Budgets', value: '' },
              { label: '< ₦50k', value: 'tier1' },
              { label: '₦50k – ₦200k', value: 'tier2' },
              { label: '₦200k – ₦500k', value: 'tier3' },
              { label: '₦500k+', value: 'tier4' },
            ].map((tier) => (
              <button
                key={tier.value}
                type="button"
                onClick={() => {
                  setBudgetTier(tier.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  budgetTier === tier.value
                    ? 'bg-[#123E2A] text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. LIVE JOBS FEED                                            */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#123E2A] animate-spin" />
            <p className="text-sm font-medium text-stone-500">
              Fetching funded contracts near you...
            </p>
          </div>
        )}

        {isError && !isLoading && (
          <div className="py-16 bg-white rounded-3xl p-8 border border-rose-200 text-center max-w-lg mx-auto shadow-sm">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#141A16] mb-1">
              Unable to load contracts
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="bg-[#123E2A] text-white text-xs font-semibold px-5 py-2.5 rounded-full"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && jobs.length === 0 && (
          <div className="py-16 bg-white rounded-3xl p-8 border border-stone-200 text-center max-w-lg mx-auto shadow-sm">
            <Briefcase className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-[#141A16] mb-2">
              No matching contracts found
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mb-6 leading-relaxed">
              Try adjusting your search keywords or clearing your budget filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-stone-100 hover:bg-stone-200 text-[#141A16] text-xs font-semibold px-5 py-2.5 rounded-full"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Jobs Cards Grid (TradesShowcaseSection Elevated Style) */}
        {!isLoading && !isError && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {jobs.map((job) => {
              const budgetText =
                job.budgetMin && job.budgetMax
                  ? `₦${Number(job.budgetMin).toLocaleString()} – ₦${Number(job.budgetMax).toLocaleString()}`
                  : 'Competitive Escrow';

              return (
                <div
                  key={job.id}
                  className="group bg-white rounded-3xl p-6 sm:p-7 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200 border border-stone-200/70 flex flex-col justify-between text-left select-none relative overflow-hidden"
                >
                  <div>
                    {/* Top Row: Category Tag, Escrow Status, Bids count */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="bg-[#123E2A]/10 text-[#123E2A] text-[10.5px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide truncate max-w-[170px]">
                        {job.category?.name || 'Skilled Contract'}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Funded Escrow
                        </span>
                        <span className="text-[11px] text-stone-400 font-medium">
                          {job.proposalsCount || 0} bids
                        </span>
                      </div>
                    </div>

                    {/* Job Title */}
                    <h3
                      className="text-base sm:text-lg font-bold text-[#141A16] group-hover:text-[#123E2A] transition-colors leading-snug mb-2"
                      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                    >
                      {job.title}
                    </h3>

                    {/* Description Excerpt */}
                    <p className="text-xs sm:text-[13px] text-[#556259] leading-relaxed line-clamp-3 mb-4 font-normal">
                      {job.description}
                    </p>

                    {/* Skill Pills */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.skills.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-[#FAF7F0] text-stone-600 text-[10px] sm:text-[10.5px] font-medium px-2 py-0.5 rounded-md border border-stone-200/50"
                          >
                            {item.skill?.name || 'Skill'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3 mt-auto">
                    <div>
                      <div className="flex items-center gap-1 text-[11px] text-stone-500 font-medium truncate max-w-[140px] mb-0.5">
                        <MapPin className="w-3 h-3 text-[#123E2A] shrink-0" />
                        <span className="truncate">{job.lgaCity ? `${job.lgaCity}, ${job.state}` : job.state}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-[#123E2A] block">
                        {budgetText}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBidClick(job)}
                      className="bg-[#123E2A] hover:bg-[#0E3222] text-white font-semibold text-xs px-4 py-2 rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      <span>Submit Bid</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Strip */}
        {!isLoading && !isError && meta.totalPages > 1 && (
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
      {/* 4. HOMEOWNER INVERSION BANNER                                */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="bg-[#FAF7F0] border border-stone-300/80 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-left">
            <span className="text-xs font-bold text-[#108A00] uppercase tracking-wider block mb-1">
              For Clients &amp; Homeowners
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#141A16] mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Need skilled work done for your home or property?
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
              Post your project scope in under 2 minutes. Receive competitive quotes from verified artisans in your neighborhood with zero advance payment risk.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to="/register?role=CLIENT"
              className="inline-flex items-center gap-2 bg-[#123E2A] hover:bg-[#0E3222] text-white font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full transition-all shadow-md active:scale-95"
            >
              <span>Post a Job Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Artisan Bid Intent Modal */}
      <ArtisanBidIntentModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        job={selectedJobForModal}
      />

    </div>
  );
};

export default PublicJobsMarketplacePage;
