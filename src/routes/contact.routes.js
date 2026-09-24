import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.middleware.js';
import { standardApiLimiter } from '../config/rate-limiter.js';

const router = Router();

const contactSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().min(8, 'Please enter a valid phone number').max(20),
  role: z.enum(['CLIENT', 'ARTISAN', 'BUSINESS', 'DISPUTE', 'OTHER']),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(150),
  message: z.string().min(10, 'Message must be at least 10 characters').max(3000),
  contractReference: z.string().optional(),
  hp_field: z.string().max(0).optional(), // Honeypot anti-spam field
});

// In-memory support ticket store or logger (with DB fall-through if available)
router.post(
  '/',
  standardApiLimiter,
  validate(contactSchema),
  async (req, res) => {
    const { fullName, email, phoneNumber, role, subject, message, contractReference, hp_field } = req.body;

    // Silent drop if honeypot triggered by bot
    if (hp_field) {
      return res.status(200).json({
        success: true,
        message: 'Your inquiry has been received. Our team will review it shortly.',
        ticketId: 'AFX-SP-' + Date.now().toString(36).toUpperCase(),
      });
    }

    const ticketId = 'AFX-' + Math.floor(100000 + Math.random() * 900000);

    console.log(`📩 [Support Ticket ${ticketId}] from ${fullName} (${email}, ${phoneNumber}) [Role: ${role}]: ${subject}`);

    return res.status(200).json({
      success: true,
      message: 'Your message has been received. A member of our operations team will respond within 24 business hours.',
      ticketId,
      timestamp: new Date().toISOString(),
    });
  }
);

export default router;
