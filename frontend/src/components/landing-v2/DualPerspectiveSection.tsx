import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const DualPerspectiveSection: React.FC = () => {
  const [activePerspective, setActivePerspective] = useState<'artisan' | 'client'>('artisan');

  return (
    <section 
      id="for-customers" 
      className="w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-[#F7F5EE] border-t border-stone-200/60 relative overflow-hidden"
    >
      {/* Target anchor for For Artisans */}
      <div id="for-artisans" className="absolute -top-12" />

      {/* Subtle organic ambient backdrop glow */}
      <div className="absolute top-1/4 right-0 w-[580px] h-[580px] bg-[#1E573B]/[0.03] rounded-full filter blur-[120px] pointer-events-none -z-0" />
      <div className="absolute bottom-10 left-10 w-[420px] h-[420px] bg-[#D4E2D7]/20 rounded-full filter blur-[100px] pointer-events-none -z-0" />

      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 xl:gap-14 items-center">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: Editorial Copy, Switcher, Features, CTA     */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start w-full">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#EAE5D8] border border-[#DDD6C5] text-[#243B2E] text-[10px] sm:text-[11px] font-bold tracking-[0.10em] sm:tracking-[0.14em] uppercase mb-4 sm:mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4D36]" />
              BUILT FOR BOTH SIDES OF THE HANDSHAKE
            </div>

            {/* Editorial Serif Heading */}
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] xl:text-[58px] font-bold text-[#112319] leading-[1.08] sm:leading-[1.05] tracking-[-0.03em] mb-4 sm:mb-5"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Trust protects <br />
              <span className="italic font-normal">every participant.</span>
            </h2>

            {/* Subtitle Description */}
            <p 
              className="text-xs sm:text-sm md:text-base text-[#4D5A52] leading-[1.6] sm:leading-[1.65] font-normal max-w-[510px] mb-6 sm:mb-8"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
            >
              Whether you are maintaining a family home or scaling your trade business, Artifix gives you the certainty and dignity you deserve.
            </p>

            {/* Interactive Perspective Switcher Pill (Segmented Control on Mobile) */}
            <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex p-1 rounded-full bg-[#EAE6DA] border border-[#DDD7C8] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] mb-6 sm:mb-8">
              <button
                type="button"
                onClick={() => setActivePerspective('client')}
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm font-semibold transition-all duration-200 text-center ${
                  activePerspective === 'client'
                    ? 'bg-[#0C2B22] text-white shadow-md'
                    : 'text-[#3B4D41] hover:text-[#0C2B22]'
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
              >
                {/* Home icon */}
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span className="truncate">For Homeowners</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePerspective('artisan')}
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm font-semibold transition-all duration-200 text-center ${
                  activePerspective === 'artisan'
                    ? 'bg-[#0C2B22] text-white shadow-md'
                    : 'text-[#3B4D41] hover:text-[#0C2B22]'
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
              >
                {/* Construction Hardhat Icon */}
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a7.5 7.5 0 00-7.5 7.5v2.25h15V10.5A7.5 7.5 0 0012 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75h19.5v1.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-1.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9.75" />
                </svg>
                <span className="truncate">For Artisans</span>
              </button>
            </div>

            {/* Feature Cards Stack */}
            <div className="w-full flex flex-col gap-3 sm:gap-3.5 mb-6 sm:mb-8">
              {activePerspective === 'artisan' ? (
                <>
                  {/* Artisan Card 1: 100% Guaranteed Payment Payouts (Active / Highlighted) */}
                  <div className="w-full bg-white rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all relative overflow-hidden flex items-start sm:items-center justify-between gap-3 sm:gap-4 group">
                    {/* Left active green indicator bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0C2B22] rounded-l-[18px] sm:rounded-l-[22px]" />

                    <div className="flex items-start gap-3.5 sm:gap-5 pl-1 sm:pl-1.5">
                      {/* Shield icon in sage square */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-[#E1ECE4] text-[#0C2B22] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div>
                        <h3 
                          className="text-sm sm:text-base md:text-[17px] font-bold text-[#112319] mb-1 sm:mb-1.5 leading-snug"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          100% Guaranteed Payment Payouts
                        </h3>
                        <p 
                          className="text-xs sm:text-[13px] text-[#556259] leading-[1.55] sm:leading-[1.65]"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Funds are fully deposited into escrow before you purchase project materials or begin labor. No more chasing clients for months or hearing “the director hasn’t approved the transfer”.
                        </p>
                      </div>
                    </div>

                    {/* Arrow Right */}
                    <div className="text-stone-400 group-hover:text-[#0C2B22] group-hover:translate-x-0.5 transition-all shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Artisan Card 2: Verifiable On-Chain Work History */}
                  <div className="w-full bg-white rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all flex items-start sm:items-center justify-between gap-3 sm:gap-4 group">
                    <div className="flex items-start gap-3.5 sm:gap-5">
                      {/* Document icon in sage square */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-[#E1ECE4] text-[#0C2B22] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div>
                        <h3 
                          className="text-sm sm:text-base md:text-[17px] font-bold text-[#112319] mb-1 sm:mb-1.5 leading-snug"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Verifiable On-Chain Work History
                        </h3>
                        <p 
                          className="text-xs sm:text-[13px] text-[#556259] leading-[1.55] sm:leading-[1.65]"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Every project you complete writes permanent cryptographic proof of your skill and integrity. Build a professional credit profile that unlocks micro-financing for tools and heavy equipment.
                        </p>
                      </div>
                    </div>

                    <div className="text-stone-400 group-hover:text-[#0C2B22] group-hover:translate-x-0.5 transition-all shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Artisan Card 3: Direct High-Budget Commercial & Diaspora Clients */}
                  <div className="w-full bg-white rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all flex items-start sm:items-center justify-between gap-3 sm:gap-4 group">
                    <div className="flex items-start gap-3.5 sm:gap-5">
                      {/* Community / People icon in sage square */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-[#E1ECE4] text-[#0C2B22] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 
                          className="text-sm sm:text-base md:text-[17px] font-bold text-[#112319] mb-1 sm:mb-1.5 leading-snug"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Direct High-Budget Commercial &amp; Diaspora Clients
                        </h3>
                        <p 
                          className="text-xs sm:text-[13px] text-[#556259] leading-[1.55] sm:leading-[1.65]"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Connect with corporate facility managers, real estate developers, and overseas Nigerians who pay top rates because Artifix eliminates their distance and trust concerns.
                        </p>
                      </div>
                    </div>

                    <div className="text-stone-400 group-hover:text-[#0C2B22] group-hover:translate-x-0.5 transition-all shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Client Card 1: Rigorous Identity & Competence Vetting */}
                  <div className="w-full bg-white rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all relative overflow-hidden flex items-start sm:items-center justify-between gap-3 sm:gap-4 group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0C2B22] rounded-l-[18px] sm:rounded-l-[22px]" />

                    <div className="flex items-start gap-3.5 sm:gap-5 pl-1 sm:pl-1.5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-[#E1ECE4] text-[#0C2B22] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div>
                        <h3 
                          className="text-sm sm:text-base md:text-[17px] font-bold text-[#112319] mb-1 sm:mb-1.5 leading-snug"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Strict Identity &amp; Skill Vetting
                        </h3>
                        <p 
                          className="text-xs sm:text-[13px] text-[#556259] leading-[1.55] sm:leading-[1.65]"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Every artisan undergoes National Identity (NIN/BVN) verification, physical workshop or residential address audits, trade competence testing, and clean criminal record checks before entering your property.
                        </p>
                      </div>
                    </div>

                    <div className="text-stone-400 group-hover:text-[#0C2B22] group-hover:translate-x-0.5 transition-all shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Client Card 2: Fixed Milestone Escrow Protection */}
                  <div className="w-full bg-white rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all flex items-start sm:items-center justify-between gap-3 sm:gap-4 group">
                    <div className="flex items-start gap-3.5 sm:gap-5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-[#E1ECE4] text-[#0C2B22] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 
                          className="text-sm sm:text-base md:text-[17px] font-bold text-[#112319] mb-1 sm:mb-1.5 leading-snug"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Fixed Milestone Escrow Protection
                        </h3>
                        <p 
                          className="text-xs sm:text-[13px] text-[#556259] leading-[1.55] sm:leading-[1.65]"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Say goodbye to unexpected price surges or disappearing contractors. Your money stays locked in escrow until each phase is completed according to the agreed contract specification.
                        </p>
                      </div>
                    </div>

                    <div className="text-stone-400 group-hover:text-[#0C2B22] group-hover:translate-x-0.5 transition-all shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Client Card 3: Objective 48-Hour Dispute Tribunal */}
                  <div className="w-full bg-white rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all flex items-start sm:items-center justify-between gap-3 sm:gap-4 group">
                    <div className="flex items-start gap-3.5 sm:gap-5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-[#E1ECE4] text-[#0C2B22] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-16.5-.52c-1.01.143-2.01.317-3 .52m16.5 0a48.667 48.667 0 01-16.5 0m16.5 0c.348 1.487.53 3.04.53 4.63 0 6.075-2.686 11.533-6.97 15.228M3.75 5.49c-.348 1.487-.53 3.04-.53 4.63 0 6.075 2.686 11.533 6.97 15.228" />
                        </svg>
                      </div>
                      <div>
                        <h3 
                          className="text-sm sm:text-base md:text-[17px] font-bold text-[#112319] mb-1 sm:mb-1.5 leading-snug"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Objective 48-Hour Dispute Tribunal
                        </h3>
                        <p 
                          className="text-xs sm:text-[13px] text-[#556259] leading-[1.55] sm:leading-[1.65]"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          If workmanship falls short of stated milestones, funds remain safely protected while verified independent master craftsmen evaluate photographic evidence and arbitrate within 48 hours.
                        </p>
                      </div>
                    </div>

                    <div className="text-stone-400 group-hover:text-[#0C2B22] group-hover:translate-x-0.5 transition-all shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom CTA Button */}
            <div className="pt-1 w-full sm:w-auto">
              {activePerspective === 'artisan' ? (
                <Link
                  to="/register?role=ARTISAN"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#0C2B22] text-white text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-full hover:bg-[#153D32] transition-all shadow-md active:scale-95 text-center"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                >
                  <span>Apply as a Verified Artisan</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <Link
                  to="/register?role=CLIENT"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#0C2B22] text-white text-xs sm:text-sm font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-full hover:bg-[#153D32] transition-all shadow-md active:scale-95 text-center"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                >
                  <span>Hire a Verified Artisan</span>
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>

          </div>


          {/* ========================================================= */}
          {/* RIGHT COLUMN: Realistic Visual Mockup Composition         */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-6 relative w-full flex items-center justify-center pt-2 sm:pt-4 lg:pt-0 overflow-visible">
            
            {/* Outer Proportional Adaptive Container that adjusts height to scaled content */}
            <div className="relative w-full max-w-[580px] flex items-start justify-center h-[375px] min-[375px]:h-[415px] min-[430px]:h-[485px] sm:h-[585px] md:h-[645px] lg:h-[535px] xl:h-[595px] 2xl:h-[625px] transition-all duration-300">
              
              {/* Responsive Scaling Canvas */}
              <div className="scale-[0.54] min-[375px]:scale-[0.61] min-[430px]:scale-[0.72] sm:scale-[0.86] md:scale-[0.95] lg:scale-[0.80] xl:scale-[0.88] 2xl:scale-[0.93] origin-top flex-shrink-0 transition-transform duration-300">
                
                {/* Inner Canvas with fixed reference geometry */}
                <div className="relative w-[580px] sm:w-[600px] h-[670px] select-none">

                  {/* Organic Fluid Shape with fine contour line matching reference mockup */}
                  <svg 
                    className="absolute -top-6 -left-12 sm:-left-16 w-[640px] sm:w-[680px] h-[660px] pointer-events-none z-0" 
                    viewBox="0 0 680 660" 
                    fill="none"
                  >
                    {/* Main Soft Sage Organic Silhouette */}
                    <path 
                      d="M 300 30 C 440 18, 550 50, 595 160 C 640 270, 645 380, 580 485 C 520 580, 390 625, 260 615 C 150 605, 55 540, 35 440 C 15 330, 35 240, 80 150 C 125 60, 195 40, 300 30 Z" 
                      fill="#DAE7E0" 
                      fillOpacity="0.85" 
                    />
                    {/* Delicate Hand-drawn Outer Contour Stroke */}
                    <path 
                      d="M 305 18 C 455 6, 568 40, 615 155 C 662 270, 665 390, 595 500 C 530 600, 395 645, 255 632 C 140 620, 40 550, 20 445 C 0 330, 20 235, 70 140 C 118 48, 190 28, 305 18 Z" 
                      stroke="#A2C2AF" 
                      strokeWidth="1.3" 
                      strokeDasharray="none" 
                    />
                  </svg>

                  {/* 1. TOP RIGHT HANDWRITTEN NOTE */}
                  <div className="absolute -top-1 right-2 sm:right-4 z-30 pointer-events-none text-left rotate-[-2.5deg]">
                    <div 
                      className="text-2xl sm:text-[27px] text-[#1E4D38] font-bold leading-[1.12]"
                      style={{ fontFamily: "'Caveat', cursive" }}
                    >
                      <div>Skilled People.</div>
                      <div>Real Work.</div>
                      <div className="relative inline-block">
                        Better Outcomes.
                        {/* Delicate organic underline swoosh */}
                        <svg 
                          className="w-[110%] h-3.5 text-[#1E4D38] -mt-0.5 ml-0.5" 
                          viewBox="0 0 130 14" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        >
                          <path d="M 2 8 C 38 2.5, 92 3, 126 8.5" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* 2. PHOTO 1: Artisan Working on Panel (Cathedral Arch, Clean Edge, Behind Dark Card) */}
                  <div className="absolute top-5 right-12 sm:right-16 w-[220px] sm:w-[235px] h-[255px] sm:h-[275px] rounded-t-[90px] sm:rounded-t-[100px] rounded-b-[24px] overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.12)] z-10">
                    <img
                      src="/images/dual/artisan-working.jpg"
                      alt="Artisan technician working on electrical panel installation"
                      className="w-full h-full object-cover object-[72%_30%]"
                    />
                  </div>

                  {/* 3. FLOATING BADGE: "Verified Artisan" (Overlapping the right edge of Photo 1 & 2) */}
                  <div className="absolute top-[180px] sm:top-[190px] right-2 sm:right-4 z-25 bg-white rounded-2xl px-3.5 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.1)] flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#167848] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <svg className="w-3.5 h-3.5 stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div 
                      className="text-[11px] font-bold text-[#141A16] leading-tight text-left"
                      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                    >
                      <div>Verified</div>
                      <div>Artisan</div>
                    </div>
                  </div>

                  {/* 4. PHOTO 2: Artisan in Yellow Hardhat (Rounded Rectangle, Clean Edge, Behind Dark Card) */}
                  <div className="absolute top-[260px] sm:top-[275px] right-6 sm:right-8 w-[190px] sm:w-[205px] h-[250px] sm:h-[270px] rounded-[30px] sm:rounded-[34px] overflow-hidden shadow-[0_18px_38px_rgba(0,0,0,0.14)] z-10">
                    <img
                      src="/images/dual/artisan-helmet.jpg"
                      alt="Certified Artisan technician in safety gear"
                      className="w-full h-full object-cover object-[50%_25%]"
                    />
                  </div>

                  {/* 5. MAIN CENTERPIECE: Dark Escrow Vault Mockup Card (Foreground) */}
                  <div className="absolute top-8 left-0 w-[355px] sm:w-[380px] z-20 bg-gradient-to-b from-[#081B15] via-[#05140F] to-[#030D09] text-white rounded-[28px] p-5 sm:p-6 shadow-[0_25px_60px_-10px_rgba(2,12,8,0.65)]">
                    
                    {/* Header: Brand Identity & Active Escrow Pill */}
                    <div className="flex items-center justify-between pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-white">
                          <svg className="w-4 h-4 text-[#34D399]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="9" cy="12" r="4.5" strokeLinecap="round" />
                            <circle cx="15" cy="12" r="4.5" strokeLinecap="round" />
                          </svg>
                        </div>
                        <span 
                          className="text-base font-bold text-white tracking-tight"
                          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                        >
                          Artifix
                        </span>
                      </div>

                      {/* Active Escrow Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D3123] text-[#34D399] text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                        <span>Escrow Vault Active</span>
                      </div>
                    </div>

                    {/* Amount Header */}
                    <div className="mt-2 mb-4">
                      <div 
                        className="text-xs text-stone-400 font-medium"
                        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                      >
                        Pending Escrow Balance
                      </div>
                      <div 
                        className="text-3xl sm:text-[36px] font-extrabold text-white tracking-tight mt-1 leading-tight"
                        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                      >
                        ₦385,000
                      </div>
                      <div 
                        className="text-xs text-[#34D399] font-medium mt-1.5 flex items-center gap-1.5"
                        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-[#34D399]/20 text-[#34D399] flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                        <span>2 Milestones ready for payout approval</span>
                      </div>
                    </div>

                    {/* Milestones & Feature Rows */}
                    <div className="space-y-2.5">
                      
                      {/* Item 1: Commercial Conduit Fitting */}
                      <div className="bg-[#0E241E]/95 hover:bg-[#122E26] transition-colors rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#143B2C] text-[#34D399] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.057a4.5 4.5 0 004.49-4.49 4.5 4.5 0 00-4.49-4.49c-1.458 0-2.756.697-3.57 1.776a4.5 4.5 0 00-6.19 6.19c.13.58.107 1.193-.057 1.743" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div 
                              className="text-xs font-bold text-white whitespace-nowrap"
                              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                            >
                              Commercial Conduit Fitting
                            </div>
                            <div 
                              className="text-[10px] text-stone-400 mt-0.5 whitespace-nowrap"
                              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                            >
                              Milestone 2/3 • Victoria Island
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div 
                            className="text-xs font-bold text-white"
                            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                          >
                            ₦220,000
                          </div>
                          <span className="inline-block text-[9px] font-medium text-[#34D399] bg-[#0A2E20] px-2 py-0.5 rounded-full mt-0.5">
                            Locked In Escrow
                          </span>
                        </div>
                      </div>

                      {/* Item 2: DB Panel Upgrade & Earthing */}
                      <div className="bg-[#0E241E]/95 hover:bg-[#122E26] transition-colors rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#143B2C] text-[#34D399] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div 
                              className="text-xs font-bold text-white whitespace-nowrap"
                              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                            >
                              DB Panel Upgrade &amp; Earthing
                            </div>
                            <div 
                              className="text-[10px] text-stone-400 mt-0.5 whitespace-nowrap"
                              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                            >
                              Milestone 1/1 • Ikoyi GRA
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div 
                            className="text-xs font-bold text-white"
                            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                          >
                            ₦165,000
                          </div>
                          <span className="inline-block text-[9px] font-medium text-[#34D399] bg-[#0A2E20] px-2 py-0.5 rounded-full mt-0.5">
                            Locked In Escrow
                          </span>
                        </div>
                      </div>

                      {/* Item 3: Instant Local Bank Credit */}
                      <div className="bg-[#0E241E]/95 hover:bg-[#122E26] transition-colors rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#143B2C] text-[#34D399] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5M4.5 21V10.5M3 21h18M1.5 9h21" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div 
                              className="text-xs font-bold text-white whitespace-nowrap"
                              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                            >
                              Instant Local Bank Credit
                            </div>
                            <div 
                              className="text-[10px] text-stone-400 mt-0.5 whitespace-nowrap"
                              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                            >
                              For materials &amp; tools
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className="inline-block text-[10px] font-semibold text-[#34D399] bg-[#0A2E20] px-2.5 py-1 rounded-full">
                            &lt; 60s Settlement
                          </span>
                        </div>
                      </div>

                      {/* Item 4: NGN & MON Payments */}
                      <div className="bg-[#0E241E]/95 hover:bg-[#122E26] transition-colors rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#143B2C] text-[#34D399] flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div 
                              className="text-xs font-bold text-white whitespace-nowrap"
                              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                            >
                              NGN &amp; MON Payments
                            </div>
                            <div 
                              className="text-[10px] text-stone-400 mt-0.5 whitespace-nowrap"
                              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                            >
                              Flexible. Fast. Global.
                            </div>
                          </div>
                        </div>
                        <div className="text-stone-400 pr-1">
                          <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* 6. FLOATING CARD: "Secure Escrow" (Bottom Right, Below Photo 2) */}
                  <div className="absolute top-[455px] sm:top-[475px] right-0 sm:right-2 z-25 bg-white rounded-[22px] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.12)] w-[175px] sm:w-[185px]">
                    <div className="w-8 h-8 rounded-xl bg-[#F0F5F2] text-[#143B2C] flex items-center justify-center mb-2.5 shadow-2xs">
                      {/* Safe / Vault / Stacked Coins Icon */}
                      <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                      </svg>
                    </div>
                    <div 
                      className="text-xs font-bold text-[#112319] leading-tight mb-1"
                      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                    >
                      Secure Escrow
                    </div>
                    <div 
                      className="text-[10px] text-stone-500 leading-snug"
                      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                    >
                      Your funds are safe until the work is verified.
                    </div>
                  </div>

                  {/* 7. BOTTOM RIGHT: Powered by Monad Blockchain Attribution */}
                  <div className="absolute bottom-0 right-2 sm:right-6 z-10">
                    <div className="inline-flex items-center gap-2.5 text-stone-600 select-none">
                      {/* Monad Logo Ribbon Knot in Purple */}
                      <div className="w-6 h-6 rounded-lg bg-[#836EF9] flex items-center justify-center text-white shadow-sm p-1">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 13.5c-1.38 1.38-3.62 1.38-5 0l-1.5-1.5 1.5-1.5c.55-.55 1.45-.55 2 0l.5.5.5-.5c.55-.55 1.45-.55 2 0s.55 1.45 0 2l-.5.5.5.5c1.38 1.38 1.38 3.62 0 5z" />
                        </svg>
                      </div>
                      <div 
                        className="text-left leading-tight"
                        style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                      >
                        <span className="text-[10px] text-stone-400 block font-normal">Powered by</span>
                        <span className="text-xs font-semibold text-stone-800 tracking-tight block">Monad Blockchain</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

          </div>

        </div>

      </div>

        </div>
    </section>
  );
};

export default DualPerspectiveSection;
