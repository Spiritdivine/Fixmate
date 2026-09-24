import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LANDING_IMAGES } from '../../assets/landing-assets';

interface JobItem {
  id: string;
  title: string;
  image: string;
  category: string;
  tag: string;
  description: string;
  budget: string;
  turnaround: string;
  location: string;
  proposalsCount: number;
  skills: string[];
  icon: React.ReactNode;
}

export const TradesShowcaseSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);

  const jobs: JobItem[] = [
    {
      id: 'job-solar-lekki',
      title: '5kVA Hybrid Inverter & 10kWh Lithium Installation',
      image: LANDING_IMAGES.solarTech,
      category: 'Clean Energy',
      tag: 'Urgent • 4 Bids',
      description: 'Complete rooftop solar panel mounting, 5kVA hybrid inverter synchronization, lithium battery bank setup, and automatic grid failover for a 4-bedroom duplex.',
      budget: '₦350,000 – ₦450,000',
      turnaround: '2 – 3 Days',
      location: 'Lekki Phase 1, Lagos',
      proposalsCount: 4,
      skills: ['Load Balancing', 'Lithium Storage', 'Surge Audits'],
      icon: (
        <svg className="w-5 h-5 text-[#123E2A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <line x1="8" y1="21" x2="8" y2="7" />
          <line x1="16" y1="21" x2="16" y2="7" />
          <line x1="3" y1="13" x2="21" y2="13" />
          <path d="M7 3l2 4M17 3l-2 4" />
        </svg>
      ),
    },
    {
      id: 'job-plumbing-abuja',
      title: 'Concealed PPR Leak Detection & Pressure Pump Overhaul',
      image: LANDING_IMAGES.plumbingTools || LANDING_IMAGES.plumber,
      category: 'Sanitary & Water',
      tag: 'Verified Escrow',
      description: 'Acoustic leak detection for concealed master bathroom conduit pipes, PPR re-piping, and installation of a 1HP automated water pressure booster pump with safety bypass.',
      budget: '₦85,000 – ₦180,000',
      turnaround: 'Same Day – 2 Days',
      location: 'Maitama, Abuja (FCT)',
      proposalsCount: 2,
      skills: ['PPR Welding', 'Concealed Leaks', 'Pressure Testing'],
      icon: (
        <svg className="w-5 h-5 text-[#123E2A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c-4.97 4.97-6 8.5-6 11a6 6 0 0012 0c0-2.5-1.03-6.03-6-11z" />
        </svg>
      ),
    },
    {
      id: 'job-electrical-vi',
      title: 'Distribution Board Rewiring & 3-Phase Balancing',
      image: LANDING_IMAGES.electrician,
      category: 'Power & Safety',
      tag: 'Funded Escrow',
      description: 'Commercial studio distribution board upgrade, replacement of melted circuit breakers, industrial surge arresters installation, and 3-phase load rebalancing.',
      budget: '₦120,000 – ₦250,000',
      turnaround: '1 – 2 Days',
      location: 'Victoria Island, Lagos',
      proposalsCount: 5,
      skills: ['3-Phase Wiring', 'DB Upgrades', 'Surge Arresters'],
      icon: (
        <svg className="w-5 h-5 text-[#123E2A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      id: 'job-carpentry-ikeja',
      title: 'Custom Fitted Kitchen Cabinets & Island Joinery',
      image: LANDING_IMAGES.kitchenCabinetry || LANDING_IMAGES.carpenter,
      category: 'Interior & Woodwork',
      tag: 'Milestone Escrow',
      description: 'Fabrication and fitting of high-gloss moisture-resistant kitchen cabinets, soft-close hardware, pantry pull-out organizers, and custom hardwood island trim.',
      budget: '₦450,000 – ₦850,000',
      turnaround: '4 – 7 Days',
      location: 'Ikeja GRA, Lagos',
      proposalsCount: 3,
      skills: ['Bespoke Fitting', 'Roof Trusses', 'Cabinetry'],
      icon: (
        <svg className="w-5 h-5 text-[#123E2A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
          <circle cx="6" cy="15" r="1" fill="currentColor" />
          <circle cx="12" cy="15" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'job-tiling-ph',
      title: 'Porcelain Floor Tiling & Compound Interlocking',
      image: LANDING_IMAGES.villa,
      category: 'Structural & Masonry',
      tag: 'Active Bidding',
      description: 'Laser levelling and precision laying of 60x120cm Spanish porcelain floor tiles for living hall plus 180sqm outdoor interlocking paving stone drainage slope.',
      budget: '₦220,000 – ₦480,000',
      turnaround: '3 – 5 Days',
      location: 'GRA Phase 2, Port Harcourt',
      proposalsCount: 4,
      skills: ['Laser Levelling', 'Damp Proofing', 'Porcelain Tiles'],
      icon: (
        <svg className="w-5 h-5 text-[#123E2A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      ),
    },
    {
      id: 'job-welding-wuse',
      title: 'Automated Sliding Security Gate & Steel Grilles',
      image: LANDING_IMAGES.welder,
      category: 'Security & Steel',
      tag: 'Funded Escrow',
      description: 'Fabrication and motorization of 4.5m heavy-duty steel sliding gate with remote automation sensors, plus 8 burglar-proof window grilles with anti-rust priming.',
      budget: '₦300,000 – ₦650,000',
      turnaround: '3 – 6 Days',
      location: 'Wuse 2, Abuja (FCT)',
      proposalsCount: 2,
      skills: ['Arc & MIG Welding', 'Structural Steel', 'Gate Automation'],
      icon: (
        <svg className="w-5 h-5 text-[#123E2A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  // Update scroll bounds & active card based on scroll position
  const updateScrollState = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const scrollLeft = slider.scrollLeft;
    const maxScroll = slider.scrollWidth - slider.clientWidth;

    setCanScrollPrev(scrollLeft > 10);
    setCanScrollNext(scrollLeft < maxScroll - 10);

    // Calculate closest card index
    const children = Array.from(slider.children) as HTMLElement[];
    if (!children.length) return;

    let closestIdx = 0;
    let minDistance = Infinity;
    const centerPoint = scrollLeft + slider.clientWidth / 2;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(centerPoint - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = index;
      }
    });

    setActiveIndex(closestIdx);
  }, []);

  const handleScroll = () => {
    window.requestAnimationFrame(updateScrollState);
  };

  const scrollToSlide = (index: number) => {
    const slider = sliderRef.current;
    if (!slider) return;
    const children = Array.from(slider.children) as HTMLElement[];
    if (children[index]) {
      const targetOffset = children[index].offsetLeft - (slider.clientWidth - children[index].offsetWidth) / 2;
      slider.scrollTo({
        left: Math.max(0, targetOffset),
        behavior: 'smooth',
      });
      setActiveIndex(index);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      scrollToSlide(activeIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < jobs.length - 1) {
      scrollToSlide(activeIndex + 1);
    }
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState]);

  // Reusable Job Card Component
  const renderJobCard = (job: JobItem, isSlider = false) => (
    <div 
      key={job.id}
      className={`bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_6px_20px_rgba(20,26,22,0.04)] hover:shadow-[0_16px_36px_rgba(20,26,22,0.08)] hover:-translate-y-1 sm:hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group ${
        isSlider ? 'w-[84vw] max-w-[360px] sm:w-[380px] shrink-0 snap-center' : 'w-full'
      }`}
    >
      <div>
        {/* Image & Floating Overlays */}
        <div className="relative h-44 sm:h-48 md:h-52 w-full overflow-hidden bg-stone-100">
          <img
            src={job.image}
            alt={job.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
          
          {/* Category & Status Badges */}
          <div className="absolute top-3 left-3 right-3 sm:top-3.5 sm:left-3.5 sm:right-3.5 flex items-center justify-between pointer-events-none gap-2">
            <span className="bg-[#FAF7F0]/95 backdrop-blur-sm text-[#141A16] text-[10px] sm:text-[10.5px] font-bold px-2.5 sm:px-3 py-1 rounded-full shadow-sm truncate">
              {job.category}
            </span>
            <span className="bg-[#0B3B24] text-white text-[10px] sm:text-[10.5px] font-bold px-2.5 sm:px-3 py-1 rounded-full shadow-sm shrink-0">
              {job.tag}
            </span>
          </div>

          {/* Typical Escrow Overlay Bar at Bottom of Image */}
          <div className="absolute bottom-2.5 sm:bottom-3 left-3 right-3 sm:left-3.5 sm:right-3.5 flex items-center justify-between text-white text-xs pointer-events-none gap-2">
            <span className="font-semibold text-stone-200 text-[10.5px] sm:text-[11.5px] truncate">
              Funded Escrow:
            </span>
            <span className="font-extrabold text-white text-[11px] sm:text-xs md:text-[12.5px] bg-black/50 px-2 sm:px-2.5 py-0.5 rounded-lg backdrop-blur-sm shrink-0">
              {job.budget}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Category Icon */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#FAF7F0] flex items-center justify-center mb-3 sm:mb-3.5">
            {job.icon}
          </div>

          {/* Job Title */}
          <h3 className="text-base sm:text-lg lg:text-[19px] font-bold text-[#141A16] mb-2 leading-snug group-hover:text-[#123E2A] transition-colors line-clamp-2">
            {job.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-[13px] text-[#556259] leading-relaxed mb-3.5 sm:mb-4 line-clamp-3 min-h-[48px] sm:min-h-[58px]">
            {job.description}
          </p>

          {/* Skills Pills (Borderless) */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {job.skills.map((skill, sIdx) => (
              <span 
                key={sIdx}
                className="bg-[#FAF7F0] text-stone-600 text-[10px] sm:text-[10.5px] font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Card Action Footer (Borderless & Responsive) */}
      <div className="px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 pt-2 flex items-center justify-between gap-2">
        <div className="text-[11px] sm:text-[11.5px] text-stone-500 font-medium truncate">
          <span className="font-bold text-[#141A16]">{job.location}</span>
          <span className="hidden xs:inline text-stone-300 mx-1.5">•</span>
          <span className="hidden xs:inline text-stone-400">{job.turnaround}</span>
        </div>
        <Link
          to="/jobs"
          className="text-xs font-bold text-[#123E2A] hover:text-[#0B3B24] flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0"
        >
          <span>Submit Bid</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );

  return (
    <section 
      id="trades" 
      className="w-full py-12 sm:py-16 md:py-20 lg:py-24 bg-[#F5EFEB]/50 border-t border-stone-200/60 relative overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ============================================================ */}
        {/* SECTION HEADER                                               */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-12 lg:mb-14">
          <div className="max-w-[720px]">

            {/* Heading */}
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-[#141A16] leading-[1.15] sm:leading-[1.12] tracking-[-0.02em] mb-3 sm:mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
              Explore funded contracts across{' '}
              <span 
                className="font-serif italic font-normal text-[#123E2A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                every major trade.
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-[#556259] leading-[1.65] font-normal">
              Clients and homeowners post verified jobs with upfront smart escrow funding. Review detailed project scopes, submit competitive proposals, and get paid promptly upon verified milestone completion.
            </p>
          </div>

          {/* Right Action Button & Controls Group */}
          <div className="shrink-0 flex items-center gap-3">
            <Link
              to="/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0B3B24] text-white text-xs sm:text-sm font-bold px-5 sm:px-6 py-3 sm:py-3.5 rounded-full hover:bg-[#072818] transition-all shadow-md active:scale-95 whitespace-nowrap text-center"
            >
              <span>Explore All Live Jobs</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE & TABLET: PREMIUM TOUCH SLIDER (< lg)                 */}
        {/* ============================================================ */}
        <div className="block lg:hidden">
          <div 
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 gap-4 sm:gap-5 scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {jobs.map((job) => renderJobCard(job, true))}
          </div>

          {/* Premium Navigation Controls Bar (Mobile/Tablet) */}
          <div className="flex items-center justify-between mt-4 pt-2">
            {/* Slide Index Counter */}
            <div className="text-xs font-bold tracking-wider text-stone-500">
              <span className="text-[#141A16]">{String(activeIndex + 1).padStart(2, '0')}</span>
              <span className="text-stone-400 mx-1">/</span>
              <span className="text-stone-400">{String(jobs.length).padStart(2, '0')}</span>
            </div>

            {/* Pagination Pills */}
            <div className="flex items-center gap-1.5">
              {jobs.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeIndex === idx
                      ? 'w-6 bg-[#0B3B24]'
                      : 'w-2 bg-stone-300 hover:bg-stone-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next Arrow Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!canScrollPrev}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#123E2A] hover:bg-stone-50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                aria-label="Previous card"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canScrollNext}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-[#123E2A] hover:bg-stone-50 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                aria-label="Next card"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP: 3x2 BALANCED GRID (>= lg)                           */}
        {/* ============================================================ */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 lg:gap-7">
          {jobs.map((job) => renderJobCard(job, false))}
        </div>

      </div>
    </section>
  );
};

export default TradesShowcaseSection;
