export interface FaqItem {
  id: string;
  q: string;
  a: string;
  category?: 'escrow' | 'verification' | 'payments' | 'disputes' | 'general';
}

export const CANONICAL_FAQS: FaqItem[] = [
  {
    id: 'substandard-work-escrow',
    q: 'What happens if an artisan does substandard work or abandons the project?',
    a: 'Your deposited funds remain 100% secure in the smart contract escrow vault. The artisan only receives disbursement for verified, approved milestones. If a dispute arises, an immediate 48-hour bilateral cure window opens. If unresolved, our neutral trade arbiters review the agreed contract scope against geotagged photographic and site evidence to disburse a prompt refund directly to your original payment method.',
    category: 'disputes',
  },
  {
    id: 'web3-crypto-knowledge',
    q: 'Do I need a crypto wallet or Web3 knowledge to use Artifix?',
    a: 'No. Artifix is built for everyday homeowners and facility managers. Over 85% of our clients fund milestones using normal Nigerian bank debit cards (Mastercard, Visa, Verve) or instant bank transfers via Paystack/NIP. Monad EVM blockchain escrow operates under the hood to guarantee tamper-proof execution without requiring any crypto knowledge.',
    category: 'payments',
  },
  {
    id: 'artisan-payout-speed',
    q: 'How do artisans get paid, and how long does settlement take?',
    a: 'The moment a client inspects and approves a completed milestone, the escrow contract settles instantly. Artisans receive immediate direct credits to their Nigerian commercial bank account (GTBank, Access, Zenith, First Bank, Kuda, etc.) with zero holding delays or withdrawal fees.',
    category: 'payments',
  },
  {
    id: 'platform-fees-transparency',
    q: "What are Artifix's platform fees, and are there any upfront paywalls?",
    a: 'Artifix charges a flat 5% escrow service fee deducted only upon successful milestone sign-off. There are zero subscription fees to join, zero fees to post jobs, and zero paywalls for artisans to bid on open opportunities across Nigeria. If a project is canceled before commencement, 100% of the funds are refunded with zero penalty fees.',
    category: 'escrow',
  },
  {
    id: 'artisan-verification-standard',
    q: 'What does Artifix require for an artisan to earn verified status?',
    a: 'Our comprehensive accreditation standard includes: (1) National Identity verification (NIN and verified biometric match), (2) Physical workshop or residential address inspection, (3) Practical trade competency and previous work audit by senior guild examiners, and (4) Clean background screening.',
    category: 'verification',
  },
  {
    id: 'emergency-repairs-scope',
    q: 'Can Artifix be used for small emergency repairs as well as major projects?',
    a: 'Yes. We support single-milestone "Rapid Fix" contracts for urgent plumbing leaks, electrical faults, or generator servicing, as well as multi-milestone contracts for large rooftop solar installations, renovations, and multi-bedroom residential builds.',
    category: 'general',
  },
  {
    id: 'operational-hubs-locations',
    q: 'Where are Artifix physical operational hubs located?',
    a: 'We maintain active testing and liaison facilities at Admiralty Way, Lekki Phase 1 in Lagos (handling practical trade assessments, electrical/solar bench tests, and dispute hearings) and Aminu Kano Crescent, Wuse II in Abuja (managing commercial facility partnerships and FCT operations).',
    category: 'general',
  },
];

/**
 * Returns JSON-LD structured data for Google FAQ schema
 */
export function getFaqSchemaJsonLd(faqs: FaqItem[] = CANONICAL_FAQS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}
