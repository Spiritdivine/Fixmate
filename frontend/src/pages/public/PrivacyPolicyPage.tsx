import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  Eye,
  Server,
  Database,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('scope');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Privacy Policy & NDPA Data Protection | Artifix Nigeria';
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { id: 'scope', title: '1. Scope & Data Controller' },
    { id: 'collection', title: '2. Personal Data We Collect' },
    { id: 'biometrics', title: '3. BVN & NIN Identity Safeguards' },
    { id: 'blockchain', title: '4. On-Chain Privacy on Monad' },
    { id: 'usage', title: '5. Purpose & Legal Basis' },
    { id: 'retention', title: '6. Retention & Deletion Rights' },
    { id: 'cookies', title: '7. Cookies & Telemetry' },
    { id: 'contact', title: '8. DPO & Regulatory Contact' },
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
              Privacy Policy &amp;{' '}
              <span
                className="font-serif italic font-normal text-[#123E2A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Data Protection
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">
              Learn how Artifix Technologies Limited collects, encrypts, and protects your personal data, job site coordinates, biometric verifications, and on-chain cryptographic transaction records.
            </p>

            {/* Document Metadata Bar */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-500 pt-2 border-t border-stone-200/70">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Last Updated: September 24, 2026</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                <span>Docket Ref: ATX-PRIV-2026.02</span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 font-semibold text-[#123E2A] hover:underline cursor-pointer ml-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Policy</span>
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
          
          {/* Left Sidebar: Table of Contents */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 px-1">
                Policy Sections
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

            {/* DPO Contact Card */}
            <div className="bg-[#0E2C1E] text-white rounded-2xl p-5 border border-emerald-900/40 space-y-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#34d399] uppercase tracking-wider">
                <Fingerprint className="w-4 h-4 text-[#34d399]" />
                <span>Data Protection Officer</span>
              </div>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Appointed in accordance with Nigeria Data Protection Commission (NDPC) requirements.
              </p>
              <div className="pt-2 text-xs font-semibold">
                <a
                  href="mailto:dpo@artifix.ng"
                  className="inline-flex items-center gap-1.5 text-white hover:text-emerald-200 transition-colors"
                >
                  <span>dpo@artifix.ng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </aside>

          {/* Right Column: In-Depth Privacy Articles */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-12 sm:space-y-16">
            
            {/* Article 1 */}
            <article id="scope" className="space-y-4 pt-2">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 1
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  1. Scope &amp; Designated Data Controller
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                This Privacy Policy applies to all services, web applications, and APIs provided by <strong>Artifix Technologies Limited</strong> (&ldquo;Artifix&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). Artifix operates as the designated Data Controller under the <strong>Nigeria Data Protection Act (NDPA 2023)</strong> and follows international privacy frameworks (including GDPR where applicable).
              </p>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                We believe privacy is an essential human right, especially in Africa’s informal service sector. We never sell, rent, or trade your personal or contact information to third-party marketing brokers.
              </p>
            </article>

            {/* Article 2 */}
            <article id="collection" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 2
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  2. Personal Data We Collect
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                We only collect data necessary to provide reliable artisan matching, escrow protection, and legal dispute defense:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#123E2A]">For Clients &amp; Homeowners</h4>
                  <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Full Name and primary contact email/phone number.</li>
                    <li>Job site delivery address and approximate GPS coordinates for local artisan matching.</li>
                    <li>Project scope descriptions, uploaded task photos, and milestone funding records.</li>
                  </ul>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#123E2A]">For Verified Artisans</h4>
                  <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Full Name, business trade name, and physical workshop/operating LGA.</li>
                    <li>Government Identity Number (NIN) and Bank Verification Number (BVN) for verification.</li>
                    <li>Trade qualifications, apprenticeship certificates, and portfolio before/after proof images.</li>
                    <li>Commercial bank payout account details (Account Name &amp; NUBAN).</li>
                  </ul>
                </div>
              </div>
            </article>

            {/* Article 3 */}
            <article id="biometrics" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 3
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  3. BVN &amp; NIN Identity Verification Safeguards
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                Artifix takes identity verification seriously to eradicate rogue operators without compromising artisan privacy:
              </p>
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-2 text-xs sm:text-sm text-emerald-950">
                <div className="flex items-center gap-2 font-bold text-[#123E2A]">
                  <Lock className="w-4 h-4 text-[#123E2A]" />
                  <span>Zero Raw Biometric Storage Policy</span>
                </div>
                <p className="leading-relaxed">
                  Your Bank Verification Number (BVN) and National Identity Number (NIN) are queried through licensed Central Bank of Nigeria (CBN) verification partners solely to confirm name consistency, account ownership, and facial identity match. <strong>Artifix does not store raw BVN credentials or fingerprint records on our production databases.</strong>
                </p>
              </div>
            </article>

            {/* Article 4 */}
            <article id="blockchain" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 4
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  4. On-Chain Privacy on the Monad Blockchain
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                Artifix utilizes the high-throughput Monad blockchain for smart contract escrow settlement. We maintain a strict boundary between public blockchain data and private personal information:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                  <span className="text-xs font-bold text-[#123E2A] flex items-center gap-1.5 mb-2">
                    <Database className="w-4 h-4 text-[#123E2A]" />
                    <span>Public On-Chain Data</span>
                  </span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Milestone contract dockets, deposit/release state hashes, cryptographic timestamps, and public wallet addresses. <strong>No names, phone numbers, or physical addresses are ever recorded on-chain.</strong>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-stone-200/80 shadow-xs">
                  <span className="text-xs font-bold text-[#123E2A] flex items-center gap-1.5 mb-2">
                    <Server className="w-4 h-4 text-[#123E2A]" />
                    <span>Private Off-Chain Storage</span>
                  </span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    User chat logs, full residential addresses, KYC submission documents, and invoice PDFs are encrypted at rest with AES-256 in secure, restricted data centers.
                  </p>
                </div>
              </div>
            </article>

            {/* Article 5 */}
            <article id="usage" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 5
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  5. Purpose of Processing &amp; Legal Basis
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                Under Section 25 of the NDPA 2023, Artifix processes data on the legal bases of:
              </p>
              <ul className="space-y-2.5 pl-4 text-sm sm:text-[15px] text-stone-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#123E2A] mt-1 shrink-0" />
                  <span>
                    <strong>Contractual Necessity:</strong> To create binding milestone escrow vaults, coordinate on-site artisan arrivals, and execute bank payouts upon inspection.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#123E2A] mt-1 shrink-0" />
                  <span>
                    <strong>Legal &amp; Regulatory Compliance:</strong> Anti-money laundering (AML) audits, tax reporting compliance, and identity screening mandated by regulatory authorities.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#123E2A] mt-1 shrink-0" />
                  <span>
                    <strong>Legitimate Interest:</strong> Preventing fraudulent project claims, detecting duplicate identity profiles, and improving platform reliability.
                  </span>
                </li>
              </ul>
            </article>

            {/* Article 6 */}
            <article id="retention" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 6
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  6. Data Retention &amp; Right to Erasure
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                Users retain full rights under Nigerian law to access, rectify, port, or request erasure of their personal information. Financial ledger records must be retained for 6 years in accordance with Central Bank of Nigeria financial recordkeeping laws, after which they are permanently anonymized.
              </p>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                To request an export of your data docket or invoke account erasure, submit a request directly to our Data Protection Officer at <a href="mailto:dpo@artifix.ng" className="text-[#123E2A] font-semibold underline">dpo@artifix.ng</a>.
              </p>
            </article>

            {/* Article 7 */}
            <article id="cookies" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 7
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  7. Cookies &amp; Privacy-Preserving Telemetry
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                We use strictly essential session cookies to authenticate logged-in sessions and remember user preferences. We use self-hosted PostHog product telemetry with IP anonymization enabled. We do not use cross-site behavioral tracking cookies, Facebook pixels, or third-party advertising trackers.
              </p>
            </article>

            {/* Article 8 */}
            <article id="contact" className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#123E2A]">
                  Section 8
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#141A16] mt-1">
                  8. Supervisory Authority &amp; Contact
                </h2>
              </div>
              <p className="text-sm sm:text-[15px] text-stone-700 leading-relaxed">
                If you believe your data has been handled contrary to statutory requirements, you possess the legal right under the NDPA 2023 to lodge a formal complaint with the <strong>Nigeria Data Protection Commission (NDPC)</strong> (www.ndpc.gov.ng).
              </p>
              <div className="pt-6 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-stone-500">
                <Link to="/terms" className="text-[#123E2A] hover:underline flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Terms of Service</span>
                </Link>
                <Link to="/security" className="text-[#123E2A] hover:underline flex items-center gap-1">
                  <span>Security &amp; Smart Contract Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>

          </main>
        </div>
      </div>
    </div>
  );
};
