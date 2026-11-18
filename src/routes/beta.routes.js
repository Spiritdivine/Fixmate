import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware.js';
import { standardApiLimiter } from '../config/rate-limiter.js';
import EmailService from '../services/email.service.js';

const router = Router();

const betaSignupSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    role: z.enum(['client', 'artisan', 'CLIENT', 'ARTISAN']),
    craftOrSkill: z.string().max(100).optional().nullable(),
    city: z.string().max(100).optional().default('Abuja'),
    phone: z.string().max(30).optional().nullable(),
    hp_field: z.string().max(0).optional(), // Honeypot anti-spam field
  }),
});

router.post(
  '/signup',
  standardApiLimiter,
  validate(betaSignupSchema),
  async (req, res) => {
    try {
      const { fullName, email, role, craftOrSkill, city = 'Abuja', hp_field } = req.body;

      const normalizedRole = role.toLowerCase() === 'artisan' ? 'artisan' : 'client';
      const referenceCode = 'AFX-BETA-' + Math.floor(100000 + Math.random() * 900000);

      // Configurable WhatsApp links with production fallbacks (placeholders ready for slotting)
      const clientWhatsAppUrl =
        process.env.WHATSAPP_CLIENT_BETA_URL || 'https://chat.whatsapp.com/artifix-abuja-clients';
      const artisanWhatsAppUrl =
        process.env.WHATSAPP_ARTISAN_BETA_URL || 'https://chat.whatsapp.com/artifix-abuja-artisans';
      const targetWhatsAppUrl = normalizedRole === 'artisan' ? artisanWhatsAppUrl : clientWhatsAppUrl;

      // Silent drop if honeypot triggered by bot
      if (hp_field) {
        return res.status(200).json({
          success: true,
          message: 'Your application has been received. Onboarding details will be dispatched to your email.',
          ticketId: referenceCode,
          role: normalizedRole,
          whatsappUrl: targetWhatsAppUrl,
        });
      }

      console.log(
        `📋 [Beta Application ${referenceCode}] ${fullName} (${email}) - Role: ${normalizedRole}${
          craftOrSkill ? ` [Trade: ${craftOrSkill}]` : ''
        } - Pilot City: ${city}`
      );

      // Non-blocking email dispatch with inline styled brand email and role-specific WhatsApp links
      EmailService.sendBetaWelcomeEmail({
        to: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role: normalizedRole,
        craftOrSkill: craftOrSkill ? craftOrSkill.trim() : undefined,
        ticketId: referenceCode,
        city,
      }).catch((emailErr) => {
        console.error(`⚠️ [Beta Welcome Email] Failed to send email to ${email}:`, emailErr?.message || emailErr);
      });

      return res.status(200).json({
        success: true,
        message: 'Your application has been received! A welcome email with your onboarding details has been sent.',
        ticketId: referenceCode,
        role: normalizedRole,
        whatsappUrl: targetWhatsAppUrl,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Beta signup error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to process beta application. Please try again.',
      });
    }
  }
);

export default router;

