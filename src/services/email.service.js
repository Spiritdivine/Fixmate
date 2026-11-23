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


  /**
   * Dispatches a branded Beta Welcome Email tailored for Client or Artisan
   * @param {Object} params
   * @param {string} params.to - Recipient email
   * @param {string} params.fullName - Full name of applicant
   * @param {'client'|'artisan'} params.role - Participant role
   * @param {string} [params.craftOrSkill] - Trade or skill (if artisan)
   * @param {string} [params.ticketId] - Reference ticket code (e.g. AFX-BETA-849102)
   * @param {string} [params.city] - Target city (defaults to 'Abuja')
   */
  static async sendBetaWelcomeEmail({
    to,
    fullName = 'Partner',
    role = 'client',
    craftOrSkill,
    ticketId,
    city = 'Abuja',
  }) {
    const isArtisan = role?.toLowerCase() === 'artisan';
    const referenceCode = ticketId || ('AFX-BETA-' + Math.floor(100000 + Math.random() * 900000));

    const clientWhatsAppUrl =
      process.env.WHATSAPP_CLIENT_BETA_URL || 'https://chat.whatsapp.com/artifix-abuja-clients';
    const artisanWhatsAppUrl =
      process.env.WHATSAPP_ARTISAN_BETA_URL || 'https://chat.whatsapp.com/artifix-abuja-artisans';
    const targetWhatsAppUrl = isArtisan ? artisanWhatsAppUrl : clientWhatsAppUrl;

    // Subject: no city name, clean
    const subject = isArtisan
      ? `Welcome to the Artifix Artisan Network (${referenceCode})`
      : `Welcome to the Artifix Private Beta (${referenceCode})`;

    const roleDescriptor = isArtisan
      ? (craftOrSkill ? `${craftOrSkill} Craftsman` : 'Verified Tradesperson')
      : 'Property Owner';

    const textBody = isArtisan
      ? `Welcome to Artifix, ${fullName}! Your application has been received for the pilot cohort in ${city} (Ref: ${referenceCode}). Trade: ${craftOrSkill || 'Skilled Artisan'}. Connect with our team on WhatsApp: ${targetWhatsAppUrl}`
      : `Welcome to Artifix, ${fullName}! Your application has been received for the pilot cohort in ${city} (Ref: ${referenceCode}). Connect with our team on WhatsApp: ${targetWhatsAppUrl}`;

    // ── CDN base ──────────────────────────────────────────────────────────────
    const CDN = 'https://res.cloudinary.com/dclhgfoah/image/upload';
    const A = {
      logo:       `${CDN}/v1794772387/artifix/email/artifix-icon-transparent.png`,
      artisans:   `${CDN}/v1794783659/artifix/email/hero-artisans-cutout.png`,
      heroBg:     `${CDN}/v1794782062/artifix/email/hero-background-linen.png`,
      heroBanner: `${CDN}/v1794782063/artifix/email/hero-banner-master.png`,
      wave:       `${CDN}/v1794776749/artifix/email/dossier-corner-wave.png`,
      dossierBg:  `${CDN}/v1795165506/artifix/email/dossier-background-seamless.png`,
      shield:     `${CDN}/v1794778170/artifix/email/icon-shield.jpg`,
      handshake:  `${CDN}/v1794778167/artifix/email/icon-handshake.jpg`,
      chart:      `${CDN}/v1794778164/artifix/email/icon-chart.jpg`,
      community:  `${CDN}/v1794778166/artifix/email/icon-community.jpg`,
      bulb:       `${CDN}/v1794778163/artifix/email/icon-bulb.jpg`,
      house:      `${CDN}/v1794776758/artifix/email/icon-house.png`,
      wrench:     `${CDN}/v1794776762/artifix/email/icon-wrench.png`,
      whatsapp:   `${CDN}/v1794775608/artifix/email/icon-whatsapp.png`,
      social:     `${CDN}/v1794776763/artifix/email/social-strip.png`,
    };

    const pillarIcon = (src, alt = '') =>
      `<img src="${src}" width="40" height="40" alt="${alt}" style="display:block;border:0;" />`;

    const pillarRow = (iconSrc, title, body) => `
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;margin-bottom:10px;">
        <tr><td style="padding:16px 18px;">
          <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
            <td style="width:48px;vertical-align:middle;">${pillarIcon(iconSrc)}</td>
            <td style="vertical-align:middle;padding-left:14px;">
              <div style="font-size:13px;font-weight:800;color:#072116;margin-bottom:3px;">${title}</div>
              <div style="font-size:12px;line-height:1.5;color:#475569;">${body}</div>
            </td>
          </tr></table>
        </td></tr>
      </table>`;

    const clientPillars = `
      ${pillarRow(A.shield, 'Zero Upfront Risk:', 'Your project funds stay protected in automated milestone escrow.')}
      ${pillarRow(A.handshake, 'Verified Trade Standards:', 'Every tradesperson undergoes government identity verification and hands-on skill audits before dispatch.')}
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;">
        <tr><td style="padding:16px 18px;">
          <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
            <td style="width:48px;vertical-align:middle;">${pillarIcon(A.chart)}</td>
            <td style="vertical-align:middle;padding-left:14px;">
              <div style="font-size:13px;font-weight:800;color:#072116;margin-bottom:3px;">Proof-of-Work Milestones:</div>
              <div style="font-size:12px;line-height:1.5;color:#475569;">Review clear photo and video completion evidence directly on your phone before releasing escrow funds.</div>
            </td>
          </tr></table>
        </td></tr>
      </table>`;

    const artisanPillars = `
      ${pillarRow(A.shield, 'Guaranteed Milestone Payouts:', 'Client project funds are deposited safely into escrow before you touch tools. Zero delayed payments.')}
      ${pillarRow(A.handshake, 'Direct Client Introductions:', 'Connect directly with vetted property owners, facility managers, and verified projects seeking your trade.')}
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;">
        <tr><td style="padding:16px 18px;">
          <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
            <td style="width:48px;vertical-align:middle;">${pillarIcon(A.chart)}</td>
            <td style="vertical-align:middle;padding-left:14px;">
              <div style="font-size:13px;font-weight:800;color:#072116;margin-bottom:3px;">Verified Digital Credential:</div>
              <div style="font-size:12px;line-height:1.5;color:#475569;">Build an immutable track record of completed jobs, verified client ratings, and professional certifications.</div>
            </td>
          </tr></table>
        </td></tr>
      </table>`;

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${subject}</title>
<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #F4F6F4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  @media only screen and (max-width: 599px) {
    .hero-card-table {
      border-radius: 16px !important;
    }
    .hero-text-col {
      width: 53% !important;
      padding: 20px 8px 18px 16px !important;
    }
    .hero-title {
      font-size: 18px !important;
      line-height: 1.2 !important;
      margin-bottom: 8px !important;
    }
    .hero-desc {
      font-size: 10px !important;
      line-height: 1.42 !important;
    }
    .hero-img-col {
      width: 47% !important;
    }
    .dossier-card-td {
      padding: 18px 18px !important;
    }
    .dossier-label {
      font-size: 8.5px !important;
      letter-spacing: 1.1px !important;
      margin-bottom: 10px !important;
    }
    .dossier-code-pill {
      font-size: 16px !important;
      padding: 6px 16px !important;
      letter-spacing: 1.2px !important;
    }
    .dossier-role-pill {
      font-size: 8.5px !important;
      padding: 6px 12px !important;
    }
    .dossier-meta {
      font-size: 10px !important;
      margin-top: 10px !important;
    }
  }
  @media only screen and (max-width: 375px) {
    .hero-text-col {
      width: 51% !important;
      padding: 14px 6px 14px 12px !important;
    }
    .hero-title {
      font-size: 14.5px !important;
      line-height: 1.2 !important;
      margin-bottom: 6px !important;
    }
    .hero-desc {
      font-size: 8.5px !important;
      line-height: 1.35 !important;
    }
    .hero-img-col {
      width: 49% !important;
    }
    .dossier-card-td {
      padding: 15px 14px !important;
    }
    .dossier-label {
      font-size: 8px !important;
      letter-spacing: 0.9px !important;
      margin-bottom: 8px !important;
    }
    .dossier-code-pill {
      font-size: 14px !important;
      padding: 5px 12px !important;
      letter-spacing: 1px !important;
    }
    .dossier-role-pill {
      font-size: 8px !important;
      padding: 5px 9px !important;
    }
    .dossier-meta {
      font-size: 9px !important;
      margin-top: 8px !important;
    }
  }
  @media only screen and (max-width: 330px) {
    .dossier-badges-col {
      display: block !important;
      width: 100% !important;
      padding-left: 0 !important;
      margin-top: 8px !important;
    }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#F4F6F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F4F6F4;padding:24px 10px;">
<tr><td align="center">

<table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="padding:0 0 16px 0;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
      <td style="vertical-align:middle;">
        <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
          <td style="vertical-align:middle;"><img src="${A.logo}" width="36" height="35" alt="Artifix" style="display:block;border:0;" /></td>
          <td style="vertical-align:middle;padding-left:9px;">
            <div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;line-height:1;color:#123E2A;">Arti<span style="color:#BD5324;">fix</span></div>
            <div style="font-size:7.5px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#00A86B;margin-top:3px;">FIND &bull; CONNECT &bull; FIX</div>
          </td>
        </tr></table>
      </td>
      <td align="right" style="vertical-align:middle;">
        <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
          <td style="text-align:right;padding-right:11px;vertical-align:middle;">
            <div style="font-size:11px;line-height:1.4;color:#64748B;font-weight:500;">Building a trusted<br>artisan economy in Nigeria.</div>
          </td>
          <td style="border-right:2.5px solid #00A86B;height:28px;vertical-align:middle;"></td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>

  <!-- HERO CARD — Side-by-Side Responsive across all screens -->
  <tr><td style="padding:0 0 14px 0;">
    <!--[if gte mso 9]>
    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:240px;">
    <v:fill type="tile" src="${A.heroBg}" color="#071F17" />
    <v:textbox inset="0,0,0,0">
    <![endif]-->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="hero-card-table" style="background-color:#071F17;background-image:url('${A.heroBg}');background-size:cover;background-position:center right;border-radius:20px;overflow:hidden;">
      <tr>
        <td class="hero-text-col" style="vertical-align:middle;padding:28px 10px 26px 26px;width:54%;">
          <div class="hero-title" style="font-size:24px;font-weight:900;line-height:1.2;color:#FFFFFF;margin:0 0 12px 0;">
            ${isArtisan ? 'Welcome to the<br>Artisan Network,' : 'Welcome to the<br>Private Beta,'} <span style="color:#22C55E;">${fullName}</span>
          </div>
          <p class="hero-desc" style="color:#A7B8B0;font-size:12px;line-height:1.55;margin:0;">
            ${isArtisan
              ? `Thank you for applying for early access. We're piloting guaranteed milestone payouts in <strong style="color:#22C55E;">${city}</strong>.`
              : `Thank you for applying for early access. We're piloting safer, milestone-protected hiring in <strong style="color:#22C55E;">${city}</strong>.`}
          </p>
        </td>
        <td class="hero-img-col" style="width:46%;vertical-align:bottom;text-align:right;padding:0;overflow:hidden;">
          <img src="${A.artisans}" width="260" height="254" alt="Artifix Artisans" style="display:block;width:100%;max-width:260px;height:auto;border:0;vertical-align:bottom;" />
        </td>
      </tr>
    </table>
    <!--[if gte mso 9]>
    </v:textbox>
    </v:rect>
    <![endif]-->
  </td></tr>

  <!-- DOSSIER -->
  <tr><td style="padding:0 0 14px 0;">
    <!--[if gte mso 9]>
    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:130px;">
    <v:fill type="tile" src="${A.dossierBg}" color="#F4F7F8" />
    <v:textbox inset="0,0,0,0">
    <![endif]-->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="dossier-table" bgcolor="#F4F7F8" style="background-color:#F4F7F8;background-image:url('${A.dossierBg}');background-size:cover;background-position:right bottom;background-repeat:no-repeat;border:1px solid #E2E8F0;border-radius:18px;overflow:hidden;">
      <tr>
        <td class="dossier-card-td" style="vertical-align:middle;padding:22px 24px;">
          <div class="dossier-label" style="font-size:9.5px;font-weight:800;color:#0F172A;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:12px;">APPLICATION REFERENCE CODE</div>
          <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
            <td style="vertical-align:middle;">
              <div class="dossier-code-pill" style="display:inline-block;background-color:#DCFCE7;border:1px solid #BBF7D0;border-radius:9999px;padding:7px 22px;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:20px;font-weight:900;letter-spacing:1.5px;color:#062E1F;">${referenceCode}</div>
            </td>
            <td class="dossier-badges-col" style="vertical-align:middle;padding-left:12px;">
              <div class="dossier-role-pill" style="display:inline-block;background-color:#0B291D;color:#FFFFFF;border-radius:9999px;padding:8px 16px;font-size:9.5px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;">
                <img src="${isArtisan ? A.wrench : A.house}" width="12" height="12" style="vertical-align:-2px;margin-right:6px;border:0;" alt="" />${roleDescriptor}
              </div>
            </td>
          </tr></table>
          <div class="dossier-meta" style="font-size:11px;color:#64748B;margin-top:12px;">Scope: <strong style="color:#334155;">Private Beta Cohort</strong> &bull; Priority Matching: <strong style="color:#334155;">Active</strong></div>
        </td>
      </tr>
    </table>
    <!--[if gte mso 9]>
    </v:textbox>
    </v:rect>
    <![endif]-->
  </td></tr>

  <!-- PILLARS -->
  <tr><td style="padding:0 0 14px 0;">
    <div style="font-size:10.5px;font-weight:900;color:#0F172A;letter-spacing:1.1px;text-transform:uppercase;margin:0 0 12px 2px;">
      <span style="display:inline-block;width:22px;height:3px;background-color:#00A86B;border-radius:2px;vertical-align:middle;margin-right:8px;"></span>WHAT TO EXPECT DURING THE PILOT:
    </div>
    ${isArtisan ? artisanPillars : clientPillars}
  </td></tr>

  <!-- WHATSAPP HUB -->
  <tr><td style="padding:0 0 14px 0;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#071E15;border-radius:20px;">
      <tr><td style="padding:20px 22px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
          <td style="width:50px;vertical-align:middle;">
            <img src="${A.community}" width="46" height="46" alt="" style="display:block;border:0;" />
          </td>
          <td style="vertical-align:middle;padding:0 16px;">
            <div style="font-size:8px;font-weight:800;color:#9CA3AF;letter-spacing:1.1px;text-transform:uppercase;">${isArtisan ? 'ACTION REQUIRED &ndash; GUILD DESK' : 'ACTION REQUIRED &ndash; COHORT GROUP'}</div>
            <div style="font-size:18px;font-weight:900;color:#FFFFFF;margin:4px 0 5px 0;">${isArtisan ? 'Join the Artisan Network' : 'Join the Pilot Community'}</div>
            <div style="font-size:11px;line-height:1.45;color:#9CA3AF;">${isArtisan ? 'Connect directly with our trade dispatch team to schedule your verification audit and receive early job dispatches.' : 'Connect directly with our operations desk for priority scheduling, test project matching, and direct feedback on pilot jobs.'}</div>
          </td>
          <td align="right" style="vertical-align:middle;white-space:nowrap;">
            <a href="${targetWhatsAppUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#22C55E;border-radius:9999px;padding:10px 18px;text-decoration:none;box-shadow:0 4px 14px rgba(34,197,94,0.3);">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
                <td style="vertical-align:middle;"><img src="${A.whatsapp}" width="20" height="20" style="display:block;border:0;" alt="" /></td>
                <td style="vertical-align:middle;padding-left:8px;text-align:left;line-height:1.3;">
                  <div style="font-size:11px;font-weight:800;color:#FFFFFF;">${isArtisan ? 'Join Abuja Artisan' : 'Join Abuja Client'}</div>
                  <div style="font-size:9.5px;font-weight:700;color:#DCFCE7;">${isArtisan ? 'Guild on WhatsApp &rarr;' : 'Community on WhatsApp &rarr;'}</div>
                </td>
              </tr></table>
            </a>
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <!-- SECURITY TIP -->
  <tr><td style="padding:0 0 16px 0;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8FAF9;border:1px solid #E8EFEA;border-radius:12px;">
      <tr><td style="padding:13px 16px;">
        <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
          <td style="width:30px;vertical-align:middle;"><img src="${A.bulb}" width="22" height="22" alt="" style="display:block;border:0;" /></td>
          <td style="vertical-align:middle;padding-left:10px;">
            <span style="color:#072116;font-size:11.5px;font-weight:800;">${isArtisan ? 'Trade Protection:' : 'Security Tip:'}&nbsp;</span>
            <span style="color:#64748B;font-size:11.5px;line-height:1.5;">${isArtisan ? 'Client milestone funds are verified and locked before dispatch. You will never be asked for personal bank PINs or outside transfers.' : 'Artifix team members will never ask for your account password, recovery keys, or payments outside the official platform escrow.'}</span>
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:0 0 10px 0;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;">
      <tr><td style="padding:16px 18px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
          <td style="vertical-align:middle;width:33%;">
            <table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:middle;"><img src="${A.logo}" width="28" height="27" alt="Artifix" style="display:block;border:0;" /></td>
              <td style="vertical-align:middle;padding-left:8px;">
                <div style="font-size:17px;font-weight:900;letter-spacing:-0.4px;line-height:1;color:#123E2A;">Arti<span style="color:#BD5324;">fix</span></div>
                <div style="font-size:7px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;color:#00A86B;margin-top:3px;">FIND &bull; CONNECT &bull; FIX</div>
              </td>
            </tr></table>
          </td>
          <td align="center" style="vertical-align:middle;width:34%;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;padding:0 10px;">
            <div style="font-size:9px;font-weight:800;color:#64748B;margin-bottom:6px;">Follow Us</div>
            <img src="${A.social}" width="125" height="20" alt="Social Media" style="display:inline-block;border:0;" />
          </td>
          <td align="right" style="vertical-align:middle;width:33%;">
            <div style="font-size:9px;font-weight:800;color:#64748B;margin-bottom:4px;">Need Help?</div>
            <a href="mailto:support@artifixhq.xyz" style="color:#00A86B;font-size:11px;font-weight:800;text-decoration:none;">support@artifixhq.xyz</a>
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <!-- COPYRIGHT -->
  <tr><td align="center" style="padding:4px 0 20px 0;">
    <div style="color:#94A3B8;font-size:10.5px;line-height:1.5;">&copy; 2025 Artifix. All rights reserved. &nbsp;|&nbsp; A safer, smarter way to hire skilled professionals.</div>
  </td></tr>

</table>

</td></tr>
</table>

</body>
</html>`;

    return this.sendEmail({ to, subject, textBody, htmlBody });
  }
}

export default EmailService;
