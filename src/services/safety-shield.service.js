/**
 * Deterministic Safety Shield & Life-Hazard Interceptor
 * Evaluates natural language and audio transcripts against high-risk physical hazard patterns.
 * Invariants: If a critical hazard pattern matches, safety invariants override any permissive LLM hallucination.
 */
export class SafetyShieldService {
  static HAZARD_PATTERNS = [
    {
      type: 'ELECTRICAL_SHOCK',
      regex: /\b(spark|sparks|sparking|shock|shocked|shocking|electric shock|shock me|burnt smell|burning smell|smoke from switch|smoke from socket|arcing|naked wire|live wire|short circuit|cable burn|burnt cable|meter spark|db box smoking|changeover sparking|light dey shock|current dey bite|current dey shock|wire dey spark|breaker dey trip and smoke|sparking socket|smoking socket|water enter socket|water enter db|water in socket|water in db|wet breaker|water dripping on socket|water leaking on socket)\b/i,
      containment: [
        {
          stepNumber: 1,
          action: 'Immediately locate your Main Distribution Board (DB) and switch OFF the main incomer circuit breaker, ONLY IF SAFE to approach without touching water or active sparks.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Main Distribution Board Incomer Breaker',
        },
        {
          stepNumber: 2,
          action: 'Do NOT touch any scorched switchplates, metallic appliances, naked wires, or standing water near the area.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Wall Switches / Outlets',
        },
        {
          stepNumber: 3,
          action: 'Keep family members and pets completely clear of the affected room until a certified electrician conducts an insulation test.',
          urgency: 'PRECAUTIONARY',
          targetComponent: 'Affected Circuit',
        },
      ],
      forcedCategory: 'electrical-and-wiring',
      minSeverity: 'CRITICAL',
      minUrgency: 'EMERGENCY',
      alertHeadline: 'CRITICAL ELECTRICAL SAFETY ALERT (HIGH VOLTAGE / ARC HAZARD)',
    },
    {
      type: 'GAS_EXPLOSION',
      regex: /\b(gas smell|cooking gas leak|cylinder hissing|gas hissing|smell gas|lpg leak|cylinder leak|burner smelling gas|gas dey smell|cylinder dey hiss|gas leakage|smell for kitchen|gas don leak)\b/i,
      containment: [
        {
          stepNumber: 1,
          action: 'Do NOT operate any light switches, electrical appliances, phone chargers, or open flames. Do not strike matches or lighters.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Electrical Switches',
        },
        {
          stepNumber: 2,
          action: 'Open all windows and external doors immediately to maximize cross-ventilation and disperse vapor into open air.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Windows & Doors',
        },
        {
          stepNumber: 3,
          action: 'Carefully close the regulator control knob on top of the gas cylinder and exit the building immediately.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Cylinder Regulator',
        },
      ],
      forcedCategory: 'appliance-repair',
      minSeverity: 'CRITICAL',
      minUrgency: 'EMERGENCY',
      alertHeadline: 'CRITICAL GAS LEAK ALERT (EXPLOSION RISK)',
    },
    {
      type: 'ACTIVE_FLOODING',
      regex: /\b(burst pipe|pipe burst|water gushing|ceiling collapsed|ceiling sagging|flooding room|booster pump burst|water spraying everywhere|major pipe rupture|pipe don burst|water dey rush|water full parlour|ceiling wan fall)\b/i,
      containment: [
        {
          stepNumber: 1,
          action: 'Locate and turn the main external water stopcock / gate valve fully clockwise to cut off incoming municipal or overhead tank water flow.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Main Stopcock / Gate Valve',
        },
        {
          stepNumber: 2,
          action: 'Switch off the circuit breaker powering the water booster pump or water heater immediately to prevent dry-run burnout or electrocution.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Booster Pump Breaker',
        },
        {
          stepNumber: 3,
          action: 'If water is approaching electrical wall outlets or baseboards, immediately isolate the main power board if dry and safe to reach. Clear area beneath waterlogged ceiling.',
          urgency: 'PRECAUTIONARY',
          targetComponent: 'Electrical Isolator & Ceiling Area',
        },
      ],
      forcedCategory: 'plumbing-and-pipefitting',
      minSeverity: 'HIGH',
      minUrgency: 'EMERGENCY',
      alertHeadline: 'HIGH WATER INGRESS / ACTIVE FLOODING ALERT',
    },
    {
      type: 'FIRE_ARC',
      regex: /\b(fire|flames|smoke billowing|charred box|burning odor|burnt socket flame|meter catch fire|generator catch fire)\b/i,
      containment: [
        {
          stepNumber: 1,
          action: 'Isolate the main power supply only if safe to reach without approaching active flames or smoke.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Main Power Isolator',
        },
        {
          stepNumber: 2,
          action: 'Use dry powder (ABC) or CO2 fire extinguisher only. NEVER pour water on an electrical flame.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Fire Safety Equipment',
        },
        {
          stepNumber: 3,
          action: 'Evacuate all occupants from the premises immediately and contact emergency fire services.',
          urgency: 'IMMEDIATE_ACTION',
          targetComponent: 'Premises Evacuation',
        },
      ],
      forcedCategory: 'electrical-and-wiring',
      minSeverity: 'CRITICAL',
      minUrgency: 'EMERGENCY',
      alertHeadline: 'CRITICAL FIRE & SMOKE HAZARD ALERT',
    },
  ];

  /**
   * Fast deterministic check for acute life/property hazards (Gate 1 SLA < 2ms)
   * @param {string} text
   * @returns {{ isHazardous: boolean, primaryHazard: Object | null, matchedHazards: Array }}
   */
  static checkUrgentHazard(text = '') {
    if (!text || typeof text !== 'string') {
      return { isHazardous: false, primaryHazard: null, matchedHazards: [] };
    }
    const clean = text.toLowerCase();
    const matchedHazards = [];

    for (const pattern of this.HAZARD_PATTERNS) {
      if (pattern.regex.test(clean)) {
        matchedHazards.push(pattern);
      }
    }

    return {
      isHazardous: matchedHazards.length > 0,
      primaryHazard: matchedHazards[0] || null,
      matchedHazards,
    };
  }

  /**
   * Generate authoritative deterministic safety containment reply without LLM dependency
   * @param {Object} primaryHazard
   * @param {string} [contextSnippet='']
   * @returns {string}
   */
  static generateImmediateContainmentResponse(primaryHazard, contextSnippet = '') {
    const stepsFormatted = primaryHazard.containment
      .map((s) => `${s.stepNumber}. **${s.action}**`)
      .join('\n');

    return `⚠️ **${primaryHazard.alertHeadline}**\n\nI have detected an active physical hazard. Your safety is the highest priority. Please execute these immediate containment steps right now:\n\n${stepsFormatted}\n\n> 🛑 **SAFETY RULE:** Do not attempt any DIY repairs or approach wet/sparking components while energized. Verified emergency specialists are available for immediate on-site dispatch under Artifix protection.`;
  }

  /**
   * Scan prompt and diagnostic payload, applying strict safety overrides if hazardous tokens exist
   * @param {string} rawPrompt
   * @param {Object} diagnosticResult
   * @returns {Object} Hardened diagnostic result
   */
  static scanAndEnforce(rawPrompt = '', diagnosticResult = {}) {
    const combinedText = `${rawPrompt || ''} ${diagnosticResult.probableCause || ''} ${diagnosticResult.diagnosticTitle || ''}`.toLowerCase();

    const hazardCheck = this.checkUrgentHazard(combinedText);

    if (hazardCheck.isHazardous && hazardCheck.primaryHazard) {
      const primaryHazard = hazardCheck.primaryHazard;

      // Enforce strict safety invariants
      diagnosticResult.isHazardous = true;
      diagnosticResult.diyAllowed = false;
      diagnosticResult.requiresArtisan = true;
      diagnosticResult.diyRiskReason = `CRITICAL HAZARD DETECTED (${primaryHazard.type}): High risk of death, electric shock, fire, or catastrophic property loss. Professional physical containment is strictly required.`;

      // Severity override
      const severityLevels = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4 };
      const currentLevel = severityLevels[diagnosticResult.severity] || 2;
      const targetLevel = severityLevels[primaryHazard.minSeverity] || 4;
      if (currentLevel < targetLevel) {
        diagnosticResult.severity = primaryHazard.minSeverity;
      }

      // Urgency override
      const urgencyLevels = { ROUTINE: 1, SCHEDULED: 2, URGENT: 3, EMERGENCY: 4 };
      const currentUrgency = urgencyLevels[diagnosticResult.urgency] || 1;
      const targetUrgency = urgencyLevels[primaryHazard.minUrgency] || 4;
      if (currentUrgency < targetUrgency) {
        diagnosticResult.urgency = primaryHazard.minUrgency;
      }

      // Ingest mandatory containment steps
      const existingSteps = Array.isArray(diagnosticResult.safetyInstructions)
        ? diagnosticResult.safetyInstructions
        : [];

      diagnosticResult.safetyInstructions = [...primaryHazard.containment, ...existingSteps];

      // Assign hazard types
      const types = hazardCheck.matchedHazards.map((h) => h.type);
      diagnosticResult.hazardTypes = Array.from(new Set([...(diagnosticResult.hazardTypes || []), ...types])).filter(
        (t) => t !== 'NONE'
      );
    }

    return diagnosticResult;
  }

  /**
   * Gate 2: Validate LLM output against forbidden unsafe instructions
   * @param {string} text
   * @returns {{ isSafe: boolean, sanitizedText: string }}
   */
  static validateSafeOutput(text = '') {
    if (!text || typeof text !== 'string') return { isSafe: true, sanitizedText: text };

    const unsafePatterns = [
      /\b(touch the (live|naked|bare) wire)\b/i,
      /\b(pour water on the (electrical|socket|breaker|panel))\b/i,
      /\b(strike a match|use a lighter|turn on the light) (near|in) the gas\b/i,
      /\b(step into the water near the (breaker|socket|db))\b/i,
    ];

    for (const pat of unsafePatterns) {
      if (pat.test(text)) {
        return {
          isSafe: false,
          sanitizedText: `⚠️ **SAFETY INTERCEPTION:** Generated advice was suppressed because it suggested an unsafe physical action. Please isolate main power/water supplies and consult a verified specialist immediately.`,
        };
      }
    }

    return { isSafe: true, sanitizedText: text };
  }
}
