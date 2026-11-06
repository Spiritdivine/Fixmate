import { env } from '../config/env.js';

/**
 * Enterprise Alerting Service for infrastructure, security, and financial anomalies
 * Supports multi-channel dispatch: Slack/Discord webhooks, Resend administrative emails, and structured console fallback.
 */
export class AlertService {
  /**
   * Dispatch an urgent operational alert
   * @param {Object} options
   * @param {'CRITICAL' | 'WARNING' | 'INFO'} options.level
   * @param {string} options.title
   * @param {string} options.message
   * @param {Object} [options.metadata]
   */
  static async sendAlert({ level = 'WARNING', title, message, metadata = {} }) {
    const timestamp = new Date().toISOString();
    const payload = {
      level,
      title,
      message,
      environment: env.NODE_ENV || 'production',
      timestamp,
      metadata,
    };

    const icon = level === 'CRITICAL' ? '🚨' : level === 'WARNING' ? '⚠️' : 'ℹ️';
    console.error(`\n[ALERT ${icon} ${level}] ${title}\nMessage: ${message}\nDetails: ${JSON.stringify(metadata, null, 2)}\n`);

    const webhookUrl = process.env.ALERT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;

    // 1. Dispatch to Webhook (Slack / Discord / Teams)
    if (webhookUrl) {
      try {
        const isDiscord = webhookUrl.includes('discord.com');
        const body = isDiscord
          ? {
              content: `${icon} **[${level}] ${title}**\n${message}\n\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``,
            }
          : {
              text: `${icon} *[${level}] ${title}*\n${message}`,
              attachments: [
                {
                  color: level === 'CRITICAL' ? '#ff0000' : '#ff9900',
                  fields: Object.entries(metadata).map(([k, v]) => ({
                    title: k,
                    value: String(v),
                    short: true,
                  })),
                  ts: Math.floor(Date.now() / 1000),
                },
              ],
            };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        }).catch((err) => {
          console.warn(`[AlertService] Webhook dispatch notice: ${err.message}`);
        });
      } catch (err) {
        console.warn(`[AlertService] Failed to dispatch webhook alert: ${err.message}`);
      }
    }

    // 2. Dispatch via Admin Email (Resend) if configured
    const adminEmail = process.env.ADMIN_ALERT_EMAIL;
    if (adminEmail && env.RESEND_API_KEY && !env.RESEND_API_KEY.startsWith('re_xxxx')) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM || 'Artifix Alerts <alerts@artifixhq.xyz>',
            to: [adminEmail],
            subject: `[${level}] Artifix Production Alert: ${title}`,
            text: `Alert: ${title}\nSeverity: ${level}\nTime: ${timestamp}\n\n${message}\n\nDetails:\n${JSON.stringify(metadata, null, 2)}`,
          }),
          signal: AbortSignal.timeout(5000),
        }).catch(() => {});
      } catch {
        // Non-blocking
      }
    }

    return payload;
  }
}

export default AlertService;
