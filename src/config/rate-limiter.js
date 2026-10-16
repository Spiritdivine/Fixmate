import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from './redis.js';

/**
 * Creates a distributed RedisStore if Redis is available, or defaults to in-memory store
 */
const getStore = (prefix) => {
  if (redis) {
    try {
      return new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: `artisan:rl:${prefix}:`,
      });
    } catch (err) {
      console.warn(`[RateLimiter] Could not attach RedisStore for ${prefix}, falling back to memory:`, err.message);
    }
  }
  return undefined; // MemoryStore fallback
};

/**
 * Standard API rate limiter for general endpoints
 */
export const standardApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('std'),
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Strict rate limiter for Authentication and OTP verification endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('auth'),
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

/**
 * Financial operations limiter for Escrow funding, release, and withdrawals
 */
export const financialRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 financial operations per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('fin'),
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many transaction requests. Please wait a moment before trying again.',
  },
});

/**
 * AI Diagnostic rate limiter to control token economics
 */
export const aiDiagnosticLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 diagnostics per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('ai_diag'),
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many diagnostic sessions requested. Please wait an hour before continuing.',
  },
});

