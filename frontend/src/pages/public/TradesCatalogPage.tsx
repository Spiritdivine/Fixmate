import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Users,
  
  Layers,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { ALL_TRADES_LIST, TradeCategoryData } from '../../data/tradeCatalogData';
import { trackEvent } from '../../lib/posthog';
import { SeoHead } from '../../components/seo/SeoHead';

export const TradesCatalogPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredTrades = ALL_TRADES_LIST.filter((trade) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      trade.name.toLowerCase().includes(query) ||
      trade.description.toLowerCase().includes(query) ||
      trade.popularSkills.some((s) => s.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full pb-20">
      <SeoHead
        title="Browse Verified Artisan Trades & Price Benchmarks | Artifix"
        description="Explore 8 verified skilled trades across Nigeria. Compare fair market price estimates, common job scopes, and hire verified specialists with 100% money-back escrow protection."
        canonical="https://artifix.app/trades"
        ogType="website"
        ogImage="/api/v1/og/default"
        ogImageAlt="Artifix Verified Trades Catalog"
        twitterCard="summary_large_image"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Verified Artisan Trades in Nigeria',
          itemListElement: ALL_TRADES_LIST.map((t, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: t.name,
            description: t.description,
          })),
        }}
      />
      
      {/* ============================================================ */}
      {/* 1. HERO SECTION                                              */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/70 pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-8">
            

            <h1
              className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-[#141A16] leading-[1.1] tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Explore verified skilled trades across{' '}
              <span
                className="font-serif italic font-normal text-[#123E2A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Nigeria.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#556259] leading-relaxed max-w-2xl font-normal">
              Compare transparent Nigerian market price estimates, common job deliverables, and quality checklists for every craft. Hire verified specialists with 100% money-back escrow protection.
            </p>
          </div>

          {/* Search Input Bar */}
          <div className="max-w-xl bg-white rounded-2xl sm:rounded-full p-2 shadow-sm border border-stone-200/80 flex items-center gap-2">
            <div className="flex-1 flex items-center px-3 py-1.5">
              <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trades (e.g. Solar, Inverter, Plumbing, POP)..."
                className="w-full text-sm sm:text-base text-[#141A16] placeholder:text-stone-400 bg-transparent outline-none"
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-xs text-stone-400 hover:text-stone-600 px-2 font-medium"
              >
                Clear
              </button>
            )}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. TRADES GRID CATALOG                                       */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12">
        
        <div className="flex items-center justify-between gap-4 mb-6">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            All Verified Crafts ({filteredTrades.length})
          </span>
          <span className="text-xs text-stone-400 font-medium">
            Updated Nigerian Market Estimates
          </span>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="w-full py-16 bg-white rounded-3xl p-8 border border-stone-200 text-center max-w-md mx-auto">
            <Search className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-[#141A16] mb-1">
              No trade found
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              We couldn't find a craft matching "{search}".
            </p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs font-bold text-[#123E2A] underline"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredTrades.map((trade) => (
              <Link
                key={trade.slug}
                to={`/artisans?trade=${encodeURIComponent(trade.name)}`}
                onClick={() => trackEvent('trades_catalog_card_clicked', { trade_slug: trade.slug, trade_name: trade.name })}
                className="group bg-white rounded-3xl p-6 sm:p-7 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200 border border-stone-200/70 flex flex-col justify-between text-left select-none relative overflow-hidden"
              >
                {/* Decorative Accent Strip on Hover */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#123E2A] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Card Header: Category Title + Specialists Count */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3
                        className="text-xl sm:text-2xl font-bold text-[#141A16] group-hover:text-[#123E2A] transition-colors leading-tight mb-1"
                        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                      >
                        {trade.name}
                      </h3>
                      <span className="text-xs text-[#108A00] font-semibold">
                        {trade.tagline}
                      </span>
                    </div>

                    <div className="w-9 h-9 rounded-2xl bg-[#FAF7F0] flex items-center justify-center text-[#123E2A] group-hover:bg-[#123E2A] group-hover:text-white transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-[#556259] leading-relaxed line-clamp-3 mb-5 font-normal">
                    {trade.description}
                  </p>

                  {/* Benchmark Metrics Strip */}
                  <div className="grid grid-cols-2 gap-2 bg-[#FAF7F0] p-3 rounded-2xl mb-5">
                    <div>
                      <span className="block text-[10px] text-stone-400 font-semibold uppercase">
                        Typical Budget
                      </span>
                      <span className="text-xs font-bold text-[#141A16] truncate block">
                        {trade.averageBudgetRange}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-stone-400 font-semibold uppercase">
                        Duration
                      </span>
                      <span className="text-xs font-bold text-[#141A16] truncate block">
                        {trade.typicalDuration}
                      </span>
                    </div>
                  </div>

                  {/* Popular Skills Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {trade.popularSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-white border border-stone-200 text-stone-600 text-[10.5px] font-medium px-2.5 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                    {trade.popularSkills.length > 3 && (
                      <span className="text-[10px] text-stone-400 self-center">
                        +{trade.popularSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#123E2A] group-hover:text-[#0B3B24]">
                  <span className="flex items-center gap-1.5 text-stone-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-[#108A00]" />
                    <span>{trade.activeSpecialistsCount} Verified Artisans</span>
                  </span>

                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Browse Artisans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </section>

      {/* ============================================================ */}
      {/* 3. WHY VERIFIED TRADES MATTER BANNER                         */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="bg-[#123E2A] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
          <div className="max-w-2xl mb-8">
            
            <h2
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Every trade is governed by smart contracts and physical verification.
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 font-normal leading-relaxed">
              No unverified subcontractors. No inflated material bills. Guaranteed milestone settlements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
              <CheckCircle2 className="w-6 h-6 text-emerald-300 mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">NIN &amp; Physical Vetting</h4>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Every artisan undergoes government ID verification, workshop address confirmation, and technical competence audits.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
              <ShieldCheck className="w-6 h-6 text-emerald-300 mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Milestone Escrow Hold</h4>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Clients deposit funds into smart escrow contracts. Artisans only get paid after you inspect and sign off on completed work.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
              <Briefcase className="w-6 h-6 text-emerald-300 mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Standardized Scope Guides</h4>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Clear contract templates defining client-supplied versus artisan-supplied materials to eliminate surprise expenses.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default TradesCatalogPage;
