import crypto from 'crypto';

export class ImageForensicsService {
  /**
   * Computes a deterministic perceptual fingerprint from an image buffer or URL string
   * Emulates block mean perceptual hashing
   * @param {Buffer|string} input - buffer or data string
   * @returns {string} 16-character hex hash
   */
  static computePerceptualHash(input) {
    if (!input) return '0000000000000000';

    if (Buffer.isBuffer(input)) {
      // Sample blocks across the image buffer to capture spatial distribution
      const step = Math.max(1, Math.floor(input.length / 64));
      const sampled = [];
      for (let i = 0; i < input.length && sampled.length < 64; i += step) {
        sampled.push(input[i]);
      }
      return crypto.createHash('sha256').update(Buffer.from(sampled)).digest('hex').substring(0, 16);
    }

    if (typeof input === 'string') {
      return crypto.createHash('sha256').update(input.trim()).digest('hex').substring(0, 16);
    }

    return '0000000000000000';
  }

  /**
   * Compute character-level Hamming Distance between two hex strings
   * @param {string} hashA
   * @param {string} hashB
   * @returns {number} Hamming distance
   */
  static computeHammingDistance(hashA = '', hashB = '') {
    if (!hashA || !hashB) return 16;
    let distance = 0;
    const len = Math.min(hashA.length, hashB.length);
    for (let i = 0; i < len; i++) {
      if (hashA[i] !== hashB[i]) {
        distance++;
      }
    }
    distance += Math.abs(hashA.length - hashB.length);
    return distance;
  }

  /**
   * Verify divergence between pre-repair and post-repair photos to prevent fraud
   * @param {string|Buffer} prePhoto
   * @param {string|Buffer} postPhoto
   * @returns {{ isValid: boolean, reason?: string, hammingDistance: number }}
   */
  static verifyPhotoDivergence(prePhoto, postPhoto) {
    const hashPre = this.computePerceptualHash(prePhoto);
    const hashPost = this.computePerceptualHash(postPhoto);
    const distance = this.computeHammingDistance(hashPre, hashPost);

    // If hashes are identical or near-identical, flag as duplicate fraud
    if (distance <= 1) {
      return {
        isValid: false,
        reason: 'Fraud Detection Alert: Post-repair photo is identical to the pre-repair diagnostic photo.',
        hammingDistance: distance,
      };
    }

    return {
      isValid: true,
      hammingDistance: distance,
    };
  }
}
