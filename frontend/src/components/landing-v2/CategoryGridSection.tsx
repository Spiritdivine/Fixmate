import React from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '../../lib/posthog';

interface CategoryItem {
  id: string;
  name: string;
  queryParam: string;
  icon: React.ReactNode;
}

export const CategoryGridSection: React.FC = () => {
  // 10 Core Artisan & Skilled Trade Categories
  const artisanTrades: CategoryItem[] = [
    {
      id: 'solar-energy',
      name: 'Solar & Clean\nEnergy',
      queryParam: 'solar-and-inverters',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Sun / Rays */}
          <circle cx="14" cy="7" r="2.5" />
          <line x1="14" y1="2" x2="14" y2="3.5" />
          <line x1="8.5" y1="7" x2="10" y2="7" />
          <line x1="18" y1="7" x2="19.5" y2="7" />
          {/* Solar Array Panel */}
          <polygon points="5 22 8 13 20 13 23 22 5 22" />
          <line x1="14" y1="13" x2="14" y2="22" />
          <line x1="9.5" y1="17.5" x2="18.5" y2="17.5" />
        </svg>
      ),
    },
    {
      id: 'electrical-wiring',
      name: 'Electrical &\nWiring',
      queryParam: 'electrical-and-wiring',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Power Plug & Circuit Sparks */}
          <rect x="7" y="10" width="14" height="10" rx="3" />
          <line x1="10" y1="4" x2="10" y2="10" />
          <line x1="18" y1="4" x2="18" y2="10" />
          <path d="M14 20v4" />
          {/* Spark Bolt */}
          <path d="M12.5 13l2 2-1 2 2.5.5" />
        </svg>
      ),
    },
    {
      id: 'plumbing-pipefitting',
      name: 'Plumbing &\nPipefitting',
      queryParam: 'plumbing-and-pipefitting',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Precision Pipe Wrench with Water Droplet */}
          <path d="M19 5a3.5 3.5 0 0 0-4.5 4.5L5.5 18.5a2 2 0 0 0 2.8 2.8L17.5 12A3.5 3.5 0 0 0 22 7.5l-3 3-1.5-.5-.5-1.5 2-3.5z" />
          <path d="M10 8c0 2-2 3.5-2 3.5S6 10 6 8a2 2 0 0 1 4 0z" fill="#108A00" fillOpacity="0.15" />
        </svg>
      ),
    },
    {
      id: 'carpentry-woodwork',
      name: 'Carpentry &\nWoodwork',
      queryParam: 'carpentry-and-woodwork',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Hand Saw & Wood Joinery */}
          <path d="M22 6L8 18l-4-1 1-4L19 3l3 3z" />
          <path d="M11 15l2 1 2-1 2 1 2-1" />
          <rect x="18.5" y="4" width="5" height="5" rx="1.5" />
          <circle cx="21" cy="6.5" r="0.75" fill="currentColor" />
          <line x1="4" y1="23" x2="24" y2="23" />
        </svg>
      ),
    },
    {
      id: 'masonry-tiling',
      name: 'Masonry &\nTiling',
      queryParam: 'masonry-and-tiling',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Bricklayer Trowel & Tiling Matrix */}
          <path d="M14 4l8 8-8 8-4-4 4-4-4-4 4-4z" />
          <path d="M6 22l4-4" />
          <rect x="4" y="20" width="4" height="4" rx="1" />
        </svg>
      ),
    },
    {
      id: 'hvac-ac',
      name: 'HVAC & Air\nConditioning',
      queryParam: 'hvac-and-ac-repair',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Split AC Unit with Cold Air Flow */}
          <rect x="4" y="6" width="20" height="9" rx="2" />
          <line x1="7" y1="11" x2="21" y2="11" />
          <circle cx="20" cy="8.5" r="0.8" fill="currentColor" />
          <path d="M8 18c1 1.5 2 2 4 2s3-.5 4-2" />
          <path d="M10 22c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
        </svg>
      ),
    },
    {
      id: 'painting-pop',
      name: 'Painting & POP\nCeilings',
      queryParam: 'painting-and-pop',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Paint Roller & Fresh Drip */}
          <rect x="5" y="4" width="16" height="6" rx="2" />
          <path d="M21 7h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-9v6" />
          <rect x="12" y="21" width="4" height="4" rx="1" />
          <path d="M7 10v2a1 1 0 0 0 2 0v-2" />
        </svg>
      ),
    },
    {
      id: 'welding-fabrication',
      name: 'Welding &\nFabrication',
      queryParam: 'welding-and-fabrication',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Welder Mask / Torch with Sparks */}
          <path d="M7 6h14v10a7 7 0 0 1-14 0V6z" />
          <rect x="10" y="9" width="8" height="3.5" rx="1" />
          <path d="M4 22l4-4" />
          <line x1="3" y1="18" x2="6" y2="18" />
          <line x1="5" y1="24" x2="5" y2="21" />
        </svg>
      ),
    },
    {
      id: 'generator-mechanics',
      name: 'Generators &\nMechanics',
      queryParam: 'generator-and-auto',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Generator Engine & Gear Cog */}
          <circle cx="14" cy="14" r="5" />
          <path d="M14 5v3M14 20v3M5 14h3M20 14h3M7.6 7.6l2.1 2.1M18.3 18.3l2.1 2.1M7.6 20.4l2.1-2.1M18.3 9.7l2.1-2.1" />
        </svg>
      ),
    },
    {
      id: 'aluminium-roofing',
      name: 'Aluminium &\nRoofing',
      queryParam: 'aluminium-and-roofing',
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-[#108A00] stroke-current"
          viewBox="0 0 28 28"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Roof Truss & Architectural Window Frame */}
          <path d="M3 13L14 4l11 9" />
          <rect x="7" y="13" width="14" height="11" rx="1" />
          <line x1="14" y1="13" x2="14" y2="24" />
          <line x1="7" y1="18.5" x2="21" y2="18.5" />
        </svg>
      ),
    },
  ];

  return (
    <section 
      id="categories"
      aria-label="Find verified artisans by trade category"
      className="w-full bg-[#FAF7F0] py-10 sm:py-14 lg:py-16"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="mb-7 sm:mb-9 lg:mb-10">
          <h2 
            className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-[#141A16] leading-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Find artisans for every type of work
          </h2>
        </div>

        {/* 10-Card Category Grid: Borderless cards with subtle shadow */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {artisanTrades.map((cat) => (
            <Link
              key={cat.id}
              to={`/client/find-artisans?category=${cat.queryParam}`}
              onClick={() =>
                trackEvent('landing_v2_category_clicked', {
                  category_id: cat.id,
                  category_name: cat.name.replace('\n', ' '),
                })
              }
              className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[135px] sm:min-h-[155px] lg:min-h-[165px] text-left select-none"
            >
              {/* Top: Green Lineart Icon */}
              <div className="mb-4 sm:mb-6 transition-transform duration-200 group-hover:scale-110 origin-top-left">
                {cat.icon}
              </div>

              {/* Bottom: Category Name */}
              <div className="mt-auto">
                <span className="block text-[14px] sm:text-[15px] lg:text-[16px] font-semibold text-[#141A16] group-hover:text-[#108A00] transition-colors leading-[1.28] whitespace-pre-line">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
