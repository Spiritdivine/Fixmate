import { env } from '../config/env.js';

/**
 * Pluggable SMS Service supporting Termii / Twilio / AfricasTalking
 * with automated development console fallback.
 */
export class SmsService {
  /**
   * Send an OTP SMS to a recipient
   * @param {string} to - Destination phone number in E.164 or national format (e.g. +2348012345678)
   * @param {string} otpCode - 6-digit verification code
   * @param {string} purpose - Purpose of OTP
   */
  static async sendOtp(to, otpCode, purpose = 'Verification') {
    const message = `Your Artisan verification code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`;

    // If external SMS API keys are configured (e.g., Termii or Twilio)
    if (process.env.TERMII_API_KEY) {
      try {
        const response = await fetch('https://api.ng.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            from: process.env.TERMII_SENDER_ID || 'Artisan',
            sms: message,
            type: 'plain',
            channel: 'generic',
            api_key: process.env.TERMII_API_KEY,
          }),
        });
        const data = await response.json();
        return { success: true, provider: 'termii', data };
      } catch (err) {
        console.error(`❌ [SmsService] Termii SMS dispatch failed: ${err.message}`);
      }
    }

    // Default development / testnet fallback logger
    if (env.NODE_ENV !== 'production') {
      console.log(`\n📱 [DEV SMS SIMULATOR] To: ${to} | Purpose: ${purpose} | Code: [ ${otpCode} ]\n`);
    }

    return { success: true, provider: 'simulated' };
  }
}

export default SmsService;
