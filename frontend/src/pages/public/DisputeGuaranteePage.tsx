import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  Scale,
  Camera,
  MapPin,
  Lock,
} from 'lucide-react';
import { SeoHead } from '../../components/seo/SeoHead';
import { FrequentlyAskedQuestions } from '../../components/common/FrequentlyAskedQuestions';

export const DisputeGuaranteePage: React.FC = () => {
  const [openPolicyIndex, setOpenPolicyIndex] = useState<number | null>(null);

  const policySections = [
    {
      title: '1. The 100% Zero-Dispute Deliverable Principle',
      content:
        'Escrow funds remain securely locked inside the contract until the client conducts physical inspection and signs off on the delivered milestone. An artisan cannot unilaterally withdraw funds before milestone verification, and a client cannot retrieve deposited escrow funds once work has been verifiably performed in accordance with the documented scope.',
    },
    {
      title: '2. Tier 1: 48-Hour Bilateral Cure Period',
      content:
        'When a defect or scope deficiency is flagged, an immediate 48-hour cure window opens. The client provides a specific punch-list inside the project workspace. The artisan is entitled to inspect and correct the defect without incurring arbitration fees or platform demerit points.',
    },
    {
      title: '3. Tier 2: Neutral Human Arbiter Review',
      content:
        'If bilateral resolution fails within 48 hours, either party may escalate to an Artifix Senior Trade Arbiter. Our arbiters are experienced building engineers and trade guild leaders. For contracts exceeding ₦500,000 within Lagos or Abuja, an accredited field officer conducts a physical site audit. A binding determination is issued within 48 business hours.',
    },
    {
      title: '4. Tier 3: Cryptographic Multi-Sig Execution',
      content:
        'Determinations are executed on-chain via Monad EVM smart contracts. The platform does not hold custody of funds in private bank accounts where they could be withheld indefinitely. Multi-sig cryptographic execution enforces either a full refund, full payout, or prorated split settlement in accordance with the formal arbiter ruling.',
    },
    {
      title: '5. Abandonment & Non-Performance Protocol',
      content:
        'If an artisan fails to check in on site within 48 hours of agreed commencement, or abandons an active milestone for more than 72 consecutive hours without notice, the contract is flagged as abandoned. 100% of remaining unexecuted milestone funds and platform fees are refunded to the client.',
    },
  ];

  return (
    <div className="w-full pb-20">
      <SeoHead
        title="Dispute Resolution & Deliverable Guarantee | Artifix"
        description="Understand how Artifix protects every milestone with our 3-tier arbitration tribunal, evidentiary standards, and smart contract escrow guarantees."
        canonical="https://artifix.app/guarantee"
        ogType="website"
        ogImage="/api/v1/og/guarantee"
        ogImageAlt="Artifix Dispute Resolution & Guarantee Policy"
        twitterCard="summary_large_image"
      />

      {/* ============================================================ */}
      {/* 1. HERO SECTION                                              */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/70 pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-3">
              SETTLEMENT INTEGRITY &amp; DISPUTE PROTOCOL
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-[46px] font-bold text-[#141A16] leading-[1.1] tracking-tight mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              The Artifix deliverable guarantee. Complete{' '}
              <span
                className="font-serif italic font-normal text-[#121814]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                peace of mind.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#556259] leading-relaxed max-w-2xl font-normal">
              Smart contracts hold the funds. Certified trade arbiters review the physical evidence. Unexecuted work is refunded, and verified labor is always paid.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. THE THREE-TIER ESCALATION TRIBUNAL                        */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
        <div className="max-w-3xl mb-8">
          <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-2">
            THREE-STAGE ARBITRATION
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#141A16]"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            How disputes are handled
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
            A structured path ensuring fair mediation without endless arguments or police involvement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          
          {/* Tier 1 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/80 text-stone-900 font-bold text-xs flex items-center justify-center mb-4">
                01
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                48-Hour Window
              </div>
              <h3 className="text-base font-bold text-[#141A16] mb-2">
                Bilateral Cure Period
              </h3>
              <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-normal">
                Client documents specific defects or omissions in the app. Artisan has 48 hours to correct the punch-list without penalties or arbitration fees.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 text-xs text-stone-500 font-medium">
              Over 80% of issues resolve here.
            </div>
          </div>

          {/* Tier 2 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-[#123E2A] text-white font-bold text-xs flex items-center justify-center mb-4">
                02
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                Neutral Arbiter
              </div>
              <h3 className="text-base font-bold text-[#141A16] mb-2">
                Independent Evidence Audit
              </h3>
              <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-normal">
                An accredited Artifix Trade Arbiter reviews geotagged photos, scope dockets, and chat history. Physical site visits conducted for large contracts.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 text-xs text-stone-500 font-medium">
              Binding ruling within 48 hours.
            </div>
          </div>

          {/* Tier 3 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center justify-center mb-4">
                03
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                Smart Contract
              </div>
              <h3 className="text-base font-bold text-[#141A16] mb-2">
                Multi-Sig Settlement
              </h3>
              <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-normal">
                Determination executes automatically on-chain. Escrow funds disburse immediately to the entitled party (refund or payout) with zero manual delay.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 text-xs text-stone-500 font-medium">
              Irrevocable execution.
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. EVIDENTIARY STANDARDS CHECKLIST                           */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-stone-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="max-w-3xl mb-8">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-2">
              PROOF OF WORK
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#141A16]"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Admissible Evidence Standards
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
              To ensure objective determinations, our arbiters rely strictly on verifiable records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Admissible */}
            <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/70">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Admissible Supporting Evidence</span>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-stone-700 font-normal">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Geotagged &amp; timestamped photographs of site condition before work started and after delivery.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Signed physical scope docket or digital milestone handover approval inside the Artifix app.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Direct project chat logs and recorded voice notes held inside the encrypted platform workspace.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">•</span>
                  <span>Verifiable merchant store invoices for client-funded building supplies and raw materials.</span>
                </li>
              </ul>
            </div>

            {/* Inadmissible */}
            <div className="p-5 sm:p-6 rounded-2xl bg-stone-50 border border-stone-200/70">
              <div className="flex items-center gap-2 font-bold text-sm text-stone-900 mb-3">
                <AlertTriangle className="w-4 h-4 text-stone-600" />
                <span>Inadmissible Claims &amp; Grounds</span>
              </div>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-stone-600 font-normal">
                <li className="flex items-start gap-2">
                  <span className="text-stone-400 font-bold">•</span>
                  <span>Verbal changes or informal cash side-deals arranged outside the documented contract specification.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-400 font-bold">•</span>
                  <span>Subjective aesthetic preferences not specified in original contract scopes or material schedules.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-400 font-bold">•</span>
                  <span>Delays caused by client failure to provide site access, power, or necessary installation keys.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-stone-400 font-bold">•</span>
                  <span>Normal wear and tear occurring after the formal inspection sign-off window has elapsed.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. POLICY TERMS ACCORDION                                    */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-xl sm:text-2xl font-bold text-[#141A16] text-center mb-8"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Policy Terms &amp; Detailed Clauses
          </h2>

          <div className="space-y-3">
            {policySections.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-stone-200/70 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenPolicyIndex(openPolicyIndex === idx ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#141A16]"
                >
                  <span>{item.title}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                      openPolicyIndex === idx ? 'rotate-180 text-[#123E2A]' : ''
                    }`}
                  />
                </button>
                {openPolicyIndex === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-[13px] text-[#556259] leading-relaxed border-t border-stone-100 pt-3">
                    {item.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-[#123E2A] hover:bg-[#0E3222] text-white text-xs sm:text-[13px] font-semibold px-6 py-3 rounded-xl transition-all shadow-sm"
            >
              <span>Contact Dispute Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/security"
              className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-[#141A16] border border-stone-200 text-xs sm:text-[13px] font-semibold px-6 py-3 rounded-xl transition-all"
            >
              <span>Review Smart Contract Audit</span>
            </Link>
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

export default DisputeGuaranteePage;
