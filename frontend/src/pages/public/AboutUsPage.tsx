import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  Users,
  CheckCircle2,
  Lock,
  Building2,
  Wrench,
} from 'lucide-react';
import { SeoHead } from '../../components/seo/SeoHead';
import { FrequentlyAskedQuestions } from '../../components/common/FrequentlyAskedQuestions';

export const AboutUsPage: React.FC = () => {
  return (
    <div className="w-full pb-20">
      <SeoHead
        title="About Us & Company Story | Artifix"
        description="Learn how Artifix is transforming informal blue-collar commerce across Nigeria through verified artisan identity, dual-rail escrow, and zero-dispute settlements."
        canonical="https://artifixhq.xyz/about"
        ogType="website"
        ogImage="/api/v1/og/about"
        ogImageAlt="About Artifix"
        twitterCard="summary_large_image"
      />

      {/* ============================================================ */}
      {/* 1. HERO SECTION                                              */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/70 pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-3">
              THE ARTIFIX STORY • FOUNDED IN LAGOS
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-[#141A16] leading-[1.1] tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Restoring trust to Africa's skilled trade{' '}
              <span
                className="font-serif italic font-normal text-[#121814]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                economy.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#556259] leading-relaxed max-w-2xl font-normal">
              Over 15 million skilled craftsmen power Nigeria's homes and infrastructure. Artifix builds the verification and smart contract escrow systems that make working together safe.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. THE CORE PROBLEM & WHY WE BUILT THIS                      */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-4">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase">
              THE NIGERIAN DILEMMA
            </div>

            <h2
              className="text-2xl sm:text-3xl font-bold text-[#141A16] leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              A market paralyzed by broken promises and unpaid work.
            </h2>

            <p className="text-xs sm:text-[13px] text-[#556259] leading-relaxed font-normal">
              For homeowners and facility managers in Lagos and Abuja, hiring an artisan has historically felt like a gamble. You pay an advance deposit for materials, and the technician switches off their phone. Or worse, an unverified worker damages complex inverter wiring with no accountability.
            </p>

            <p className="text-xs sm:text-[13px] text-[#556259] leading-relaxed font-normal">
              Yet the honest artisan faces an equally brutal reality. Skilled plumbers, carpenters, and electricians complete backbreaking jobs only for clients to withhold their final payment with endless excuses. Without capital reserves, honest tradesmen cannot grow.
            </p>

            <p className="text-xs sm:text-[13px] text-[#141A16] font-semibold leading-relaxed">
              Artifix was created to remove the gamble. Funds are locked safely in escrow before work begins, and released only when deliverables are verified.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-5">
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
                <div className="font-bold text-sm text-[#141A16] mb-1">
                  Client Reality
                </div>
                <p className="text-xs text-stone-600 leading-relaxed font-normal">
                  "I gave ₦180,000 upfront for solar battery cables. The technician never returned, and I had no physical address to trace him."
                </p>
                <div className="text-[11px] text-stone-400 mt-1 font-medium">— Property Manager, Lekki</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
                <div className="font-bold text-sm text-[#141A16] mb-1">
                  Artisan Reality
                </div>
                <p className="text-xs text-stone-600 leading-relaxed font-normal">
                  "I finished piping a 4-bedroom duplex in Ikeja. The client moved in and refused to pay my balance of ₦95,000 for three months."
                </p>
                <div className="text-[11px] text-stone-400 mt-1 font-medium">— Certified Plumber, Ikeja</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                <div className="font-bold text-sm text-emerald-950 mb-1">
                  The Artifix Settlement Standard
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-normal">
                  Smart contract milestone lock. Client funds remain safe; artisan payout is guaranteed upon photographic and physical inspection.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. FOUR CORE VALUES                                          */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="max-w-3xl mb-8">
          <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-2">
            HOW WE OPERATE
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#141A16]"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Our core principles
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
            The foundation behind our verification protocols and escrow architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center font-bold text-xs mb-4">
              01
            </div>
            <h3 className="text-sm font-bold text-[#141A16] mb-2">
              Dignity of Skilled Labor
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              We treat artisans as master professionals, equipping them with portable verified reputations and uncheatable income records.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center font-bold text-xs mb-4">
              02
            </div>
            <h3 className="text-sm font-bold text-[#141A16] mb-2">
              Radical Transparency
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Flat 5% platform fee with zero hidden markups. No monthly subscriptions and no paywalls to bid on open jobs.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center font-bold text-xs mb-4">
              03
            </div>
            <h3 className="text-sm font-bold text-[#141A16] mb-2">
              Dual-Rail Inclusivity
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              Familiar Nigerian Naira bank transfers for everyday simplicity; Monad EVM blockchain escrow for uncheatable security.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center font-bold text-xs mb-4">
              04
            </div>
            <h3 className="text-sm font-bold text-[#141A16] mb-2">
              Physical Verification
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              We do not stop at app signups. We conduct in-person trade assessments, workshop geotagging, and national identity vetting.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. PHYSICAL PRESENCE & REGIONAL HUBS                        */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="max-w-3xl mb-8">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-2">
              REGIONAL FOOTPRINT
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#141A16]"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Active hubs across Nigeria
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
              Physical infrastructure supporting practical trade verification and dispute mediation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-[13px]">
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
              <div className="flex items-center gap-2 font-bold text-[#141A16] mb-1">
                <MapPin className="w-4 h-4 text-[#123E2A]" />
                <span>Lekki Assessment Facility (Lagos)</span>
              </div>
              <p className="text-stone-600 font-normal leading-relaxed">
                Admiralty Way, Lekki Phase 1.<br />
                Headquarters for practical trade tests, electrical/solar bench audits, and coastal dispute hearings.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
              <div className="flex items-center gap-2 font-bold text-[#141A16] mb-1">
                <MapPin className="w-4 h-4 text-[#123E2A]" />
                <span>Ikeja Operations Center (Lagos)</span>
              </div>
              <p className="text-stone-600 font-normal leading-relaxed">
                Allen Avenue, Ikeja.<br />
                Mainland artisan onboarding desk, apprenticeship verification, and tools accreditation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-stone-200/60">
              <div className="flex items-center gap-2 font-bold text-[#141A16] mb-1">
                <MapPin className="w-4 h-4 text-[#123E2A]" />
                <span>Wuse II Liaison Center (Abuja)</span>
              </div>
              <p className="text-stone-600 font-normal leading-relaxed">
                Aminu Kano Crescent, Wuse II.<br />
                Federal Capital Territory commercial operations and institutional facility management contracts.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-stone-500 font-normal">
              Expanding to Port Harcourt and Ibadan in Q3 2026.
            </span>

            <div className="flex items-center gap-3">
              <Link
                to="/artisans"
                className="inline-flex items-center gap-2 bg-[#123E2A] hover:bg-[#0E3222] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs"
              >
                <span>Browse Verified Artisans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/register?role=ARTISAN"
                className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                <span>Apply as an Artisan</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. CANONICAL PLATFORM FAQ                                     */}
      {/* ============================================================ */}
      <FrequentlyAskedQuestions className="mt-8 sm:mt-12 border-t-0" />
    </div>
  );
};

export default AboutUsPage;
