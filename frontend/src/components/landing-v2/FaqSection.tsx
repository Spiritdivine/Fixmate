import React, { useState } from 'react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What happens if an artisan does substandard work or abandons the project?',
      a: 'Your funds remain 100% secure in the escrow vault. The artisan only receives funds for approved milestones. If a dispute arises, our 48-Hour Dispute Tribunal reviews the agreed contract scope against uploaded photo/video logs. If work is incomplete or defective, funds are refunded directly to your original payment method.',
    },
    {
      q: 'Do I need a crypto wallet or Web3 knowledge to use Artifix?',
      a: 'Absolutely not! Artifix is built for everyone. Over 85% of our clients pay using normal Nigerian bank debit cards (Mastercard, Visa, Verve) or instant bank transfers. Crypto rails via Monad are an optional superpower for tech-native users and diaspora clients.',
    },
    {
      q: 'How do artisans get paid, and how long does settlement take?',
      a: 'The moment a client taps "Approve Milestone", the escrow contract executes settlement instantly. Artisans receive an immediate direct credit to their Nigerian bank account (GTBank, Access, Zenith, Kuda, etc.) or their connected Monad wallet with zero holding delay.',
    },
    {
      q: 'What does Artifix require for an artisan to earn the "Verified" badge?',
      a: 'Our 4-stage verification process includes: (1) National Identity Verification (NIN / BVN match), (2) Physical workshop or residential address verification, (3) Practical trade competency and previous work audit, and (4) Clean criminal background check.',
    },
    {
      q: "What are Artifix's platform fees?",
      a: 'Artifix charges a nominal 3% to 5% escrow service fee on successfully completed milestones to cover payment gateway processing, proof-of-work storage, and dispute mediation. There are zero subscription fees to post jobs or list your craft.',
    },
    {
      q: 'Can I use Artifix for small emergency repairs (e.g., burst pipe, electrical spark)?',
      a: 'Yes! We support single-milestone "Rapid Fix" contracts for immediate repairs, as well as multi-phase contracts for month-long home building or renovation projects.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="w-full py-16 sm:py-20 lg:py-24 bg-[#F5EFEB]/50 border-t border-stone-200/60 relative overflow-hidden">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#123E2A]/10 text-[#123E2A] text-[11px] font-bold tracking-[0.18em] uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#123E2A]" />
            FREQUENTLY ASKED QUESTIONS
          </div>

          <h2 
            className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#141A16] leading-[1.12] tracking-[-0.02em] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Everything you need to know about{' '}
            <span 
              className="font-serif italic font-normal text-[#123E2A]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Artifix escrow
            </span>.
          </h2>

          <p className="text-sm sm:text-base text-[#556259] leading-[1.65] font-normal">
            Clear answers to common questions about milestone funding, artisan vetting, and guaranteed payouts.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123E2A]"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-[#141A16]">
                    {faq.q}
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-[#123E2A] text-white' : 'text-stone-600'}`}>
                    <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-[#556259] leading-relaxed border-t border-stone-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FaqSection;
