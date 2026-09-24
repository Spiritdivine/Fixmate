import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Printer,
  Scale,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('regulatory');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Terms of Service & Escrow Agreement | Artifix Nigeria';
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { id: 'regulatory', title: '1. Regulatory Framework & Parties' },
    { id: 'escrow', title: '2. Dual-Rail Milestone Escrow' },
    { id: 'vetting', title: '3. Artisan Vetting & 14-Day Warranty' },
    { id: 'inspection', title: '4. Client Obligations & 48-Hr Review' },
    { id: 'disputes', title: '5. Dispute Arbitration Tribunal' },
    { id: 'prohibited', title: '6. Anti-Circumvention & Conduct' },
    { id: 'fees', title: '7. Fee Schedule & Payouts' },
    { id: 'liability', title: '8. Liability & Force Majeure' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#141A16] font-sans antialiased selection:bg-[#123E2A] selection:text-white pb-24">
      {/* ============================================================ */}
      {/* 1. EDITORIAL HEADER & METADATA                               */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/80 pt-12 sm:pt-16 pb-10 sm:pb-14">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#141A16] tracking-tight leading-[1.12] mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Terms of Service &amp;{' '}
              <span
                className="font-serif italic font-normal text-[#123E2A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Escrow Agreement
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">
              This binding agreement governs your rights and obligations when hiring or delivering skilled craftsmanship, funding milestone escrow vaults, and resolving service dockets through Artifix Technologies Limited.
            </p>

            {/* Document Metadata Bar */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-500 pt-2 border-t border-stone-200/70">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Last Updated: September 24, 2026</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                <span>Docket Ref: ATX-TOS-2026.04</span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 font-semibold text-[#123E2A] hover:underline cursor-pointer ml-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. MAIN CONTENT + STICKY TABLE OF CONTENTS                   */}
      {/* ============================================================ */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Sidebar: Table of Contents (Sticky on Desktop) */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 px-1">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveSection(section.id)}
                    className={`block py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-[#123E2A]/10 text-[#123E2A] font-bold'
                        : 'text-stone-600 hover:text-[#141A16] hover:bg-stone-100/60'
                    }`}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Resolution Desk Card */}
            <div className="bg-[#0E2C1E] text-white rounded-2xl p-5 border border-emerald-900/40 space-y-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#34d399] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#34d399]" />
                <span>Legal Resolution Desk</span>
              </div>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Have questions regarding milestone releases or arbitration dockets? Contact our legal compliance team directly.
              </p>
              <div className="pt-2 text-xs font-semibold">
                <a
                  href="mailto:legal@artifix.ng"
                  className="inline-flex items-center gap-1.5 text-white hover:text-emerald-200 transition-colors"
                >
                  <span>legal@artifix.ng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </aside>

          {/* Right Column: In-Depth Legal Articles */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-12 sm:space-y-16">
            
            {/* Article 1 */}
            <article id="regulatory" className="space-y-4 pt-2">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 1
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  1. Regulatory Framework &amp; Contracting Parties
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                These Terms of Service constitute a legally enforceable agreement entered into between you (either as a &ldquo;Client / Homeowner&rdquo; or a &ldquo;Verified Artisan / Tradesman&rdquo;) and <strong>Artifix Technologies Limited</strong>, a corporation incorporated under the Companies and Allied Matters Act (CAMA 2020) of the Federal Republic of Nigeria.
              </p>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                All platform contracts, escrow arrangements, and dispute resolutions are governed by the substantive laws of the Federal Republic of Nigeria, including the Federal Competition and Consumer Protection Act (FCCPA 2018), the Nigerian Communications Act, and the Nigeria Data Protection Act (NDPA 2023).
              </p>
            </article>

            {/* Article 2 */}
            <article id="escrow" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 2
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  2. Dual-Rail Milestone Escrow System
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                Artifix operates a proprietary dual-rail financial escrow infrastructure. To ensure complete mutual safety across the informal economy, all service dockets are funded upfront into a neutral escrow vault before physical work commences:
              </p>
              <ul className="space-y-3 pl-4 text-sm sm:text-[15px] text-stone-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#123E2A] mt-1 shrink-0" />
                  <span>
                    <strong>Fiat NGN Rail:</strong> Naira funds deposited via debit card, instant bank transfer (NIP), or USSD are held in segregated, NDIC-insured escrow reserve accounts with licensed commercial bank partners.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#123E2A] mt-1 shrink-0" />
                  <span>
                    <strong>Monad Blockchain Rail:</strong> Cryptocurrency settlements are locked into audited, non-custodial smart contracts deployed on the Monad network with cryptographic milestone release conditions.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#123E2A] mt-1 shrink-0" />
                  <span>
                    <strong>Irrevocable Protection:</strong> Once funded, milestone deposits cannot be unilaterally withdrawn by the client nor claimed by the artisan until verified completion or formal tribunal determination.
                  </span>
                </li>
              </ul>
            </article>

            {/* Article 3 */}
            <article id="vetting" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 3
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  3. Artisan Vetting, Verification &amp; 14-Day Workmanship Warranty
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                Every artisan exhibiting the &ldquo;NIN/BVN Verified&rdquo; badge has submitted government identification validated through licensed identity verification partners, verified their workshop or physical LGA address, and agreed to platform workmanship standards.
              </p>
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-2 text-xs sm:text-sm text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-[#123E2A]">
                  
                  <span>Mandatory 14-Day Defect Rectification Warranty</span>
                </div>
                <p className="leading-relaxed">
                  All completed and released milestones carry a mandatory 14-calendar-day warranty. If a defect arising from substandard craftsmanship or improper installation appears within 14 days of sign-off, the artisan is legally obligated to return to the site and rectify the fault at zero additional labor cost to the client.
                </p>
              </div>
            </article>

            {/* Article 4 */}
            <article id="inspection" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 4
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  4. Client Obligations &amp; Mandatory 48-Hour Inspection Window
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                Clients agree to provide safe site access, timely utility provision (water/electricity where needed), and clear initial deliverables. Upon the artisan uploading completed milestone proof (photos, test videos, or handover dockets):
              </p>
              <ul className="space-y-2.5 pl-4 text-sm sm:text-[15px] text-stone-700">
                <li className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#123E2A] mt-2 shrink-0" />
                  <span>
                    <strong>48-Hour Review Period:</strong> The client has exactly 48 hours to physically inspect the work and either approve the release or log a revision request with photo evidence.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#123E2A] mt-2 shrink-0" />
                  <span>
                    <strong>Automated Safeguard Release:</strong> If a client fails to approve or lodge a dispute within 48 hours following verified milestone submission and SMS/email notification, the escrow system automatically releases payment to protect artisans from abandonment.
                  </span>
                </li>
              </ul>
            </article>

            {/* Article 5 */}
            <article id="disputes" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 5
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  5. Dispute Arbitration Tribunal Protocol
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                In the event of disagreement regarding milestone completion quality or scope deviations, either party may elevate the docket to the Artifix Arbitration Tribunal.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                  <span className="text-xs font-bold text-[#123E2A] block mb-1">Phase 1: Evidence Audit</span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Comparison of original contract docket terms against time-stamped milestone photos and video proof logs.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                  <span className="text-xs font-bold text-[#123E2A] block mb-1">Phase 2: Site Survey</span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    For major structural or electrical projects, an independent senior master artisan is dispatched to conduct physical verification.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                  <span className="text-xs font-bold text-[#123E2A] block mb-1">Phase 3: Binding Release</span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Tribunal determines full payout, partial equitable split, or complete refund to client escrow account.
                  </p>
                </div>
              </div>
            </article>

            {/* Article 6 */}
            <article id="prohibited" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 6
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  6. Anti-Circumvention Policy &amp; Prohibited Conduct
                </h2>
              </div>
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs sm:text-sm text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Strict Zero-Circumvention Rule</span>
                </div>
                <p className="leading-relaxed">
                  Clients and artisans discovered soliciting, agreeing, or making cash advances outside the Artifix escrow vault forfeit all platform dispute protections, 14-day defect warranties, and insurance coverage. Violators face permanent account blacklisting and forfeiture of pending platform credits.
                </p>
              </div>
            </article>

            {/* Article 7 */}
            <article id="fees" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 7
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  7. Platform Fee Schedule &amp; Payout Settlements
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                Artifix operates with total transparency in fee structures:
              </p>
              <ul className="space-y-2.5 pl-4 text-sm sm:text-[15px] text-stone-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#123E2A] mt-1 shrink-0" />
                  <span>
                    <strong>Artisans:</strong> 100% free registration, zero proposal bidding fees, and zero hidden deductions. Artisans receive their exact quoted rate.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#123E2A] mt-1 shrink-0" />
                  <span>
                    <strong>Platform Service Fee:</strong> A transparent 3% escrow processing fee is calculated at docket funding to maintain vault infrastructure, dispute tribunals, and biometric identity verification.
                  </span>
                </li>
              </ul>
            </article>

            {/* Article 8 */}
            <article id="liability" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 8
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  8. Limitation of Liability &amp; Force Majeure
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                Neither Artifix Technologies Limited nor participating artisans shall be held liable for milestone delivery delays resulting from events beyond reasonable commercial control, including raw building material supply chain price shocks, severe weather disruptions, national telecommunications outages, or municipal regulatory shutdowns.
              </p>
              <div className="pt-6 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-stone-500">
                <span>Next Document:</span>
                <div className="flex items-center gap-4">
                  <Link to="/privacy" className="text-[#123E2A] hover:underline flex items-center gap-1">
                    <span>Privacy Policy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span>&bull;</span>
                  <Link to="/security" className="text-[#123E2A] hover:underline flex items-center gap-1">
                    <span>Security &amp; Smart Contract Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>

          </main>
        </div>
      </div>
    </div>
  );
};
