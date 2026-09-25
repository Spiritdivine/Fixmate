/**
 * Dynamic OpenGraph & Twitter Card Image Generator
 * Generates 1200x630 high-resolution branded cards with Artifix visual identity
 */

function escapeXml(unsafe = '') {
  if (typeof unsafe !== 'string') unsafe = String(unsafe || '');
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class OgImageService {
  /**
   * Generates a 1200x630 SVG card for an Artisan Profile
   */
  static renderArtisanCard({
    name = 'Verified Artisan',
    trade = 'Skilled Artisan',
    location = 'Nigeria',
    rating = '5.0',
    reviewCount = 0,
    jobsCompleted = 0,
    isKycVerified = true,
    avatarUrl = null,
  }) {
    const safeName = escapeXml(name);
    const safeTrade = escapeXml(trade.toUpperCase());
    const safeLocation = escapeXml(location);
    const safeRating = escapeXml(String(rating));
    const safeReviews = escapeXml(String(reviewCount));
    const safeJobs = escapeXml(String(jobsCompleted));

    // Monogram fallback if no avatar
    const initials = (name.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'AF').toUpperCase();

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1811" />
      <stop offset="50%" stop-color="#123E2A" />
      <stop offset="100%" stop-color="#08140E" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FCD34D" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#174A33" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#0E2F20" stop-opacity="0.95" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Geometric Accent Grid / Circles -->
  <circle cx="1100" cy="100" r="320" stroke="#1F6344" stroke-width="1.5" stroke-opacity="0.3" fill="none" />
  <circle cx="1100" cy="100" r="480" stroke="#1F6344" stroke-width="1" stroke-opacity="0.15" fill="none" />
  <circle cx="100" cy="550" r="280" stroke="#1F6344" stroke-width="1" stroke-opacity="0.2" fill="none" />

  <!-- Top Navigation Header -->
  <g transform="translate(80, 60)">
    <!-- Brand Logo Icon & Text -->
    <rect width="44" height="44" rx="12" fill="#1A5338" stroke="#267A53" stroke-width="1.5" />
    <path d="M14 30 L22 14 L30 30 M17 25 L27 25" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <text x="56" y="31" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" letter-spacing="-0.5">ARTIFIX</text>
    <text x="175" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#6EE7B7" letter-spacing="1">TRUST NETWORK</text>

    <!-- Trust Badge Right -->
    <g transform="translate(680, 4)">
      <rect width="360" height="36" rx="18" fill="#0C2519" stroke="#1F6344" stroke-width="1.5" />
      <circle cx="20" cy="18" r="6" fill="#10B981" />
      <text x="36" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#E2E8F0" letter-spacing="0.8">MONAD SMART CONTRACT ESCROW</text>
    </g>
  </g>

  <!-- Main Profile Card Container -->
  <g transform="translate(80, 140)" filter="url(#shadow)">
    <rect width="1040" height="420" rx="28" fill="url(#cardGrad)" stroke="#267A53" stroke-width="1.5" />

    <!-- Avatar Badge Left -->
    <g transform="translate(50, 50)">
      <circle cx="70" cy="70" r="70" fill="#123E2A" stroke="#F59E0B" stroke-width="3.5" />
      <text x="70" y="85" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" fill="#FFFFFF">${initials}</text>
      <!-- Verified Badge Icon Overlay -->
      <g transform="translate(100, 100)">
        <circle cx="18" cy="18" r="18" fill="#10B981" stroke="#0A1811" stroke-width="3" />
        <path d="M11 18 L16 23 L25 14" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </g>

    <!-- Profile Details & Name -->
    <g transform="translate(230, 60)">
      <!-- Trade Pill -->
      <rect width="${Math.max(160, safeTrade.length * 10 + 36)}" height="32" rx="16" fill="#0C2519" stroke="#10B981" stroke-width="1.5" />
      <text x="18" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#6EE7B7" letter-spacing="1">${safeTrade}</text>

      ${isKycVerified ? `
      <!-- KYC Verified Pill -->
      <g transform="translate(${Math.max(160, safeTrade.length * 10 + 36) + 12}, 0)">
        <rect width="140" height="32" rx="16" fill="#1E3A8A" stroke="#60A5FA" stroke-width="1.2" />
        <text x="16" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#93C5FD" letter-spacing="0.5">✓ ID VERIFIED</text>
      </g>` : ''}

      <!-- Artisan Name -->
      <text x="0" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#FFFFFF" letter-spacing="-1">${safeName}</text>

      <!-- Location -->
      <g transform="translate(0, 105)">
        <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#A7F3D0">📍 ${safeLocation}</text>
      </g>
    </g>

    <!-- Stats Grid Bar -->
    <g transform="translate(50, 240)">
      <!-- Box 1: Rating -->
      <rect width="210" height="88" rx="18" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
      <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" letter-spacing="0.5">CLIENT RATING</text>
      <text x="24" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800" fill="#FBBF24">★ ${safeRating} <tspan font-size="15" font-weight="500" fill="#64748B">(${safeReviews})</tspan></text>

      <!-- Box 2: Completed Jobs -->
      <g transform="translate(230, 0)">
        <rect width="210" height="88" rx="18" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
        <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" letter-spacing="0.5">COMPLETED JOBS</text>
        <text x="24" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="800" fill="#FFFFFF">🛠️ ${safeJobs} Done</text>
      </g>

      <!-- Box 3: Escrow Guarantee -->
      <g transform="translate(460, 0)">
        <rect width="480" height="88" rx="18" fill="#0A1811" stroke="#F59E0B" stroke-width="1.2" />
        <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FCD34D" letter-spacing="0.8">SMART ESCROW SECURITY</text>
        <text x="24" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#E2E8F0">100% Guaranteed Milestones via Blockchain</text>
      </g>
    </g>

    <!-- Bottom Footer Strip -->
    <g transform="translate(50, 360)">
      <line x1="0" y1="0" x2="940" y2="0" stroke="#1F6344" stroke-width="1" stroke-opacity="0.8" />
      <text x="0" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#6EE7B7">Zero-Dispute Deliverable Settlements</text>
      <text x="940" y="32" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#FBBF24">Hire on Artifix →</text>
    </g>
  </g>
</svg>`;
  }

  /**
   * Generates a 1200x630 SVG card for a Trade Category
   */
  static renderTradeCard({
    name = 'Trade Category',
    tagline = 'Verified Specialists',
    description = '',
    averageBudget = 'Market Competitive',
    activeCount = 50,
  }) {
    const safeName = escapeXml(name);
    const safeTagline = escapeXml(tagline);
    const safeDesc = escapeXml(description.slice(0, 140) + (description.length > 140 ? '...' : ''));
    const safeBudget = escapeXml(averageBudget);
    const safeCount = escapeXml(String(activeCount));

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08140E" />
      <stop offset="60%" stop-color="#123E2A" />
      <stop offset="100%" stop-color="#05100B" />
    </linearGradient>
    <linearGradient id="panel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#164630" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0C2519" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Ambient circles -->
  <circle cx="1050" cy="180" r="360" stroke="#1F6344" stroke-width="1.5" stroke-opacity="0.25" fill="none" />
  <circle cx="150" cy="500" r="260" stroke="#1F6344" stroke-width="1" stroke-opacity="0.2" fill="none" />

  <!-- Header -->
  <g transform="translate(80, 60)">
    <rect width="44" height="44" rx="12" fill="#1A5338" stroke="#267A53" stroke-width="1.5" />
    <path d="M14 30 L22 14 L30 30 M17 25 L27 25" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
    <text x="56" y="31" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">ARTIFIX</text>
    <text x="180" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#6EE7B7" letter-spacing="1">TRADE BENCHMARKS</text>
  </g>

  <!-- Card Body -->
  <g transform="translate(80, 140)">
    <rect width="1040" height="420" rx="28" fill="url(#panel)" stroke="#267A53" stroke-width="1.5" />

    <g transform="translate(60, 50)">
      <rect width="190" height="32" rx="16" fill="#0C2519" stroke="#10B981" stroke-width="1.5" />
      <text x="16" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#6EE7B7" letter-spacing="1">VERIFIED CRAFT</text>

      <text x="0" y="95" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" fill="#FFFFFF" letter-spacing="-1">${safeName}</text>
      <text x="0" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600" fill="#FBBF24">${safeTagline}</text>
      <text x="0" y="172" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="400" fill="#CBD5E1">${safeDesc}</text>
    </g>

    <!-- Metrics -->
    <g transform="translate(60, 260)">
      <rect width="440" height="96" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
      <text x="24" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#94A3B8" letter-spacing="0.5">TYPICAL ESTIMATED BUDGET</text>
      <text x="24" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#FBBF24">${safeBudget}</text>

      <g transform="translate(470, 0)">
        <rect width="450" height="96" rx="20" fill="#0A1811" stroke="#10B981" stroke-width="1.2" />
        <text x="24" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#6EE7B7" letter-spacing="0.5">ACTIVE VERIFIED SPECIALISTS</text>
        <text x="24" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">⚡ ${safeCount}+ Ready to Hire</text>
      </g>
    </g>
  </g>
</svg>`;
  }

  /**
   * Generates a 1200x630 SVG default platform card
   */
  static renderDefaultCard() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08140E" />
      <stop offset="50%" stop-color="#123E2A" />
      <stop offset="100%" stop-color="#05100B" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#184D35" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0E2D1F" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1050" cy="180" r="420" stroke="#1F6344" stroke-width="1.5" stroke-opacity="0.3" fill="none" />
  <circle cx="150" cy="480" r="300" stroke="#1F6344" stroke-width="1" stroke-opacity="0.2" fill="none" />

  <g transform="translate(80, 80)">
    <rect width="1040" height="470" rx="32" fill="url(#cardGrad)" stroke="#267A53" stroke-width="1.5" />

    <g transform="translate(60, 60)">
      <rect width="52" height="52" rx="14" fill="#10B981" />
      <path d="M16 36 L26 16 L36 36 M20 30 L32 30" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
      <text x="68" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#FFFFFF">ARTIFIX</text>

      <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="50" font-weight="800" fill="#FFFFFF" letter-spacing="-1">The Verified Artisan Trust Network</text>
      <text x="0" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#A7F3D0">Bridging Fiat &amp; Smart Contract Escrow for Guaranteed Deliverables</text>

      <g transform="translate(0, 230)">
        <rect width="280" height="80" rx="16" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
        <text x="20" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">TRUST PROTOCOL</text>
        <text x="20" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#6EE7B7">100% Escrow Protected</text>

        <g transform="translate(300, 0)">
          <rect width="280" height="80" rx="16" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="20" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">VERIFICATION</text>
          <text x="20" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#FBBF24">NIN &amp; Physical Vetted</text>
        </g>

        <g transform="translate(600, 0)">
          <rect width="320" height="80" rx="16" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="20" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">BLOCKCHAIN ESCROW</text>
          <text x="20" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#60A5FA">Monad High-Speed EVM</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;
  }

  /**
   * Generates a 1200x630 SVG card for Pricing & Fee Transparency
   */
  static renderPricingCard() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08140E" />
      <stop offset="50%" stop-color="#123E2A" />
      <stop offset="100%" stop-color="#05100B" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#184D35" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0E2D1F" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1050" cy="180" r="420" stroke="#1F6344" stroke-width="1.5" stroke-opacity="0.3" fill="none" />

  <g transform="translate(80, 80)">
    <rect width="1040" height="470" rx="32" fill="url(#cardGrad)" stroke="#267A53" stroke-width="1.5" />

    <g transform="translate(60, 50)">
      <text x="0" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#6EE7B7" letter-spacing="2">ESCROW FEE TRANSPARENCY</text>
      <text x="0" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#FFFFFF" letter-spacing="-1">Honest, Predictable Escrow Fees</text>
      <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#CBD5E1">Flat 5% platform fee deducted only upon client sign-off. Zero upfront paywalls.</text>

      <g transform="translate(0, 180)">
        <rect width="280" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
        <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">FLAT ESCROW FEE</text>
        <text x="24" y="88" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#6EE7B7">5.0%</text>

        <g transform="translate(310, 0)">
          <rect width="280" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">UPFRONT PAYWALLS</text>
          <text x="24" y="88" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#FBBF24">₦0</text>
        </g>

        <g transform="translate(620, 0)">
          <rect width="300" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">UNEXECUTED REFUND</text>
          <text x="24" y="88" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#60A5FA">100%</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;
  }

  /**
   * Generates a 1200x630 SVG card for Dispute Guarantee Policy
   */
  static renderGuaranteeCard() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08140E" />
      <stop offset="50%" stop-color="#123E2A" />
      <stop offset="100%" stop-color="#05100B" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#184D35" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0E2D1F" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1050" cy="180" r="420" stroke="#1F6344" stroke-width="1.5" stroke-opacity="0.3" fill="none" />

  <g transform="translate(80, 80)">
    <rect width="1040" height="470" rx="32" fill="url(#cardGrad)" stroke="#267A53" stroke-width="1.5" />

    <g transform="translate(60, 50)">
      <text x="0" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#6EE7B7" letter-spacing="2">SETTLEMENT INTEGRITY</text>
      <text x="0" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#FFFFFF" letter-spacing="-1">The Artifix Deliverable Guarantee</text>
      <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#CBD5E1">Structured 3-tier arbitration tribunal with on-chain multi-sig enforcement.</text>

      <g transform="translate(0, 180)">
        <rect width="280" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
        <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">TIER 1 RESOLUTION</text>
        <text x="24" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#FFFFFF">48h Bilateral Cure</text>

        <g transform="translate(310, 0)">
          <rect width="280" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">TIER 2 RESOLUTION</text>
          <text x="24" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#FBBF24">Trade Arbiter Review</text>
        </g>

        <g transform="translate(620, 0)">
          <rect width="300" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">TIER 3 RESOLUTION</text>
          <text x="24" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#60A5FA">On-Chain Multi-Sig</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;
  }

  /**
   * Generates a 1200x630 SVG card for About Us & Company Story
   */
  static renderAboutCard() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08140E" />
      <stop offset="50%" stop-color="#123E2A" />
      <stop offset="100%" stop-color="#05100B" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#184D35" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0E2D1F" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1050" cy="180" r="420" stroke="#1F6344" stroke-width="1.5" stroke-opacity="0.3" fill="none" />

  <g transform="translate(80, 80)">
    <rect width="1040" height="470" rx="32" fill="url(#cardGrad)" stroke="#267A53" stroke-width="1.5" />

    <g transform="translate(60, 50)">
      <text x="0" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#6EE7B7" letter-spacing="2">FOUNDED IN LAGOS, NIGERIA</text>
      <text x="0" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#FFFFFF" letter-spacing="-1">Restoring Trust to Skilled Trades</text>
      <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#CBD5E1">Bridging Nigeria's 15M+ craftsmen with escrow-backed accountability.</text>

      <g transform="translate(0, 180)">
        <rect width="280" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
        <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">LEKKI FACILITY</text>
        <text x="24" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#6EE7B7">Lagos Testing Hub</text>

        <g transform="translate(310, 0)">
          <rect width="280" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">WUSE II FACILITY</text>
          <text x="24" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#FBBF24">Abuja Operations</text>
        </g>

        <g transform="translate(620, 0)">
          <rect width="300" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">VERIFICATION MODEL</text>
          <text x="24" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#60A5FA">Practical Trade Audits</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;
  }

  /**
   * Generates a 1200x630 SVG card for Contact Us & Support
   */
  static renderContactCard() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#08140E" />
      <stop offset="50%" stop-color="#123E2A" />
      <stop offset="100%" stop-color="#05100B" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#184D35" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0E2D1F" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1050" cy="180" r="420" stroke="#1F6344" stroke-width="1.5" stroke-opacity="0.3" fill="none" />

  <g transform="translate(80, 80)">
    <rect width="1040" height="470" rx="32" fill="url(#cardGrad)" stroke="#267A53" stroke-width="1.5" />

    <g transform="translate(60, 50)">
      <text x="0" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#6EE7B7" letter-spacing="2">DIRECT CHANNELS &amp; HUBS</text>
      <text x="0" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="#FFFFFF" letter-spacing="-1">Contact the Artifix Team</text>
      <text x="0" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#CBD5E1">Assistance for homeowners, artisans, and commercial facility deployments.</text>

      <g transform="translate(0, 180)">
        <rect width="280" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
        <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">WHATSAPP SUPPORT</text>
        <text x="24" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#6EE7B7">+234 800 ARTIFIX</text>

        <g transform="translate(310, 0)">
          <rect width="280" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">EMAIL DESK</text>
          <text x="24" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#FBBF24">support@artifixhq.xyz</text>
        </g>

        <g transform="translate(620, 0)">
          <rect width="300" height="120" rx="20" fill="#0A1811" stroke="#1F6344" stroke-width="1.2" />
          <text x="24" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94A3B8">OPERATING HOURS</text>
          <text x="24" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#60A5FA">Mon–Fri: 8am–7pm</text>
        </g>
      </g>
    </g>
  </g>
</svg>`;
  }
}

export default OgImageService;
