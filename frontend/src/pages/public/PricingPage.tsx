import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Lock,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { SeoHead } from '../../components/seo/SeoHead';
import { formatCurrency } from '../../lib/formatters';
import { FrequentlyAskedQuestions } from '../../components/common/FrequentlyAskedQuestions';

export const PricingPage: React.FC = () => {
  const [contractAmount, setContractAmount] = useState<number>(150000);
  const [paymentRail, setPaymentRail] = useState<'FIAT' | 'CRYPTO'>('FIAT');

  // Fee calculation
  const feeRate = paymentRail === 'FIAT' ? 0.05 : 0.025; // 5% for Fiat, 2.5% for Web3 Monad
  const platformFee = Math.round(contractAmount * feeRate);
  const artisanPayout = contractAmount - platformFee;

  // 3-Milestone Breakdown
  const m1 = Math.round(contractAmount * 0.3);
  const m2 = Math.round(contractAmount * 0.4);
  const m3 = contractAmount - m1 - m2;

  const presets = [50000, 150000, 350000, 800000, 1500000];

  return (
    <div className="w-full pb-20">
      <SeoHead
        title="Escrow Pricing & Fee Transparency | Artifix"
        description="Clear, predictable 5% escrow fee structure on verified artisan jobs across Nigeria. Use our fee calculator to calculate take-home payouts and milestones."
        canonical="https://artifixhq.xyz/pricing"
        ogType="website"
        ogImage="/api/v1/og/pricing"
        ogImageAlt="Artifix Escrow Pricing"
        twitterCard="summary_large_image"
      />

      {/* ============================================================ */}
      {/* 1. HERO SECTION                                              */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/70 pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-3">
              ESCROW PRICING &amp; FEE TRANSPARENCY
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-[#141A16] leading-[1.1] tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Predictable pricing. Built for{' '}
              <span
                className="font-serif italic font-normal text-[#121814]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                honest trade.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#556259] leading-relaxed max-w-2xl font-normal">
              A flat 5% platform fee deducted only when work is completed and verified. No subscriptions, no hidden markups, and zero fees on refunded milestones.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. THREE CORE FEE PRINCIPLES                                 */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="text-2xl font-extrabold text-[#123E2A] mb-2 font-mono">
              5.0%
            </div>
            <h2 className="text-base font-bold text-[#141A16] mb-2">
              Flat Escrow Fee
            </h2>
            <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-normal">
              Covers identity verification, automated smart contract escrow, milestone tracking, and access to our neutral dispute tribunal.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="text-2xl font-extrabold text-[#123E2A] mb-2 font-mono">
              0%
            </div>
            <h2 className="text-base font-bold text-[#141A16] mb-2">
              Zero Upfront Paywalls
            </h2>
            <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-normal">
              Free to browse verified artisans, free to post jobs for clients, and free for artisans to bid on open opportunities across Nigeria.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="text-2xl font-extrabold text-[#123E2A] mb-2 font-mono">
              100%
            </div>
            <h2 className="text-base font-bold text-[#141A16] mb-2">
              Refund on Unexecuted Work
            </h2>
            <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-normal">
              If an artisan cancels or fails to start, 100% of the funds are unlocked and returned to the client with zero penalty fee.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE ESCROW FEE CALCULATOR                         */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 border border-stone-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          
          <div className="max-w-3xl mb-8">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-2">
              SIMULATE ESCROW PAYOUTS
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#141A16]"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Interactive Fee Calculator
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
              Adjust the contract budget to calculate artisan take-home earnings and milestone allocations.
            </p>
          </div>

          {/* Rail Selector Toggle */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs font-semibold text-stone-700">Settlement Rail:</span>
            <div className="inline-flex p-1 rounded-xl bg-[#FAF7F0] border border-stone-200">
              <button
                type="button"
                onClick={() => setPaymentRail('FIAT')}
                className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all ${
                  paymentRail === 'FIAT'
                    ? 'bg-[#123E2A] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Nigerian Naira (5.0%)
              </button>
              <button
                type="button"
                onClick={() => setPaymentRail('CRYPTO')}
                className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all ${
                  paymentRail === 'CRYPTO'
                    ? 'bg-[#123E2A] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Monad Crypto (2.5%)
              </button>
            </div>
          </div>

          {/* Amount Slider & Presets */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Total Contract Budget
              </label>
              <span className="text-xl sm:text-2xl font-bold text-[#123E2A] font-mono">
                {formatCurrency(contractAmount)}
              </span>
            </div>

            <input
              type="range"
              min={20000}
              max={2000000}
              step={10000}
              value={contractAmount}
              onChange={(e) => setContractAmount(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#123E2A]"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs text-stone-400 font-medium">Quick Amounts:</span>
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setContractAmount(preset)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                    contractAmount === preset
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {formatCurrency(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 sm:p-6 rounded-2xl bg-[#FAF7F0] border border-stone-200/80 mb-8">
            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Client Deposits in Escrow
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#141A16] font-mono mt-1">
                {formatCurrency(contractAmount)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">100% protected in smart contract</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Artisan Guaranteed Payout
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-800 font-mono mt-1">
                {formatCurrency(artisanPayout)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                {paymentRail === 'FIAT' ? '95.0%' : '97.5%'} net take-home upon approval
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Platform Escrow Fee
              </div>
              <div className="text-xl sm:text-2xl font-bold text-stone-700 font-mono mt-1">
                {formatCurrency(platformFee)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                {paymentRail === 'FIAT' ? '5.0%' : '2.5%'} verification &amp; arbitration
              </div>
            </div>
          </div>

          {/* 3-Stage Milestone Projection */}
          <div>
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
              Sample 3-Stage Milestone Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-[13px]">
              <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                <div className="text-stone-400 font-medium">Stage 1 (30%)</div>
                <div className="font-bold text-[#141A16] text-sm mt-0.5">{formatCurrency(m1)}</div>
                <div className="text-stone-500 text-[11px] mt-1">Initial mobilization &amp; materials setup</div>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                <div className="text-stone-400 font-medium">Stage 2 (40%)</div>
                <div className="font-bold text-[#141A16] text-sm mt-0.5">{formatCurrency(m2)}</div>
                <div className="text-stone-500 text-[11px] mt-1">Core physical installation / rough-in</div>
              </div>
              <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                <div className="text-stone-400 font-medium">Stage 3 (30%)</div>
                <div className="font-bold text-[#141A16] text-sm mt-0.5">{formatCurrency(m3)}</div>
                <div className="text-stone-500 text-[11px] mt-1">Final testing, inspection &amp; handover</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. COMPARISON TABLE: ARTIFIX VS ALTERNATIVES                 */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="max-w-3xl mb-8">
          <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-2">
            MODEL COMPARISON
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#141A16]"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            How Artifix compares to traditional hiring
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
            Why leading property managers and verified craftsmen use escrow instead of unbacked cash transfers.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200/70 overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
              <thead>
                <tr className="border-b border-stone-200 bg-[#FAF7F0] text-stone-600 font-bold">
                  <th className="py-4 px-5">Feature</th>
                  <th className="py-4 px-5">Informal Cash Transfers</th>
                  <th className="py-4 px-5">Classifieds (Jiji/OLX)</th>
                  <th className="py-4 px-5 text-[#123E2A] bg-emerald-50/50">Artifix Escrow Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-normal">
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#141A16]">Payment Security</td>
                  <td className="py-3.5 px-5 text-rose-700">0% (Lost if artisan vanishes)</td>
                  <td className="py-3.5 px-5 text-rose-700">0% (Direct deposit risk)</td>
                  <td className="py-3.5 px-5 font-bold text-[#123E2A] bg-emerald-50/30">100% Escrow Protected</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#141A16]">Artisan Identity Vetting</td>
                  <td className="py-3.5 px-5 text-stone-500">Unverified phone numbers</td>
                  <td className="py-3.5 px-5 text-stone-500">Self-reported profiles</td>
                  <td className="py-3.5 px-5 font-bold text-[#123E2A] bg-emerald-50/30">NIN, BVN &amp; Trade Tested</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#141A16]">Milestone Staging</td>
                  <td className="py-3.5 px-5 text-stone-500">Unenforced lump sums</td>
                  <td className="py-3.5 px-5 text-stone-500">None</td>
                  <td className="py-3.5 px-5 font-bold text-[#123E2A] bg-emerald-50/30">Contractual Work Proof</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#141A16]">Neutral Dispute Support</td>
                  <td className="py-3.5 px-5 text-rose-700">None (Police/Civil disputes)</td>
                  <td className="py-3.5 px-5 text-rose-700">No mediation</td>
                  <td className="py-3.5 px-5 font-bold text-[#123E2A] bg-emerald-50/30">48-Hour Dedicated Arbiter</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#141A16]">Fee Structure</td>
                  <td className="py-3.5 px-5 text-stone-500">Unpredictable markups</td>
                  <td className="py-3.5 px-5 text-stone-500">Ad listing fees</td>
                  <td className="py-3.5 px-5 font-bold text-[#123E2A] bg-emerald-50/30">Flat 5.0% on verified work</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. CANONICAL PLATFORM FAQ                                     */}
      {/* ============================================================ */}
      <FrequentlyAskedQuestions className="mt-12 sm:mt-16 border-t-0" />
    </div>
  );
};

export default PricingPage;
