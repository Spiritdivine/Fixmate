import { Router } from 'express';
import { SeoController } from '../controllers/seo.controller.js';
import { httpCache } from '../middlewares/http-cache.middleware.js';

const router = Router();

// Sitemap & Robots (Cached for 12 hours)
router.get('/sitemap.xml', httpCache({ maxAge: 43200, staleWhileRevalidate: 86400 }), SeoController.getSitemapXml);
router.get('/robots.txt', httpCache({ maxAge: 86400, staleWhileRevalidate: 604800 }), SeoController.getRobotsTxt);

// Dynamic OpenGraph Image Previews (Cached for 24 hours)
const ogCache = httpCache({ maxAge: 86400, staleWhileRevalidate: 604800 });
router.get('/og/artisan/:id', ogCache, SeoController.getArtisanOgImage);
router.get('/og/trade/:slug', ogCache, SeoController.getTradeOgImage);
router.get('/og/pricing', ogCache, SeoController.getPricingOgImage);
router.get('/og/guarantee', ogCache, SeoController.getGuaranteeOgImage);
router.get('/og/about', ogCache, SeoController.getAboutOgImage);
router.get('/og/contact', ogCache, SeoController.getContactOgImage);
router.get('/og/default', ogCache, SeoController.getDefaultOgImage);

export default router;
