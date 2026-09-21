import React from 'react';
import { Link } from 'react-router-dom';

export const TrustInfrastructureSection: React.FC = () => {
  return (
    <section id="about" className="w-full py-16 sm:py-20 lg:py-24 bg-[#0D1815] text-white relative overflow-hidden">
      {/* Additional anchor for #trust */}
      <div id="trust" className="absolute -top-12" />

      {/* Decorative background glow accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#123E2A]/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#836EF9]/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-[760px] mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-[11px] font-bold tracking-[0.18em] uppercase mb-3.5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            DUAL-RAIL TRUST &amp; ESCROW INFRASTRUCTURE
          </div>

          <h2 
            className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-white leading-[1.12] tracking-[-0.02em] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Bank-grade fiat security meets{' '}
            <span 
              className="font-serif italic font-normal text-emerald-400"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              blockchain transparency
            </span>.
          </h2>

          <p className="text-sm sm:text-base text-stone-300 leading-[1.65] font-normal">
            You do not need to understand blockchain mechanics to enjoy the safest home service infrastructure in Africa. Artifix bridges familiar Nigerian bank rails with Monad EVM smart contracts.
          </p>
        </div>

        {/* 3 Pillar Infrastructure Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 mb-12 sm:mb-16">
          
          {/* Pillar 1: Local Fiat Rails */}
          <div className="bg-[#14221D] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between hover:bg-[#182a24] transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white text-stone-900 flex items-center justify-center font-extrabold text-lg mb-6 shadow-sm">
                ₦
              </div>
              <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full mb-2">
                Frictionless Local Payments
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Nigerian Naira (NGN) Rails
              </h3>
              <p className="text-xs sm:text-[13px] text-stone-300 leading-relaxed mb-6">
                Fund your escrow milestone in seconds using debit cards (Mastercard, Visa, Verve) or direct bank transfer. Settled immediately upon milestone approval into any Nigerian commercial bank.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/5 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Zero crypto or wallet required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Instant bank account credits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Automated dispute hold &amp; refunds</span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Monad Web3 Rails */}
          <div className="bg-[#14221D] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between hover:bg-[#182a24] transition-colors relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#836EF9]/10 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#836EF9] text-white flex items-center justify-center font-extrabold text-sm mb-6 shadow-sm">
                <span className="w-3 h-3 rounded-full border-2 border-white" />
              </div>
              <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#836EF9] bg-[#836EF9]/20 px-2.5 py-0.5 rounded-full mb-2">
                Decentralized Escrow
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Monad Blockchain Rails (MON)
              </h3>
              <p className="text-xs sm:text-[13px] text-stone-300 leading-relaxed mb-6">
                Programmatic smart contracts executing on Monad EVM with 10,000 TPS and sub-second finality. Ideal for diaspora Nigerians funding property builds from abroad without wire delays.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/5 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span className="text-[#836EF9] font-bold">✓</span>
                <span>Sub-second settlement speed (0.8s)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#836EF9] font-bold">✓</span>
                <span>Near-zero gas fees (&lt; $0.001)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#836EF9] font-bold">✓</span>
                <span>Zero diaspora remittance deductions</span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Proof-of-Work Vault */}
          <div className="bg-[#14221D] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between hover:bg-[#182a24] transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-6 h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full mb-2">
                Cryptographic Audit
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Proof-of-Work Vault
              </h3>
              <p className="text-xs sm:text-[13px] text-stone-300 leading-relaxed mb-6">
                Milestone scopes, site coordinates, and time-stamped visual proofs are permanently anchored to the contract docket. Tamper-proof records mean zero arguments when milestones are delivered.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/5 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Geotagged &amp; timestamped inspection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Binding dispute docket evidence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Permanent portable artisan reputation</span>
              </div>
            </div>
          </div>

        </div>

        {/* Live Network Telemetry Bar */}
        <div className="bg-[#182622] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-stone-300">
              Monad EVM Smart Contracts (Chain ID 10143)
            </span>
            <span className="hidden sm:inline text-stone-600">|</span>
            <span className="hidden sm:inline text-stone-400">
              Contract: <span className="font-mono text-emerald-400">0x742d...44e</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-stone-400 font-mono text-[11px]">
            <span>Throughput: <strong className="text-white">10,000 TPS</strong></span>
            <span>Finality: <strong className="text-white">&lt; 1s</strong></span>
            <span>Status: <strong className="text-emerald-400">100% Operational</strong></span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TrustInfrastructureSection;
