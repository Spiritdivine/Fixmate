import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MessageCircle, ArrowRight } from 'lucide-react';
import { CANONICAL_FAQS, FaqItem, getFaqSchemaJsonLd } from '../../data/canonicalFaqs';

export interface FrequentlyAskedQuestionsProps {
  id?: string;
  className?: string;
  title?: string;
  highlightedWord?: string;
  subtitle?: string;
  faqs?: FaqItem[];
  showContactCta?: boolean;
  embedded?: boolean;
}

export const FrequentlyAskedQuestions: React.FC<FrequentlyAskedQuestionsProps> = ({
  id = 'faq',
  className = '',
  title = 'Everything you need to know about',
  highlightedWord = 'Artifix escrow.',
  subtitle = 'Clear, definitive answers to common inquiries regarding milestone funding, artisan vetting, and guaranteed payouts across Nigeria.',
  faqs = CANONICAL_FAQS,
  showContactCta = true,
  embedded = false,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const schemaJsonLd = getFaqSchemaJsonLd(faqs);

  const content = (
    <div className="max-w-[920px] mx-auto">
      {/* Inject FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />

      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#6A7B70] uppercase mb-3">
          FREQUENTLY ASKED QUESTIONS
        </div>

        <h2
          className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-[#141A16] leading-[1.15] tracking-tight mb-3"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          {title}{' '}
          <span
            className="font-serif italic font-normal text-[#123E2A]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {highlightedWord}
          </span>
        </h2>

        {subtitle && (
          <p className="text-xs sm:text-sm text-[#556259] leading-relaxed max-w-2xl mx-auto font-normal">
            {subtitle}
          </p>
        )}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const faqItemId = `faq-item-${idx}`;
          const faqHeaderId = `faq-header-${idx}`;

          return (
            <div
              key={faq.id || idx}
              className="bg-white rounded-2xl border border-stone-200/70 overflow-hidden shadow-[0_2px_8px_rgba(20,26,22,0.03)] hover:border-stone-300 transition-colors"
            >
              <button
                type="button"
                id={faqHeaderId}
                aria-expanded={isOpen}
                aria-controls={faqItemId}
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123E2A] cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold text-[#141A16] leading-snug">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#123E2A]' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div
                  id={faqItemId}
                  role="region"
                  aria-labelledby={faqHeaderId}
                  className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-[13px] text-[#556259] leading-relaxed border-t border-stone-100 pt-3 font-normal"
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Optional Contact Help Link */}
      {showContactCta && (
        <div className="mt-10 sm:mt-12 text-center pt-8 border-t border-stone-200/60 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-stone-600 font-normal">
          <span>Still have an unanswered question about active jobs or escrow?</span>
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 text-[#123E2A] font-semibold hover:underline"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Speak with our support desk</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div id={id} className={`w-full ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <section
      id={id}
      className={`w-full py-16 sm:py-20 lg:py-24 bg-[#FAF7F0] border-t border-stone-200/60 relative overflow-hidden ${className}`}
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  );
};

export default FrequentlyAskedQuestions;
