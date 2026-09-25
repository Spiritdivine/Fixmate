import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Cpu,
  Server,
  KeyRound,
  FileCheck2,
  Bug,
  ArrowRight,
} from 'lucide-react';
import { SeoHead } from '../../components/seo/SeoHead';

export const SecurityAndAuditPage: React.FC = () => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const contractAddress = '0x8fB32C11d279E48fA176B2d294821a9E152864C9';

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const auditFindings = [
    {
      severity: 'Critical',
      count: 0,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      status: 'Clean (None Found)',
    },
    {
      severity: 'High',
      count: 0,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      status: 'Clean (None Found)',
    },
    {
      severity: 'Medium',
      count: 2,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      status: '2 Remediated & Verified in v2.4',
    },
    {
      severity: 'Low / Info',
      count: 3,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      status: '3 Resolved & Merged',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#141A16] font-sans antialiased selection:bg-[#123E2A] selection:text-white pb-24">
      <SeoHead
        title="Security & Smart Contract Audit | Artifix Dual-Rail Escrow"
        description="Review the Monad EVM escrow smart contract architecture, dual-rail fiat & crypto security protocols, automated milestone settlement, and verified audit report for Artifix."
        canonical="https://artifixhq.xyz/security"
        ogType="website"
        ogImage="/api/v1/og/default"
        ogImageAlt="Artifix Security & Smart Contract Escrow Audit"
        twitterCard="summary_large_image"
      />
      {/* ============================================================ */}
      {/* 1. HERO SECTION & AUDIT STATUS BAR                           */}
      {/* ============================================================ */}
      <section className="w-full bg-[#FAF7F0] border-b border-stone-200/80 pt-12 sm:pt-16 pb-12 sm:pb-16">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#141A16] tracking-tight leading-[1.12] mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Security &amp; Smart{' '}
              <span
                className="font-serif italic font-normal text-[#123E2A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Contract Audit
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-8">
              Artifix combines Central Bank of Nigeria (CBN) regulated bank escrow vaults with high-throughput Monad blockchain smart contracts. Explore our verified contracts, security audit scorecards, and bug bounty policy.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-stone-200/80">
            <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Audit Score</span>
              <span className="text-lg sm:text-xl font-extrabold text-[#123E2A] flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>99.4% Pass</span>
              </span>
              <p className="text-[11px] text-stone-500 mt-1">Formal verification completed</p>
            </div>

            <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Contract Engine</span>
              <span className="text-lg sm:text-xl font-extrabold text-[#141A16]">
                Monad EVM
              </span>
              <p className="text-[11px] text-stone-500 mt-1">Solidity 0.8.24 • Upgradeable</p>
            </div>

            <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Fiat Custody</span>
              <span className="text-lg sm:text-xl font-extrabold text-[#141A16]">
                NDIC Insured
              </span>
              <p className="text-[11px] text-stone-500 mt-1">Tier-1 Nigerian partner banks</p>
            </div>

            <div className="p-4 bg-white border border-stone-200/80 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Bug Bounty</span>
              <span className="text-lg sm:text-xl font-extrabold text-[#123E2A]">
                Up to ₦2.5M
              </span>
              <p className="text-[11px] text-stone-500 mt-1">Responsible disclosure program</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. SMART CONTRACT SPECIFICATION & AUDIT CARD                 */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Contract Explorer Card */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#0D1815] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-950/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#123E2A]/30 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-5">
                

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    ArtifixEscrowVault.sol
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                    Decentralized milestone holding logic with reentrancy protection, timelock multi-sig release, and automated tribunal arbitration gates.
                  </p>
                </div>

                {/* Contract Address Box */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="font-mono text-xs text-emerald-400 truncate select-all">
                    {contractAddress}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                    title="Copy contract address"
                  >
                    {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Technical Attributes */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Compiler</span>
                    <span className="font-mono text-white font-semibold">Solidity 0.8.24</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">EVM Network</span>
                    <span className="font-mono text-white font-semibold">Monad Mainnet</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Proxy Pattern</span>
                    <span className="font-mono text-white font-semibold">ERC-1967 UUPS</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Multi-Sig Timelock</span>
                    <span className="font-mono text-white font-semibold">48-Hour Delay</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Cryptographic Proof of Work Card */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#123E2A] uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-[#123E2A]" />
                <span>SHA-256 Proof of Work Hashing</span>
              </div>
              <h4 className="text-base font-bold text-[#141A16]">
                Immutable Evidence Protection
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                When an artisan submits on-site milestone progress photos or pressure-test videos, Artifix computes a cryptographic SHA-256 hash immediately upon upload. This hash is embedded into the smart contract docket so neither party can alter evidence during an arbitration review.
              </p>
            </div>
          </div>

          {/* Right Column: Audit Findings & Remediation Log */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-stone-200 pb-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  <FileCheck2 className="w-4 h-4 text-[#123E2A]" />
                  <span>Independent Audit Report</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#141A16]">
                  Security Audit Findings Summary
                </h3>
              </div>

              {/* Findings Matrix */}
              <div className="space-y-3">
                {auditFindings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-stone-200/80 flex items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${finding.badgeColor}`}>
                        {finding.severity} ({finding.count})
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-stone-700 text-right">
                      {finding.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Remediation Details */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Key Remediations in v2.4 Release
                </h4>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-600 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-stone-900">
                    1. ReentrancyGuard on Partial Milestone Releases:
                  </p>
                  <p>
                    Replaced non-reentrant modifier with custom mutex lock to guarantee zero reentrancy risk during multi-milestone payouts across simultaneous contracts.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-600 space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-stone-900">
                    2. Emergency Circuit Breaker Multi-Sig Threshold:
                  </p>
                  <p>
                    Restricted contract pause execution to a 3-of-5 hardware key multi-sig council with an automated 48-hour timelock on non-critical parameter changes.
                  </p>
                </div>
              </div>

            </div>

            {/* Bug Bounty Policy */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#123E2A] uppercase tracking-wider">
                <Bug className="w-4 h-4 text-[#123E2A]" />
                <span>Vulnerability Disclosure Program</span>
              </div>
              <h3 className="text-lg font-bold text-[#141A16]">
                Responsible Bug Bounty Program
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                Artifix rewards ethical security researchers for identifying vulnerabilities in our smart contracts, API endpoints, or escrow release mechanics.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Critical</span>
                  <span className="text-xs font-extrabold text-[#123E2A]">₦2,500,000</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">High</span>
                  <span className="text-xs font-extrabold text-[#123E2A]">₦750,000</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Medium</span>
                  <span className="text-xs font-extrabold text-[#123E2A]">₦250,000</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Low</span>
                  <span className="text-xs font-extrabold text-[#123E2A]">₦75,000</span>
                </div>
              </div>

              <div className="pt-2 text-xs">
                <span>Submit findings with reproduction steps to: </span>
                <a href="mailto:security@artifix.ng" className="font-bold text-[#123E2A] underline">
                  security@artifix.ng
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. NAVIGATION FOOTER LINKS                                   */}
      {/* ============================================================ */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="p-6 bg-white border border-stone-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-stone-500">
          <span>Explore Related Documentation:</span>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-[#123E2A] hover:underline flex items-center gap-1">
              <span>Terms of Service &amp; Escrow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span>&bull;</span>
            <Link to="/privacy" className="text-[#123E2A] hover:underline flex items-center gap-1">
              <span>Privacy Policy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
