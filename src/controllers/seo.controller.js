import prisma from '../config/db.js';
import { OgImageService } from '../services/og-image.service.js';
import { env } from '../config/env.js';

// Pre-defined trade definitions for SEO & OpenGraph previews
const TRADE_DEFINITIONS = {
  'solar-and-inverters': {
    name: 'Solar & Clean Energy',
    tagline: 'Certified Solar Installers & Inverter Engineers',
    description: 'Rooftop solar panel mounting, hybrid inverter synchronization, and battery storage setup.',
    averageBudget: '₦80,000 – ₦650,000',
    activeCount: 142,
  },
  'electrical-and-wiring': {
    name: 'Electrical & Wiring',
    tagline: 'Licensed Domestic & Industrial Electricians',
    description: 'Conduit piping, 3-phase wiring, distribution board balancing, and earthing installation.',
    averageBudget: '₦25,000 – ₦220,000',
    activeCount: 198,
  },
  'plumbing-and-pipefitting': {
    name: 'Plumbing & Pipefitting',
    tagline: 'Master Plumbers & Pressure Systems Specialists',
    description: 'PPR pipe welding, overhead tank installations, water heater repairs, and drainage unblocking.',
    averageBudget: '₦20,000 – ₦180,000',
    activeCount: 165,
  },
  'carpentry-and-woodwork': {
    name: 'Carpentry & Woodwork',
    tagline: 'Bespoke Cabinetry & Architectural Woodworkers',
    description: 'Kitchen cabinet design, hardwood roofing trusses, wardrobe installations, and door hangings.',
    averageBudget: '₦45,000 – ₦450,000',
    activeCount: 120,
  },
  'painting-and-pop': {
    name: 'Painting & POP Design',
    tagline: 'POP False Ceiling Crafters & Master Painters',
    description: 'Contemporary POP design, screeding, emulsion/gloss wall coatings, and moisture treatment.',
    averageBudget: '₦35,000 – ₦320,000',
    activeCount: 110,
  },
  'hvac-and-ac-repair': {
    name: 'HVAC & AC Repair',
    tagline: 'Certified Inverter AC Technicians & Refrigeration Techs',
    description: 'Split unit installation, refrigerant gas charging, compressor replacements, and preventative servicing.',
    averageBudget: '₦15,000 – ₦150,000',
    activeCount: 135,
  },
  'masonry-and-tiling': {
    name: 'Masonry & Tiling',
    tagline: 'Precision Tile Setters & Structural Bricklayers',
    description: 'Vitrified and porcelain floor tiling, block setting, plastering, and granite countertop installation.',
    averageBudget: '₦40,000 – ₦380,000',
    activeCount: 154,
  },
  'aluminium-and-roofing': {
    name: 'Aluminium & Roofing',
    tagline: 'Longspan Aluminium Fabricators & Glaziers',
    description: 'Stone-coated metal roofing sheets, sliding glass windows, casement doors, and structural cladding.',
    averageBudget: '₦70,000 – ₦850,000',
    activeCount: 88,
  },
};

export class SeoController {
  /**
   * Generates dynamic sitemap.xml with live verified artisans and jobs
   */
  static async getSitemapXml(req, res) {
    try {
      const baseUrl = (env.CLIENT_URL && !env.CLIENT_URL.includes('*'))
        ? env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '')
        : 'https://artifix.app';

      // 1. Fetch active verified artisans
      let verifiedArtisans = [];
      try {
        verifiedArtisans = await prisma.artisanProfile.findMany({
          where: {
            user: {
              status: 'ACTIVE',
              isKycVerified: true,
            },
          },
          select: {
            id: true,
            businessName: true,
            state: true,
            updatedAt: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
          take: 500,
        });
      } catch (e) {
        console.warn('⚠️ Unable to query artisans for sitemap:', e.message);
      }

      // 2. Fetch recent open jobs
      let openJobs = [];
      try {
        openJobs = await prisma.job.findMany({
          where: {
            status: 'OPEN',
          },
          select: {
            id: true,
            title: true,
            updatedAt: true,
          },
          take: 100,
        });
      } catch (e) {
        console.warn('⚠️ Unable to query jobs for sitemap:', e.message);
      }

      const today = new Date().toISOString().split('T')[0];

      // Build XML
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

      // Static Marketing Routes
      const staticRoutes = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/artisans', priority: '0.9', changefreq: 'daily' },
        { loc: '/trades', priority: '0.9', changefreq: 'weekly' },
        { loc: '/jobs', priority: '0.9', changefreq: 'daily' },
        { loc: '/pricing', priority: '0.85', changefreq: 'monthly' },
        { loc: '/guarantee', priority: '0.85', changefreq: 'monthly' },
        { loc: '/about', priority: '0.8', changefreq: 'monthly' },
        { loc: '/contact', priority: '0.8', changefreq: 'monthly' },
        { loc: '/security', priority: '0.8', changefreq: 'monthly' },
        { loc: '/terms', priority: '0.5', changefreq: 'monthly' },
        { loc: '/privacy', priority: '0.5', changefreq: 'monthly' },
      ];

      for (const route of staticRoutes) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}${route.loc}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
        xml += `    <priority>${route.priority}</priority>\n`;
        xml += `  </url>\n`;
      }

      // Trade Categories
      for (const slug of Object.keys(TRADE_DEFINITIONS)) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/trades/${slug}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.85</priority>\n`;
        xml += `  </url>\n`;
      }

      // Verified Artisans
      for (const artisan of verifiedArtisans) {
        const lastmod = artisan.updatedAt ? new Date(artisan.updatedAt).toISOString().split('T')[0] : today;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/p/${artisan.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.80</priority>\n`;
        if (artisan.user?.avatarUrl) {
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${artisan.user.avatarUrl}</image:loc>\n`;
          xml += `      <image:title>${artisan.businessName || 'Verified Artisan'}</image:title>\n`;
          xml += `    </image:image>\n`;
        }
        xml += `  </url>\n`;
      }

      // Open Jobs
      for (const job of openJobs) {
        const lastmod = job.updatedAt ? new Date(job.updatedAt).toISOString().split('T')[0] : today;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/jobs/${job.id}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.70</priority>\n`;
        xml += `  </url>\n`;
      }

      xml += `</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      return res.status(200).send(xml);
    } catch (error) {
      console.error('Error generating sitemap.xml:', error);
      return res.status(500).send('Error generating sitemap');
    }
  }

  /**
   * Serves dynamic robots.txt
   */
  static getRobotsTxt(req, res) {
    const baseUrl = (env.CLIENT_URL && !env.CLIENT_URL.includes('*'))
      ? env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '')
      : 'https://artifix.app';

    const robots = `# Artifix Robots Governance
User-agent: *
Allow: /
Allow: /trades
Allow: /trades/*
Allow: /artisans
Allow: /p/
Allow: /jobs
Allow: /security
Allow: /terms
Allow: /privacy
Disallow: /dashboard
Disallow: /artisan/*
Disallow: /client/*
Disallow: /admin/*
Disallow: /auth/*
Disallow: /login
Disallow: /register
Disallow: /api/*
Allow: /api/v1/seo/sitemap.xml
Allow: /api/v1/og/*

# Social Crawlers
User-agent: Twitterbot
User-agent: facebookexternalhit
User-agent: LinkedInBot
User-agent: WhatsApp
User-agent: Slackbot
Allow: /

# GEO / AI Agents
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: PerplexityBot
Allow: /
Allow: /trades
Allow: /artisans
Allow: /p/
Disallow: /dashboard
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml
`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(robots);
  }

  /**
   * Generates dynamic OpenGraph SVG preview for an Artisan
   */
  static async getArtisanOgImage(req, res) {
    const { id } = req.params;

    let artisanData = {
      name: 'Verified Artisan',
      trade: 'Skilled Artisan',
      location: 'Lagos, Nigeria',
      rating: '5.0',
      reviewCount: 1,
      jobsCompleted: 1,
      isKycVerified: true,
    };

    try {
      const artisan = await prisma.artisanProfile.findFirst({
        where: {
          OR: [{ id: id }, { userId: id }],
        },
        include: {
          user: true,
          skills: {
            include: { skill: true },
          },
        },
      });

      if (artisan) {
        const tradeName =
          artisan.skills?.[0]?.skill?.name ||
          artisan.skills?.[0]?.skill?.category?.name ||
          'Skilled Artisan';
        const loc = [artisan.lgaCity, artisan.state || 'Nigeria'].filter(Boolean).join(', ');

        artisanData = {
          name: artisan.businessName || artisan.user?.fullName || artisan.user?.email?.split('@')[0] || 'Verified Artisan',
          trade: tradeName,
          location: loc || 'Nigeria',
          rating: String(artisan.rating || '5.0'),
          reviewCount: artisan.reviewCount || 0,
          jobsCompleted: artisan.completedJobs || 0,
          isKycVerified: artisan.kycStatus === 'APPROVED' || artisan.isVerified,
        };
      }
    } catch (e) {
      console.warn('⚠️ Unable to query artisan for OG preview:', e.message);
    }

    const svg = OgImageService.renderArtisanCard(artisanData);

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  }

  /**
   * Generates dynamic OpenGraph SVG preview for a Trade Category
   */
  static getTradeOgImage(req, res) {
    const { slug } = req.params;
    const trade = TRADE_DEFINITIONS[slug] || {
      name: slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Verified Trade',
      tagline: 'Verified Craft Specialists & Escrow Protection',
      description: 'Find verified master tradesmen across Nigeria with smart contract escrow guarantees.',
      averageBudget: 'Competitive Market Rates',
      activeCount: 50,
    };

    const svg = OgImageService.renderTradeCard(trade);

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  }

  /**
   * Generates dynamic default OpenGraph SVG preview
   */
  static getDefaultOgImage(req, res) {
    const svg = OgImageService.renderDefaultCard();

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  }

  /**
   * Generates dynamic OpenGraph SVG preview for Pricing Page
   */
  static getPricingOgImage(req, res) {
    const svg = OgImageService.renderPricingCard();

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  }

  /**
   * Generates dynamic OpenGraph SVG preview for Guarantee & Dispute Page
   */
  static getGuaranteeOgImage(req, res) {
    const svg = OgImageService.renderGuaranteeCard();

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  }

  /**
   * Generates dynamic OpenGraph SVG preview for About Us Page
   */
  static getAboutOgImage(req, res) {
    const svg = OgImageService.renderAboutCard();

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  }

  /**
   * Generates dynamic OpenGraph SVG preview for Contact Us Page
   */
  static getContactOgImage(req, res) {
    const svg = OgImageService.renderContactCard();

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(svg);
  }
}

export default SeoController;
