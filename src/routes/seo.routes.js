import { Router } from 'express';
import { SeoController } from '../controllers/seo.controller.js';

const router = Router();

// Sitemap & Robots
router.get('/sitemap.xml', SeoController.getSitemapXml);
router.get('/robots.txt', SeoController.getRobotsTxt);

// Dynamic OpenGraph Image Previews
router.get('/og/artisan/:id', SeoController.getArtisanOgImage);
router.get('/og/trade/:slug', SeoController.getTradeOgImage);
router.get('/og/pricing', SeoController.getPricingOgImage);
router.get('/og/guarantee', SeoController.getGuaranteeOgImage);
router.get('/og/about', SeoController.getAboutOgImage);
router.get('/og/contact', SeoController.getContactOgImage);
router.get('/og/default', SeoController.getDefaultOgImage);

export default router;
