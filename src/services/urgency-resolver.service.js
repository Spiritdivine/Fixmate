/**
 * Corroborated Emergency Urgency Resolution Matrix
 * Resolves final triage urgency by corroborating acoustic tone agitation with semantic physical risk.
 */
export class UrgencyResolver {
  /**
   * Determine final urgency enum: ROUTINE | SCHEDULED | URGENT | EMERGENCY
   * @param {Object} params
   * @param {string} params.semanticSeverity - LOW, MODERATE, HIGH, CRITICAL
   * @param {boolean} params.isEmergencyTone - acoustic pitch agitation detected
   * @param {boolean} params.hasActiveHazard - whether life-safety hazard is flagged
   * @returns {string} resolved urgency level
   */
  static resolve({ semanticSeverity = 'MODERATE', isEmergencyTone = false, hasActiveHazard = false }) {
    // Invariant: Confirmed life/property hazard always resolves to EMERGENCY
    if (hasActiveHazard || semanticSeverity === 'CRITICAL') {
      return 'EMERGENCY';
    }

    if (semanticSeverity === 'HIGH') {
      return isEmergencyTone ? 'EMERGENCY' : 'URGENT';
    }

    if (semanticSeverity === 'MODERATE') {
      return isEmergencyTone ? 'URGENT' : 'SCHEDULED';
    }

    // LOW severity: Frustrated or loud speech alone does NOT trigger emergency callout
    return 'ROUTINE';
  }
}
