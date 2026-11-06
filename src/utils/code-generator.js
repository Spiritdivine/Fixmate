import crypto from 'crypto';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a short, human-readable, unambiguous, collision-resistant referral code.
 * Excludes confusing characters like 0, O, 1, I.
 * Example: FIX-8W7K
 */
export function generateReferralCode(prefix = 'FIX') {
  const bytes = crypto.randomBytes(4);
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${result}`;
}
