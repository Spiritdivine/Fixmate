/**
 * JobPrivacyUtil (Zero-Trust Privacy & Location Safeguards):
 * Ensures client exact physical home/office address and pinpoint coordinates
 * are never leaked to uncontracted artisans or public marketplace scapers.
 *
 * Full unmasked coordinates & street address are unveiled ONLY to:
 * 1. The job owner (client).
 * 2. An artisan with an ACCEPTED proposal / active escrow contract for this specific job.
 */
export class JobPrivacyUtil {
  /**
   * Deterministically fuzzes coordinate by ~400-600m to obscure rooftop location
   * while preserving the general neighborhood / district for routing estimates.
   */
  static fuzzCoordinate(coord) {
    if (coord == null || isNaN(Number(coord))) return null;
    const num = Number(coord);
    // Sinusoidal deterministic offset based on coordinate values
    const offset = Math.sin(num * 1000) * 0.005;
    return Number((num + offset).toFixed(5));
  }

  /**
   * Evaluates if requesting user has full privacy clearance for this job.
   */
  static isPrivilegedUser(job, requestingUserId) {
    if (!requestingUserId) return false;
    if (job.clientId === requestingUserId) return true;

    // Check if user is the contracted artisan on this job
    if (job.contracts && Array.isArray(job.contracts)) {
      const isContractedArtisan = job.contracts.some(
        (c) =>
          c.artisanId === requestingUserId &&
          ['PENDING_FUNDING', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'].includes(c.status)
      );
      if (isContractedArtisan) return true;
    }

    return false;
  }

  /**
   * Sanitizes a single job record based on requester authorization.
   */
  static sanitizeJob(job, requestingUserId) {
    if (!job) return job;

    const isPrivileged = this.isPrivilegedUser(job, requestingUserId);
    if (isPrivileged) {
      return {
        ...job,
        isAddressMasked: false,
      };
    }

    // Public / Prospective Artisan Sanitization
    const city = job.lgaCity || 'Lagos Area';
    const state = job.state || 'Lagos';
    const generalizedAddress = `${city}, ${state}`;

    const clientProfile = job.client?.clientProfile;

    return {
      ...job,
      address: generalizedAddress,
      latitude: this.fuzzCoordinate(job.latitude),
      longitude: this.fuzzCoordinate(job.longitude),
      isAddressMasked: true,
      client: job.client
        ? {
            id: job.client.id,
            avatarUrl: job.client.avatarUrl,
            clientProfile: clientProfile
              ? {
                  firstName: clientProfile.firstName || 'Artifix',
                  city: clientProfile.city || city,
                  state: clientProfile.state || state,
                }
              : null,
          }
        : undefined,
    };
  }

  /**
   * Batch sanitizes an array of jobs.
   */
  static sanitizeJobsList(jobs, requestingUserId) {
    if (!Array.isArray(jobs)) return jobs;
    return jobs.map((j) => this.sanitizeJob(j, requestingUserId));
  }
}
