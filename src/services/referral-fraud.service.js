import crypto from 'crypto';
import prisma from '../config/db.js';
import { redis } from '../config/redis.js';

export class ReferralFraudService {
  /**
   * Generates a stable device fingerprint hash from client device telemetry.
   */
  static generateDeviceHash(deviceData = {}) {
    if (!deviceData || typeof deviceData !== 'object') return null;
    const { platform, deviceId, screenResolution, hardwareModel } = deviceData;
    if (!deviceId && !hardwareModel) return null;
    return crypto
      .createHash('sha256')
      .update(`${platform || ''}:${deviceId || ''}:${screenResolution || ''}:${hardwareModel || ''}`)
      .digest('hex');
  }

  /**
   * Evaluates the risk profile of an incoming referral link pairing.
   */
  static async evaluateRisk({ referrerId, refereeId, clientIp, deviceHash }) {
    let score = 0;
    const flags = [];

    // 1. Immediate Disqualification: Self-referral
    if (referrerId === refereeId) {
      return { score: 100, flags: ['SELF_REFERRAL_DETECTED'], blocked: true };
    }

    const [referrer, referee] = await Promise.all([
      prisma.user.findUnique({
        where: { id: referrerId },
        include: { bankAccounts: true },
      }),
      prisma.user.findUnique({
        where: { id: refereeId },
        include: { bankAccounts: true },
      }),
    ]);

    if (!referrer || !referee) {
      return { score: 50, flags: ['USER_NOT_FOUND'], blocked: false };
    }

    // 2. Hardware Collision Check
    if (deviceHash && referrer.deviceFingerprintHash === deviceHash) {
      score += 90;
      flags.push('MATCHING_DEVICE_FINGERPRINT');
    }

    // 3. Bank Account / Paystack Recipient Code Collision
    const referrerAccountNumbers = new Set(referrer.bankAccounts.map((b) => b.accountNumber));
    const matchingAccounts = referee.bankAccounts.filter((b) =>
      referrerAccountNumbers.has(b.accountNumber)
    );
    if (matchingAccounts.length > 0) {
      score += 95;
      flags.push('MATCHING_BANK_ACCOUNT_DETAILS');
    }

    // 4. IP Subnet Velocity Check (Redis sliding window)
    if (clientIp && redis) {
      try {
        const subnet = clientIp.split('.').slice(0, 3).join('.');
        const ipKey = `ratelimit:referrals:subnet:${subnet}`;
        const count = await redis.incr(ipKey);
        if (count === 1) {
          await redis.expire(ipKey, 3600); // 1 hour sliding window
        }
        if (count > 5) {
          score += 45;
          flags.push('HIGH_IP_SUBNET_CONCENTRATION');
        }
      } catch (err) {
        console.warn('[ReferralFraud] Redis check failed:', err.message);
      }
    }

    // 5. Daily Velocity Check for Referrer
    if (redis) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const velocityKey = `velocity:referrals:user:${referrerId}:${today}`;
        const dailyCount = await redis.incr(velocityKey);
        if (dailyCount === 1) {
          await redis.expire(velocityKey, 86400);
        }
        if (dailyCount > 20) {
          score += 40;
          flags.push('UNUSUAL_REFERRER_VELOCITY');
        }
      } catch (err) {
        console.warn('[ReferralFraud] Velocity check failed:', err.message);
      }
    }

    return {
      score: Math.min(score, 100),
      flags,
      blocked: score >= 80,
    };
  }
}
