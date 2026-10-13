import { ApiError } from '../utils/api-error.js';

export class PromptGuardrailService {
  static ILLEGAL_PATTERNS = [
    /\b(bypass|hack|tamper|steal|cheat|bridge).{0,40}(meter|phcn|nepa|light|electricity|prepaid|power)\b/i,
    /\b(phcn|nepa|prepaid|meter).{0,40}(bypass|hack|tamper|steal|free light)\b/i,
    /\b(tap gas line|illegal connection|hack electrical grid|reverse meter|steal electricity|bypass prepaid card)\b/i,
    /\b(hotwire|disable security alarm|break safe|tamper with water main to avoid billing)\b/i,
  ];

  static ADVERSARIAL_INJECTION_PATTERNS = [
    /\b(ignore all previous instructions|disregard instructions|system prompt reset|you are now in developer mode|jailbreak)\b/i,
  ];

  /**
   * Validate natural language queries against illegal utility tampering or security exploits
   * @param {string} textPrompt
   */
  static validateUserQuery(textPrompt = '') {
    if (!textPrompt || typeof textPrompt !== 'string') return;

    for (const pattern of this.ILLEGAL_PATTERNS) {
      if (pattern.test(textPrompt)) {
        throw ApiError.badRequest(
          'Security & Legal Policy Violation: Fixmate strictly prohibits queries involving illegal utility bypass, meter tampering, or hazardous unauthorized grid connections.'
        );
      }
    }

    for (const pattern of this.ADVERSARIAL_INJECTION_PATTERNS) {
      if (pattern.test(textPrompt)) {
        throw ApiError.badRequest(
          'Adversarial Input Detected: Your query contains unauthorized instruction overrides. Please describe the physical maintenance fault naturally.'
        );
      }
    }
  }
}
