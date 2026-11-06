import crypto from 'crypto';
import prisma from '../config/db.js';
import { redisCache, redis } from '../config/redis.js';
import { ApiError } from '../utils/api-error.js';
import { SmsService } from './sms.service.js';
import { EmailService } from './email.service.js';
import { generateOtp, hashToken } from '../utils/token.util.js';

export const OTP_PURPOSES = {
  PHONE_VERIFICATION: 'PHONE_VERIFICATION',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  LOGIN_OTP: 'LOGIN_OTP',
  PASSWORD_RESET: 'PASSWORD_RESET',
  WITHDRAWAL_2FA: 'WITHDRAWAL_2FA',
};

const OTP_TTL_SECONDS = {
  PHONE_VERIFICATION: 600, // 10 minutes
  EMAIL_VERIFICATION: 600, // 10 minutes
  LOGIN_OTP: 300,          // 5 minutes
  PASSWORD_RESET: 600,     // 10 minutes
  WITHDRAWAL_2FA: 180,     // 3 minutes
};

const MAX_VERIFICATION_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_SECONDS = 900; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

/**
 * Standardize Nigerian and international phone numbers to E.164 (+234...)
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)]/g, '').trim();
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '+234' + cleaned.slice(1);
  } else if (!cleaned.startsWith('+') && cleaned.startsWith('234')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export class OtpService {
  /**
   * Request and dispatch an OTP code with sliding-window anti-spam protection
   */
  static async requestOtp(identifier, purpose = OTP_PURPOSES.PHONE_VERIFICATION, channel = 'SMS') {
    const isEmail = identifier.includes('@');
    const cleanIdentifier = isEmail ? identifier.trim().toLowerCase() : normalizePhoneNumber(identifier);

    if (!cleanIdentifier) {
      throw ApiError.badRequest('Valid phone number or email is required');
    }

    if (!Object.values(OTP_PURPOSES).includes(purpose)) {
      throw ApiError.badRequest(`Invalid OTP purpose: ${purpose}`);
    }

    // Rate Limiting (sliding window per identifier)
    const rateLimitKey = `otp_rate:${cleanIdentifier}:${purpose}`;
    const currentRequests = await redisCache.get(rateLimitKey);
    const requestCount = currentRequests ? parseInt(currentRequests, 10) : 0;

    if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
      throw ApiError.tooManyRequests(
        `Too many OTP requests for this account. Please wait 15 minutes before requesting another code.`
      );
    }

    // Generate 6-digit code
    const code = generateOtp(6);
    const hashedCode = hashToken(code);
    const ttl = OTP_TTL_SECONDS[purpose] || 300;

    // Cache in Redis for ultra-low latency & lock state
    const cacheKey = `otp:${cleanIdentifier}:${purpose}`;
    const payload = JSON.stringify({
      otpHash: hashedCode,
      attempts: 0,
      createdAt: Date.now(),
    });

    await redisCache.set(cacheKey, payload, ttl);

    // Increment rate limiter
    await redisCache.set(rateLimitKey, String(requestCount + 1), RATE_LIMIT_WINDOW_SECONDS);

    // Save in database OtpVerification table for compliance & audit history
    try {
      await prisma.otpVerification.create({
        data: {
          identifier: cleanIdentifier,
          otpHash: hashedCode,
          purpose,
          attemptsCount: 0,
          isUsed: false,
          expiresAt: new Date(Date.now() + ttl * 1000),
        },
      });
    } catch (dbErr) {
      console.warn('[OtpService] Audit log write deferred:', dbErr.message);
    }

    // Dispatch via appropriate messaging channel
    let dispatchResult = { success: true };
    if (isEmail) {
      try {
        await EmailService.sendEmail({
          to: cleanIdentifier,
          subject: `Your Artifix Verification Code [${code}]`,
          html: `<p>Your Artifix security code is: <strong>${code}</strong>. Valid for ${Math.round(ttl / 60)} minutes. Never share this code with anyone.</p>`,
        });
      } catch (err) {
        console.warn(`[OtpService] Email dispatch error: ${err.message}`);
      }
    } else {
      dispatchResult = await SmsService.sendOtp(cleanIdentifier, code, purpose);
    }

    return {
      success: true,
      identifier: cleanIdentifier,
      purpose,
      expiresInSeconds: ttl,
      provider: dispatchResult.provider || 'default',
    };
  }

  /**
   * Verify an OTP code atomically with attempt counter & timing-safe hash comparison
   */
  static async verifyOtp(identifier, otp, purpose) {
    const isEmail = identifier.includes('@');
    const cleanIdentifier = isEmail ? identifier.trim().toLowerCase() : normalizePhoneNumber(identifier);

    if (!cleanIdentifier || !otp) {
      throw ApiError.badRequest('Identifier and 6-digit OTP code are required');
    }

    const cacheKey = `otp:${cleanIdentifier}:${purpose}`;
    let cachedData = await redisCache.get(cacheKey);
    let state = null;

    if (cachedData) {
      try {
        state = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      } catch {
        state = null;
      }
    }

    // Fallback to database if Redis key expired or is in memory sync
    let dbOtpRecord = null;
    if (!state) {
      dbOtpRecord = await prisma.otpVerification.findFirst({
        where: {
          identifier: cleanIdentifier,
          purpose,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!dbOtpRecord) {
        throw ApiError.badRequest('The verification code has expired or was not requested. Please request a new one.');
      }

      state = {
        otpHash: dbOtpRecord.otpHash,
        attempts: dbOtpRecord.attemptsCount,
      };
    }

    // Check attempt threshold
    if (state.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await redisCache.del(cacheKey);
      throw ApiError.badRequest('Too many incorrect attempts. This code has been invalidated. Please request a new code.');
    }

    // Compare hash with timing-safe comparison
    const inputHash = hashToken(otp.trim());
    const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(state.otpHash));

    if (!isMatch) {
      state.attempts += 1;
      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - state.attempts;

      // Update attempts in Redis and DB
      await redisCache.set(cacheKey, JSON.stringify(state), 300);
      if (dbOtpRecord) {
        await prisma.otpVerification.update({
          where: { id: dbOtpRecord.id },
          data: { attemptsCount: state.attempts },
        }).catch(() => {});
      }

      throw ApiError.badRequest(
        `Invalid verification code. You have ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
      );
    }

    // Code verified: consume and invalidate immediately
    await redisCache.del(cacheKey);
    if (dbOtpRecord) {
      await prisma.otpVerification.update({
        where: { id: dbOtpRecord.id },
        data: { isUsed: true },
      }).catch(() => {});
    }

    // Generate single-use step-up ticket for high-assurance actions (Withdrawal, Password Reset)
    const stepUpTicket = crypto.randomBytes(24).toString('hex');
    const ticketKey = `stepup:${cleanIdentifier}:${purpose}:${stepUpTicket}`;
    await redisCache.set(ticketKey, 'VALID', 600); // 10 minutes valid

    return {
      verified: true,
      identifier: cleanIdentifier,
      purpose,
      stepUpTicket,
    };
  }

  /**
   * Verify a previously issued step-up authorization ticket (for single-use sensitive operations)
   */
  static async consumeStepUpTicket(identifier, purpose, ticket) {
    if (!ticket) return false;
    const cleanIdentifier = identifier.includes('@') ? identifier.trim().toLowerCase() : normalizePhoneNumber(identifier);
    const ticketKey = `stepup:${cleanIdentifier}:${purpose}:${ticket}`;
    const isValid = await redisCache.get(ticketKey);
    if (isValid === 'VALID') {
      await redisCache.del(ticketKey); // Single-use consumption
      return true;
    }
    return false;
  }
}

export default OtpService;
