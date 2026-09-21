import React from 'react';
import { LANDING_IMAGES } from '../../assets/landing-assets';

export const SocialProofSection: React.FC = () => {
  const metrics = [
    { value: '₦180M+', label: 'Escrow Volume Protected', sub: 'Across 1,200+ residential projects' },
    { value: '99.6%', label: 'Dispute-Free Completion', sub: 'Verified by milestone inspection' },
    { value: '2,450+', label: 'Vetted Craft Masters', sub: 'Identity & competency audited' },
    { value: '< 15 mins', label: 'Average Response Time', sub: 'Direct match with nearby technicians' },
  ];

  const stories = [
    {
      name: 'Adeola Adeleke',
      role: 'Homeowner, Lekki Phase 1, Lagos',
      avatar: LANDING_IMAGES.avatars[0],
      project: '5kVA Solar Inverter & Battery Bank',
      amount: '₦1,850,000 in Escrow',
      quote:
        'In the past, an electrician absconded with my ₦450,000 deposit for solar panels. With Artifix, the money remained safely locked in escrow until the batteries were delivered and load-tested. I will never hire outside Artifix again.',
      badge: 'Protected Milestone Release',
    },
    {
      name: 'Emmanuel Chidiebere',
      role: 'Master Plumber, Garki, Abuja',
      avatar: LANDING_IMAGES.avatars[1],
      project: 'Sanitary & Conduit Piping for 6 Apartments',
      amount: '₦980,000 Paid Instantly',
      quote:
        'Artifix ended the humiliation of begging clients for my balance after finishing work. Once the client approves the pressure test, my money lands in my GTBank account within 60 seconds. My business has grown 3x.',
      badge: 'Level 3 Verified Craftsman',
    },
    {
      name: 'Dr. Folake Davies',
      role: 'Property Investor, London, UK',
      avatar: LANDING_IMAGES.avatars[2],
      project: 'Kitchen & Bathroom Remodeling in Ikeja GRA',
      amount: 'Funded via Monad Crypto',
      quote:
        'Managing renovations from abroad used to mean relatives lying about progress. With Artifix’s photo proof-of-work docket and Monad crypto escrow, I inspected every tile from London before releasing a single pound.',
      badge: 'Zero Diaspora Loss',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 bg-[#FAF7F0] border-t border-stone-200/60 relative overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Metrics Counter Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-20">
          {metrics.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-sm text-center flex flex-col justify-center"
            >
              <div 
                className="text-3xl sm:text-4xl font-extrabold text-[#123E2A] mb-1 tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                {item.value}
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#141A16] mb-0.5">
                {item.label}
              </div>
              <div className="text-[11px] text-stone-400">
                {item.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-[760px] mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#123E2A]/10 text-[#123E2A] text-[11px] font-bold tracking-[0.18em] uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#123E2A]" />
            REAL PEOPLE. REAL SKILLS. REAL TRUST.
          </div>

          <h2 
            className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#141A16] leading-[1.12] tracking-[-0.02em] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Stories from Nigeria’s{' '}
            <span 
              className="font-serif italic font-normal text-[#123E2A]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              verified trust economy
            </span>.
          </h2>

          <p className="text-sm sm:text-base text-[#556259] leading-[1.65] font-normal">
            Real experiences from property owners and technicians whose projects and businesses are protected by Artifix milestone escrow.
          </p>
        </div>

        {/* 3 Case Study Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {stories.map((story, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-[0_8px_24px_rgba(20,26,22,0.04)] hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Role */}
                <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-stone-100">
                  <img
                    src={story.avatar}
                    alt={story.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#123E2A]/20 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#141A16]">
                      {story.name}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-medium">
                      {story.role}
                    </p>
                  </div>
                </div>

                {/* Project Tag */}
                <div className="mb-4">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#123E2A] bg-[#123E2A]/8 px-2.5 py-1 rounded-full mb-1">
                    {story.badge}
                  </span>
                  <div className="text-xs font-bold text-stone-700">
                    {story.project}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700">
                    {story.amount}
                  </div>
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-[13px] text-[#556259] leading-relaxed italic mb-6">
                  "{story.quote}"
                </p>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold pt-3 border-t border-stone-100">
                <span>★★★★★</span>
                <span className="text-stone-400 text-[10px] ml-1 font-normal">Verified Contract Feedback</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default SocialProofSection;
