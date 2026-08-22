import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limiter for general endpoints
 */
export const standardApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
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
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many transaction requests. Please wait a moment before trying again.',
  },
});
