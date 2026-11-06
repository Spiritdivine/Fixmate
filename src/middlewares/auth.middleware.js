import { verifyAccessToken } from '../utils/token.util.js';
import { ApiError } from '../utils/api-error.js';
import { comparePassword } from '../utils/hash.util.js';
import { redisCache } from '../config/redis.js';
import prisma from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No authorization token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // If token includes a sessionId, check for instant revocation in Redis
    if (decoded.sessionId) {
      const sessionKey = `session:${decoded.userId}:${decoded.sessionId}`;
      const sessionData = await redisCache.get(sessionKey);
      if (sessionData) {
        try {
          const parsed = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
          if (parsed && parsed.active === false) {
            throw ApiError.unauthorized('Session has been revoked. Please sign in again.');
          }
        } catch (err) {
          if (err instanceof ApiError) throw err;
        }
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        artisanProfile: true,
        clientProfile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found or session expired');
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw ApiError.forbidden('Your account is inactive or suspended');
    }

    req.user = user;
    req.sessionId = decoded.sessionId || null;
    req.tokenFamilyId = decoded.familyId || null;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token has expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid access token'));
    }
    next(error);
  }
};

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Forbidden: Requires one of the following roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
};

export const requireVerified = (req, res, next) => {
  if (!req.user.isPhoneVerified && !req.user.isEmailVerified) {
    return next(ApiError.forbidden('Please verify your phone or email to proceed'));
  }
  next();
};

/**
 * Step-Up Authentication Middleware for Escrow Releases, Payouts, and Financial Changes
 * Requires either:
 * - Header 'x-transaction-pin': 4-digit PIN verified against user.transactionPinHash
 * - Header 'x-stepup-token': Single-use token issued via biometric or OTP 2FA
 */
export const requireStepUpAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const pin = req.headers['x-transaction-pin'] || req.body?.pin;
    const stepUpToken = req.headers['x-stepup-token'] || req.body?.stepUpToken;

    // Option A: Step-up single-use ticket in Redis (Atomic Single-Use Consumption)
    if (stepUpToken) {
      const ticketKeys = [
        `stepup:${req.user.id}:TRANSACTION_PIN:${stepUpToken}`,
        `stepup:${req.user.phoneNumber}:WITHDRAWAL_2FA:${stepUpToken}`,
        `stepup:${req.user.email}:WITHDRAWAL_2FA:${stepUpToken}`,
      ];

      for (const key of ticketKeys) {
        const deleted = await redisCache.del(key);
        if (deleted === 1 || deleted === true) {
          return next();
        }
      }
    }

    // Option B: Direct 4-digit PIN validation (Guarded by Brute-Force Lockout)
    if (pin && req.user.transactionPinHash) {
      const lockoutKey = `pin_lockout:${req.user.id}`;
      const isLocked = await redisCache.get(lockoutKey);
      if (isLocked) {
        throw ApiError.forbidden('Too many failed PIN attempts. Your transaction PIN is locked for 15 minutes.');
      }

      const isMatch = await comparePassword(String(pin).trim(), req.user.transactionPinHash);
      const attemptsKey = `pin_attempts:${req.user.id}`;

      if (isMatch) {
        await redisCache.del(attemptsKey);
        return next();
      }

      const attemptsStr = await redisCache.get(attemptsKey);
      const currentAttempts = (Number(attemptsStr) || 0) + 1;
      if (currentAttempts >= 5) {
        await redisCache.set(lockoutKey, 'LOCKED', 900);
        await redisCache.del(attemptsKey);
        throw ApiError.forbidden('Too many failed attempts. Transaction PIN locked for 15 minutes.');
      } else {
        await redisCache.set(attemptsKey, currentAttempts, 900);
        const remaining = 5 - currentAttempts;
        throw ApiError.forbidden(`Invalid 4-digit transaction PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
      }
    }

    // If user has not yet set a PIN and no step-up token was sent, require them to configure one
    if (!req.user.transactionPinHash) {
      throw ApiError.forbidden(
        'Transaction security PIN not set. Please set a 4-digit security PIN in Settings before initiating withdrawals or escrow actions.'
      );
    }

    throw ApiError.forbidden(
      'Step-up authorization required. Please provide your 4-digit security PIN or biometric sign-off.'
    );
  } catch (error) {
    next(error);
  }
};

