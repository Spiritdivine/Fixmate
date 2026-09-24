import prisma from '../config/db.js';
import { env } from '../config/env.js';

const BOT_USER_AGENTS = [
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'whatsapp',
  'slackbot',
  'telegrambot',
  'discordbot',
  'applebot',
  'google-inspectiontool',
  'yandexbot',
  'bingbot',
];

function isBot(userAgent = '') {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

function escapeHtml(str = '') {
  if (typeof str !== 'string') str = String(str || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function crawlerMetaMiddleware(req, res, next) {
  // Only process GET requests from social crawlers
  if (req.method !== 'GET') return next();

  const userAgent = req.headers['user-agent'] || '';
  if (!isBot(userAgent)) {
    return next();
  }

  const host = req.get('host') || 'artifix.app';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const siteUrl = (env.CLIENT_URL && !env.CLIENT_URL.includes('*'))
    ? env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '')
    : `${protocol}://${host}`;

  const path = req.path;

  // 1. Artisan Profile Share: /p/:id or /artisans/:id
  const artisanMatch = path.match(/^\/(?:p|artisans)\/([a-zA-Z0-9_-]+)/);
  if (artisanMatch) {
    const artisanId = artisanMatch[1];
    try {
      const artisan = await prisma.artisanProfile.findFirst({
        where: {
          OR: [{ id: artisanId }, { userId: artisanId }],
        },
        include: {
          user: true,
          skills: {
            include: { skill: true },
          },
        },
      });

      if (artisan) {
        const name = artisan.businessName || artisan.user?.fullName || artisan.user?.email?.split('@')[0] || 'Verified Artisan';
        const trade = artisan.skills?.[0]?.skill?.name || 'Skilled Artisan';
        const location = [artisan.lgaCity, artisan.state || 'Nigeria'].filter(Boolean).join(', ');
        const rating = artisan.rating ? Number(artisan.rating).toFixed(1) : '5.0';
        const reviews = artisan.reviewCount || 0;
        const jobs = artisan.completedJobs || 0;

        const title = `${name} – Verified ${trade} in ${location} | Artifix`;
        const description = `Hire ${name} (${trade}) on Artifix. Rated ★ ${rating} (${reviews} reviews) with ${jobs} completed jobs. 100% money-back smart contract escrow guarantee on Monad blockchain.`;
        const pageUrl = `${siteUrl}/p/${artisan.id}`;
        const ogImageUrl = `${protocol}://${host}/api/v1/og/artisan/${artisan.id}`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">

  <!-- OpenGraph / Facebook / WhatsApp -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(ogImageUrl)}">
  <meta property="og:image:type" content="image/svg+xml">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Artifix">

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@ArtifixEscrow">
  <meta name="twitter:creator" content="@ArtifixEscrow">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "${escapeHtml(name)}",
    "image": "${escapeHtml(artisan.profilePhoto || ogImageUrl)}",
    "description": "${escapeHtml(description)}",
    "telephone": "+234",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "${escapeHtml(artisan.lgaCity || 'Lagos')}",
      "addressRegion": "${escapeHtml(artisan.state || 'Lagos')}",
      "addressCountry": "NG"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "${rating}",
      "reviewCount": "${Math.max(1, reviews)}"
    }
  }
  </script>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <a href="${escapeHtml(pageUrl)}">View Full Verified Profile</a>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
      }
    } catch (e) {
      console.warn('⚠️ Error rendering crawler meta for artisan:', e.message);
    }
  }

  // 2. Trades Catalog Category: /trades/:slug
  const tradeMatch = path.match(/^\/trades\/([a-zA-Z0-9_-]+)/);
  if (tradeMatch) {
    const slug = tradeMatch[1];
    const tradeTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const title = `${tradeTitle} – Verified Artisans & Price Benchmarks | Artifix`;
    const description = `Compare transparent Nigerian market pricing estimates, standard deliverables, and hire verified ${tradeTitle} specialists with 100% money-back escrow protection.`;
    const pageUrl = `${siteUrl}/trades/${slug}`;
    const ogImageUrl = `${protocol}://${host}/api/v1/og/trade/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(ogImageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Artifix">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <a href="${escapeHtml(pageUrl)}">Explore Trades on Artifix</a>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  // Fallthrough to standard handler
  next();
}

export default crawlerMetaMiddleware;
