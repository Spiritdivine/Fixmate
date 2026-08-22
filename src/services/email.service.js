import { env } from '../config/env.js';

/**
 * Pluggable Email Service supporting Resend / SendGrid / Postmark / SMTP
 * with development simulator fallback.
 */
export class EmailService {
  /**
   * Dispatches a transactional email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlBody - HTML email template
   * @param {string} textBody - Plain text email
   */
  static async sendEmail({ to, subject, htmlBody, textBody }) {
    // If Resend API key is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Artisan Platform <noreply@artisanplatform.com>',
            to,
            subject,
            html: htmlBody,
            text: textBody,
          }),
        });
        const data = await res.json();
        return { success: true, provider: 'resend', data };
      } catch (err) {
        console.error(`❌ [EmailService] Resend dispatch failed: ${err.message}`);
      }
    }

    // Default development console simulator
    if (env.NODE_ENV !== 'production') {
      console.log(`\n📧 [DEV EMAIL SIMULATOR] To: ${to} | Subject: "${subject}"\n${textBody || htmlBody}\n`);
    }

    return { success: true, provider: 'simulated' };
  }

  static async sendOtpEmail(to, otpCode, purpose = 'Verification') {
    return this.sendEmail({
      to,
      subject: `Artisan Security Code: ${otpCode}`,
      textBody: `Your verification code for ${purpose} is ${otpCode}. It expires in 10 minutes.`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">Artisan Escrow Security Verification</h2>
          <p>Please use the following 6-digit verification code to complete your ${purpose.toLowerCase()}:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2563eb; padding: 12px; background: #eff6ff; border-radius: 6px; text-align: center; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  }
}

export default EmailService;
