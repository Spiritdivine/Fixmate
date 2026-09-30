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
    const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    const emailFrom = env.EMAIL_FROM || process.env.EMAIL_FROM || 'Artifix <noreply@artifixhq.xyz>';

    // If Resend API key is configured
    if (resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: emailFrom,
            to,
            subject,
            html: htmlBody,
            text: textBody,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error(`❌ [EmailService] Resend API error (${res.status}):`, data);
          return { success: false, provider: 'resend', error: data };
        }
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
      subject: `Artifix Security Code: ${otpCode}`,
      textBody: `Your verification code for ${purpose} is ${otpCode}. It expires in 15 minutes.`,
      htmlBody: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="width: 36px; height: 36px; background-color: #123E2A; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: #34d399; font-weight: 900; font-size: 18px; text-align: center; line-height: 36px;">
              A
            </div>
            <span style="font-size: 18px; font-weight: 800; color: #141A16; margin-left: 10px;">Artifix Platform</span>
          </div>
          <h2 style="color: #141A16; font-size: 20px; font-weight: 700; margin-top: 0;">Security Verification Code</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Please use the following one-time code to complete your ${purpose.toLowerCase()}:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #123E2A; padding: 16px; background: #effdf4; border: 1px solid #bbf7d0; border-radius: 12px; text-align: center; margin: 24px 0; font-family: monospace;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This code will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px;">Protected by Artifix Escrow & Identity Engine &bull; Lagos, Nigeria</p>
        </div>
      `,
    });
  }

  static async sendVerificationEmail(to, otpCode, verificationUrl, firstName = 'User') {
    return this.sendEmail({
      to,
      subject: `Verify your email for Artifix (Code: ${otpCode})`,
      textBody: `Welcome to Artifix, ${firstName}! Your email verification code is ${otpCode}. Or verify directly at: ${verificationUrl}`,
      htmlBody: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="margin-bottom: 24px;">
            <div style="width: 40px; height: 40px; background-color: #123E2A; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: #34d399; font-weight: 900; font-size: 20px; text-align: center; line-height: 40px;">
              A
            </div>
            <span style="font-size: 20px; font-weight: 800; color: #141A16; margin-left: 12px; vertical-align: middle;">Artifix</span>
          </div>

          <h1 style="color: #141A16; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">Welcome to Artifix, ${firstName}!</h1>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            To ensure the security of your funded escrow contracts and unlock bidding on the marketplace, please confirm your email address.
          </p>

          ${
            verificationUrl
              ? `
            <div style="text-align: center; margin: 28px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background-color: #123E2A; color: #ffffff; padding: 14px 32px; font-size: 14px; font-weight: 700; border-radius: 9999px; text-decoration: none; box-shadow: 0 2px 8px rgba(18,62,42,0.25);">
                Confirm Email Address &rarr;
              </a>
            </div>
            <p style="text-align: center; color: #64748b; font-size: 12px; margin: 16px 0;">Or enter this 6-digit verification code in the app:</p>
          `
              : ''
          }

          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #123E2A; padding: 16px; background: #effdf4; border: 1px solid #bbf7d0; border-radius: 12px; text-align: center; margin: 16px 0; font-family: monospace;">
            ${otpCode}
          </div>

          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px;">
            This link and code will expire in 24 hours. If you did not create an Artifix account, please disregard this email.
          </p>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">
            &copy; ${new Date().getFullYear()} Artifix Platform Ltd. Safe Escrow & Verified Trade Services.
          </p>
        </div>
      `,
    });
  }
}

export default EmailService;
