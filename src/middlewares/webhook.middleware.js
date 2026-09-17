import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';

// Official Paystack webhook IP ranges
const PAYSTACK_IPS = ['52.31.139.75', '52.2.146.126', '52.49.173.169'];

/**
 * Validates that incoming Paystack webhooks originate from official Paystack IP addresses
 */
export const requirePaystackIp = (req, res, next) => {
  if (env.NODE_ENV !== 'production') {
    return next();
  }

  const rawIp =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip;

  const clientIp = rawIp?.replace(/^::ffff:/, '');

  if (!clientIp || !PAYSTACK_IPS.includes(clientIp)) {
    console.warn(`🚨 Rejected webhook request from unauthorized IP: ${clientIp}`);
    return next(ApiError.forbidden('Unauthorized webhook source IP address'));
  }

  next();
};

export default { requirePaystackIp };
