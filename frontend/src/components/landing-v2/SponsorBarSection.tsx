import React from 'react';

interface SponsorItem {
  id: string;
  name: string;
  role: string;
  logo: string;
  badgeBg?: string;
}

export const SponsorBarSection: React.FC = () => {
  const sponsors: SponsorItem[] = [
    {
      id: 'monad',
      name: 'Monad',
      role: 'High-TPS Smart Escrow',
      logo: '/images/sponsors/monad-icon.png',
      badgeBg: 'bg-[#836EF9]/10',
    },
    {
      id: 'solana',
      name: 'Solana',
      role: 'Sub-Second Settlement',
      logo: '/images/sponsors/solana.png',
      badgeBg: 'bg-emerald-500/10',
    },
    {
      id: 'privy',
      name: 'Privy',
      role: 'Embedded Social Wallets',
      logo: '/images/sponsors/privy-icon.png',
      badgeBg: 'bg-stone-100',
    },
    {
      id: 'kotanipay',
      name: 'Kotanipay',
      role: 'Offline USSD & Off-Ramp',
      logo: '/images/sponsors/kotanipay-icon.png',
      badgeBg: 'bg-amber-500/10',
    },
    {
      id: 'paystack',
      name: 'Paystack',
      role: 'Naira Bank Cards & Transfers',
      logo: '/images/sponsors/paystack-icon.png',
      badgeBg: 'bg-[#00C3F7]/10',
    },
  ];

  return (
    <section 
      aria-label="Sponsors and Technology Partners"
      className="w-full bg-[#FAF7F0] py-8 sm:py-10 border-y border-stone-200/60 relative overflow-hidden select-none"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Eyebrow Label */}
        <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] text-[#6A7B70] uppercase text-center mb-6 sm:mb-7">
          INFRASTRUCTURE &amp; PAYMENT PARTNERS TRUSTED BY ARTIFIX
        </p>

        {/* ============================================================ */}
        {/* DESKTOP ROW (>= lg): Centered Static Ribbon with Borderless Cards */}
        {/* ============================================================ */}
        <div className="hidden lg:flex items-center justify-center gap-4 xl:gap-6 flex-wrap">
          {sponsors.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3.5 px-4 sm:px-5 py-2.5 rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-default"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${item.badgeBg || 'bg-stone-50'} flex items-center justify-center p-2 shrink-0 overflow-hidden transition-colors`}>
                <img
                  src={item.logo}
                  alt={`${item.name} logo`}
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-[#141A16] group-hover:text-[#123E2A] transition-colors leading-tight">
                  {item.name}
                </span>
                <span className="text-[10px] text-stone-500 font-medium leading-tight mt-0.5">
                  {item.role}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ============================================================ */}
      {/* MOBILE & TABLET (< lg): Continuous Automatic Moving Slider   */}
      {/* ============================================================ */}
      <div className="lg:hidden relative w-full overflow-hidden">
        
        {/* Soft edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-[#FAF7F0] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-[#FAF7F0] to-transparent z-10" />

        {/* Marquee Track: duplicated items for seamless infinite scroll */}
        <div className="animate-marquee flex items-center gap-3 sm:gap-4 py-1">
          {[...sponsors, ...sponsors, ...sponsors].map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] shrink-0 select-none"
            >
              <div className={`w-8 h-8 rounded-lg ${item.badgeBg || 'bg-stone-50'} flex items-center justify-center p-1.5 shrink-0 overflow-hidden`}>
                <img
                  src={item.logo}
                  alt={`${item.name} logo`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[13px] font-bold text-[#141A16] leading-tight whitespace-nowrap">
                  {item.name}
                </span>
                <span className="text-[9.5px] text-stone-500 font-medium leading-tight mt-0.5 whitespace-nowrap">
                  {item.role}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default SponsorBarSection;
