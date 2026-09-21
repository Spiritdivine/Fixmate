import React from 'react';
import { Link } from 'react-router-dom';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Define Scope & Milestones',
      subtitle: 'Smart Contract Agreement',
      badge: 'Zero Misalignment',
      description:
        'Specify deliverables, required materials, and clear project phases with a vetted artisan. Every task is documented on a binding digital docket.',
      icon: (
        <svg className="w-6 h-6 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      step: '02',
      title: 'Lock Funds in Escrow',
      subtitle: 'Dual-Rail Vault Security',
      badge: 'Zero Cash Advance Risk',
      description:
        'Deposit milestone funds using your local debit card, instant bank transfer (NGN), or Monad cryptocurrency. Money is held securely until you verify the work.',
      icon: (
        <svg className="w-6 h-6 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
    {
      step: '03',
      title: 'Real-Time Proof of Work',
      subtitle: 'Timestamped Progress',
      badge: 'Verifiable Evidence',
      description:
        'Artisan performs the job on-site, uploading time-stamped photos and video logs directly to the contract docket as milestones reach completion.',
      icon: (
        <svg className="w-6 h-6 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      ),
    },
    {
      step: '04',
      title: 'Inspect & Instant Release',
      subtitle: 'Guaranteed Payout',
      badge: 'Zero Payment Delays',
      description:
        'Once you are fully satisfied with the milestone, tap approve. Escrow instantly releases the funds directly to the artisan’s local bank or crypto wallet.',
      icon: (
        <svg className="w-6 h-6 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-16 sm:py-20 lg:py-24 bg-[#F5EFEB]/50 border-t border-stone-200/60 relative overflow-hidden">
      
      {/* Decorative ambient subtle background tint */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-[760px] mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#123E2A]/10 text-[#123E2A] text-[11px] font-bold tracking-[0.18em] uppercase mb-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#123E2A]" />
            HOW ARTIFIX WORKS
          </div>

          <h2 
            className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#141A16] leading-[1.12] tracking-[-0.02em] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            From booking to final handshake in{' '}
            <span 
              className="font-serif italic font-normal text-[#123E2A]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              four transparent steps
            </span>.
          </h2>

          <p className="text-sm sm:text-base text-[#556259] leading-[1.65] font-normal">
            No more high-risk cash advances or delayed artisan payments. Artifix keeps money safely locked in milestone escrow until real, verifiable work is completed to your satisfaction.
          </p>

          {/* Organic handwritten margin note */}
          <div className="mt-3 transform -rotate-[2deg]">
            <span 
              className="text-lg sm:text-xl text-[#1E573B] font-bold leading-tight"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Protected on both sides — zero excuses, 100% fair.
            </span>
          </div>
        </div>

        {/* 4 Connected Cards Grid */}
        <div className="relative">
          
          {/* Horizontal connecting line on desktop */}
          <div className="hidden lg:block absolute top-[68px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-[#123E2A]/20 via-[#123E2A]/40 to-[#123E2A]/20 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 relative z-10">
            {steps.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(20,26,22,0.04)] hover:shadow-[0_16px_36px_rgba(20,26,22,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header: Step Number + Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF7F0] text-[#123E2A] flex items-center justify-center group-hover:scale-105 group-hover:bg-[#123E2A] group-hover:text-white transition-all shadow-sm">
                      {item.icon}
                    </div>
                    <span 
                      className="text-2xl sm:text-3xl font-black text-stone-200 group-hover:text-[#123E2A]/30 transition-colors"
                      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                    >
                      {item.step}
                    </span>
                  </div>

                  {/* Subtitle / Category badge */}
                  <div className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#123E2A] bg-[#123E2A]/8 px-2.5 py-0.5 rounded-full mb-2">
                    {item.badge}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#141A16] mb-2 leading-snug">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-[#556259] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Step Indicator */}
                <div className="pt-5 mt-5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-medium">
                  <span>Phase {item.step}</span>
                  <span className="text-[#123E2A] font-semibold group-hover:translate-x-0.5 transition-transform">
                    {item.subtitle} →
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Callout Banner */}
        <div className="mt-12 sm:mt-16 bg-[#123E2A] rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white">
              <svg className="w-6 h-6 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold">Unmatched Dispute Protection</h4>
              <p className="text-xs sm:text-sm text-stone-300">
                In the rare case of substandard work, our 48-Hour Dispute Tribunal reviews timestamped evidence to ensure fair settlement or refund.
              </p>
            </div>
          </div>

          <Link
            to="/register?role=CLIENT"
            className="shrink-0 bg-white text-[#123E2A] text-xs sm:text-sm font-bold px-6 py-3 rounded-full hover:bg-stone-100 transition-all shadow-md active:scale-95"
          >
            Start a Protected Job →
          </Link>
        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;
