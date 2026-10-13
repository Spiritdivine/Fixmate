import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { MatchingEngineService } from './matching-engine.service.js';
import { TranscriptionService } from './transcription.service.js';
import { AiCacheService } from './ai-cache.service.js';
import { SafetyShieldService } from './safety-shield.service.js';
import { PromptGuardrailService } from './prompt-guardrail.service.js';
import { UrgencyResolver } from './urgency-resolver.service.js';
import { BomPricingService } from './bom-pricing.service.js';
import { DiagnosticResponseSchema, normalizeSafetyInstructions } from '../schemas/ai-diagnostic.schema.js';

let openaiClient = null;
if (env.OPENAI_API_KEY) {
  try {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  } catch (err) {
    console.warn('⚠️ Failed to initialize OpenAI client:', err.message);
  }
}

let geminiClient = null;
if (env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  } catch (err) {
    console.warn('⚠️ Failed to initialize GoogleGenAI client:', err.message);
  }
}

export class AiDiagnosticService {
  /**
   * Run multimodal diagnostic analysis with unified Zod schema, safety shield, and economic price indexing
   */
  static async runDiagnostic({
    textPrompt = '',
    imageUrls = [],
    visionImageUrls = [],
    voiceAudioBuffer = null,
    voiceMimeType = 'audio/webm',
    voiceAudioUrl = null,
    clientCoords = null,
    clientAddress = null,
    clientState = 'Lagos',
    clientLga = null,
    userId = null,
    clientSessionToken = null,
    clientRequestedArtisan = false,
  }) {
    // 1. Guardrail against prompt injections or illegal utility tampering
    PromptGuardrailService.validateUserQuery(textPrompt);

    const activeVisionImages = visionImageUrls.length > 0 ? visionImageUrls : imageUrls;

    if (!textPrompt && (!activeVisionImages || activeVisionImages.length === 0) && !voiceAudioBuffer && !voiceAudioUrl) {
      throw ApiError.badRequest('Please provide a text description, photo, or voice note of the issue.');
    }

    let audioTranscriptionResult = null;
    let effectiveTextPrompt = textPrompt;

    // 2. Transcribe voice note if buffer provided
    if (voiceAudioBuffer) {
      audioTranscriptionResult = await TranscriptionService.transcribeAudioBuffer({
        audioBuffer: voiceAudioBuffer,
        mimeType: voiceMimeType,
      });

      if (audioTranscriptionResult?.technicalSummary) {
        effectiveTextPrompt = [
          textPrompt ? `User Typed: ${textPrompt}` : '',
          `Voice Description: ${audioTranscriptionResult.technicalSummary}`,
        ]
          .filter(Boolean)
          .join('\n');
      }
    }

    // 2.5 Intent Gating: Disclose whether an actual fault/repair issue is indicated
    const userIntent = this._detectUserIntent(
      effectiveTextPrompt,
      activeVisionImages?.length || 0,
      Boolean(voiceAudioBuffer || voiceAudioUrl)
    );

    if (!userIntent.hasIssue) {
      // Pure greeting or general inquiry with no issue indicated:
      // 1. Never tag a chat as being a particular craft (category = null).
      // 2. Never recommend or match artisans (matchedArtisans = []).
      // 3. Do not generate fake diagnostic titles, probable causes, labor costs, or BOM items.
      const session = await prisma.aiDiagnosticSession.create({
        data: {
          userId,
          clientSessionToken: clientSessionToken || `guest_${Date.now()}`,
          inputType: 'TEXT',
          rawTextPrompt: textPrompt || null,
          transcribedAudio: audioTranscriptionResult?.literalTranscript || null,
          voiceAudioUrl: voiceAudioUrl || null,
          diagnosticTitle: null,
          probableCause: null,
          severity: 'LOW',
          urgency: 'ROUTINE',
          isHazardous: false,
          safetyInstructions: [],
          diyAllowed: true,
          diyGuide: null,
          clarificationQuestion: null,
          clarificationOptions: [],
          artisanAudioScript: null,
          estimatedBOM: [],
          estimatedLaborMin: null,
          estimatedLaborMax: null,
          currency: 'NGN',
          matchedCategoryId: null,
          recommendedSkills: [],
          clientLatitude: clientCoords?.latitude ? Number(clientCoords.latitude) : null,
          clientLongitude: clientCoords?.longitude ? Number(clientCoords.longitude) : null,
          clientAddress: clientAddress || null,
        },
        include: {
          category: true,
          mediaFiles: true,
        },
      });

      const conversationalReply = await this._generateDynamicGreeting(textPrompt);

      return {
        session,
        diagnosis: {
          diagnosticTitle: null,
          probableCause: null,
          severity: 'LOW',
          urgency: 'ROUTINE',
          isHazardous: false,
          diyAllowed: true,
          categorySlug: null,
          estimatedBOM: [],
          estimatedLaborMin: null,
          estimatedLaborMax: null,
          conversationalReply,
        },
        conversationalReply,
        category: null,
        diyRecommended: false,
        matchedArtisans: [],
        preliminaryArtisans: [],
        matchingNotice: null,
        clarification: null,
        artisanScript: null,
      };
    }

    // 3. Cache lookup for pure text queries
    let parsedResult = null;
    const cacheKey =
      effectiveTextPrompt && (!activeVisionImages || activeVisionImages.length === 0)
        ? AiCacheService.hashKey(effectiveTextPrompt, '', clientAddress || '')
        : null;

    if (cacheKey) {
      const cached = AiCacheService.get(cacheKey);
      if (cached) {
        parsedResult = { ...cached };
      }
    }

    // 4. Model Inference Tier: OpenAI -> Gemini -> Heuristic Fallback
    if (!parsedResult) {
      if (openaiClient && AiCacheService.isProviderHealthy('openai')) {
        try {
          parsedResult = await this._callOpenAI({ textPrompt: effectiveTextPrompt, imageUrls: activeVisionImages });
          AiCacheService.recordProviderSuccess('openai');
        } catch (error) {
          AiCacheService.recordProviderFailure('openai', error);
          console.warn(`⚠️ OpenAI diagnostic call failed (${error.message}). Falling back to Gemini / rules.`);
        }
      }

      if (!parsedResult && geminiClient && AiCacheService.isProviderHealthy('gemini')) {
        try {
          parsedResult = await this._callGemini({ textPrompt: effectiveTextPrompt, imageUrls: activeVisionImages });
          AiCacheService.recordProviderSuccess('gemini');
        } catch (error) {
          AiCacheService.recordProviderFailure('gemini', error);
          console.warn(`⚠️ Gemini API call failed (${error.message}). Falling back to internal diagnostic rules.`);
        }
      }

      if (!parsedResult) {
        parsedResult = this._simulateDiagnostic({ textPrompt: effectiveTextPrompt, imageUrls });
      }

      // 5. Schema Validation & Normalization via Zod
      parsedResult = this._validateAndNormalize(parsedResult);

      if (cacheKey && parsedResult) {
        AiCacheService.set(cacheKey, parsedResult);
      }
    }

    // 6. Domain 1 Safety Shield: Deterministic regex scan & mandatory containment enforcement
    parsedResult = SafetyShieldService.scanAndEnforce(effectiveTextPrompt, parsedResult);

    // 7. Domain 1 Urgency Corroboration: Resolve final urgency with acoustic tone corroboration
    parsedResult.urgency = UrgencyResolver.resolve({
      semanticSeverity: parsedResult.severity,
      isEmergencyTone: Boolean(audioTranscriptionResult?.isEmergencyTone),
      hasActiveHazard: Boolean(parsedResult.isHazardous),
    });

    // 8. Domain 2 Economic Pricing: Adjust BOM items using regional inflation price oracle
    if (parsedResult.estimatedBOM && parsedResult.estimatedBOM.length > 0) {
      parsedResult.estimatedBOM = await BomPricingService.adjustBomToMarket({
        bomItems: parsedResult.estimatedBOM,
        state: clientState || 'Lagos',
        city: clientLga || 'Lagos',
        tradeCategory: parsedResult.categorySlug || 'general',
      });
    }

    // 9. Resolve category from database by slug or canonical fallback
    let category = null;
    if (parsedResult.categorySlug) {
      category = await prisma.jobCategory.findFirst({
        where: {
          OR: [
            { slug: { contains: parsedResult.categorySlug, mode: 'insensitive' } },
            { name: { contains: parsedResult.categorySlug.replace(/-/g, ' '), mode: 'insensitive' } },
          ],
        },
      });
    }

    // If category wasn't matched, leave it as null rather than forcing an unrelated trade


    // Determine input type enum
    let inputType = 'TEXT';
    if (voiceAudioBuffer || voiceAudioUrl) {
      inputType = imageUrls.length > 0 ? 'MULTIMODAL' : 'VOICE';
    } else if (imageUrls && imageUrls.length > 0) {
      inputType = textPrompt ? 'MULTIMODAL' : 'PHOTO';
    }

    // Clarification questions check
    const clarification = TranscriptionService.generateClarificationQuestions({
      textPrompt: effectiveTextPrompt,
      categorySlug: parsedResult.categorySlug || '',
    });

    // Synthesize artisan audio briefing script
    const artisanScript = TranscriptionService.generateArtisanAudioScript({
      session: {
        diagnosticTitle: parsedResult.diagnosticTitle,
        probableCause: parsedResult.probableCause,
        clientAddress,
        estimatedBOM: parsedResult.estimatedBOM,
      },
    });

    // Filter out huge base64 strings from persistent media table
    const safeMediaUrls = imageUrls.filter((url) => typeof url === 'string' && url.startsWith('http'));

    // 10. Persist Session into PostgreSQL
    const session = await prisma.aiDiagnosticSession.create({
      data: {
        userId,
        clientSessionToken: clientSessionToken || `guest_${Date.now()}`,
        inputType,
        rawTextPrompt: textPrompt || null,
        transcribedAudio: audioTranscriptionResult?.literalTranscript || null,
        voiceAudioUrl: voiceAudioUrl || null,
        diagnosticTitle: parsedResult.diagnosticTitle,
        probableCause: parsedResult.probableCause,
        severity: parsedResult.severity,
        urgency: parsedResult.urgency,
        isHazardous: parsedResult.isHazardous,
        safetyInstructions: parsedResult.safetyInstructions || [],
        diyAllowed: parsedResult.diyAllowed,
        diyGuide: parsedResult.diyGuide || null,
        clarificationQuestion: clarification?.question || null,
        clarificationOptions: clarification?.options || [],
        artisanAudioScript: artisanScript,
        estimatedBOM: parsedResult.estimatedBOM || [],
        estimatedLaborMin: parsedResult.estimatedLaborMin ? Number(parsedResult.estimatedLaborMin) : null,
        estimatedLaborMax: parsedResult.estimatedLaborMax ? Number(parsedResult.estimatedLaborMax) : null,
        currency: parsedResult.currency || 'NGN',
        matchedCategoryId: category ? category.id : null,
        recommendedSkills: parsedResult.recommendedSkills || [],
        clientLatitude: clientCoords?.latitude ? Number(clientCoords.latitude) : null,
        clientLongitude: clientCoords?.longitude ? Number(clientCoords.longitude) : null,
        clientAddress: clientAddress || null,
        mediaFiles: {
          create: safeMediaUrls.map((url) => ({
            mediaUrl: url,
            mediaType: 'image/webp',
            fileSize: 0,
            aiVisualSummary: parsedResult.visualObservations || null,
          })),
        },
      },
      include: {
        category: true,
        mediaFiles: true,
      },
    });

    // Record audit log if safety hazard or emergency was flagged
    if (parsedResult.isHazardous || parsedResult.urgency === 'EMERGENCY') {
      try {
        await prisma.diagnosticAuditLog.create({
          data: {
            diagnosticSessionId: session.id,
            event: 'SAFETY_HAZARD_FLAGGED',
            payload: {
              severity: parsedResult.severity,
              urgency: parsedResult.urgency,
              hazardTypes: parsedResult.hazardTypes,
              clientAddress,
            },
          },
        });
      } catch (err) {
        console.warn('⚠️ Could not write audit log:', err.message);
      }
    }

    // 11. Domain 3 Artisan Matching: Execute 5-Pillar Matching Engine
    let resolvedState = clientState || 'Lagos';
    const lowerPrompt = (effectiveTextPrompt || '').toLowerCase();
    if (lowerPrompt.includes('abuja') || lowerPrompt.includes('fct')) {
      resolvedState = 'FCT';
    } else if (lowerPrompt.includes('lagos') || lowerPrompt.includes('ikeja') || lowerPrompt.includes('lekki')) {
      resolvedState = 'Lagos';
    }

    let matchedArtisans = [];
    let matchingNotice = null;
    const isEmergencyHazard =
      parsedResult.urgency === 'EMERGENCY' ||
      parsedResult.isHazardous === true ||
      parsedResult.severity === 'CRITICAL';
    const shouldMatchArtisans = (isEmergencyHazard || clientRequestedArtisan === true) && category != null;

    if (shouldMatchArtisans) {
      const matchResult = await MatchingEngineService.findTopMatches({
        diagnosticSessionId: session.id,
        categoryId: category ? category.id : null,
        categorySlug: parsedResult.categorySlug,
        skillSlugs: parsedResult.recommendedSkills || [],
        clientLat: clientCoords?.latitude || null,
        clientLng: clientCoords?.longitude || null,
        clientState: resolvedState,
        clientLga,
        isEmergency: parsedResult.urgency === 'EMERGENCY',
        limit: 3,
      });

      matchedArtisans = matchResult.candidates || [];
      if (matchedArtisans.length === 0) {
        matchingNotice = matchResult.message || `No active verified specialists in this trade currently available within ${resolvedState}.`;
      }
    }

    let conversationalReply =
      parsedResult.conversationalReply || parsedResult.probableCause || 'Here is what I found regarding this fault.';

    if (shouldMatchArtisans && matchedArtisans.length === 0) {
      const tradeName = category?.name || 'this trade';
      conversationalReply += `\n\n> ℹ️ **Availability & Quality Guarantee:** There are currently no verified ${tradeName} specialists available closeby in ${resolvedState}. To preserve certified workmanship and safety, Fixmate strictly prohibits cross-trade substitution (we will never recommend an electrician, carpenter, or unverified trade for a plumbing job).`;
    }

    return {
      session,
      diagnosis: parsedResult,
      conversationalReply,
      category,
      diyRecommended: parsedResult.diyAllowed && !clientRequestedArtisan,
      matchedArtisans,
      preliminaryArtisans: matchedArtisans,
      matchingNotice,
    };
  }

  /**
   * Master Artisan Conversational Diagnostic via OpenAI GPT-4o with FULL structured output
   */
  static async _callOpenAI({ textPrompt, imageUrls = [] }) {
    if (!openaiClient) throw new Error('OpenAI client not initialized');

    const systemPrompt = `You are a master trade engineering consultant on Fixmate (Artifix) with 15+ years of practical experience across electrical, plumbing, HVAC, generator, carpentry, and masonry trades in West Africa.

CRITICAL INSTRUCTIONS:
1. Provide a natural, master-artisan conversational reply formatted in clean markdown.
2. Output a complete, strictly valid JSON object conforming to the required schema with all fields.
3. Include realistic Bill of Materials (estimatedBOM) in Nigerian Naira (NGN), estimatedLaborMin, estimatedLaborMax, safety containment instructions, and required trade skills.

Schema Specification:
{
  "conversationalReply": "Conversational markdown explanation and direct advice",
  "diagnosticTitle": "Short 3-5 word technical title",
  "probableCause": "Precise 1-sentence technical root cause summary",
  "categorySlug": "One of: electrical-and-wiring, plumbing-and-pipefitting, hvac-and-ac-repair, generator-and-power-plants, carpentry-and-woodwork, masonry-and-tiling, painting-and-pop, appliance-repair",
  "severity": "LOW, MODERATE, HIGH, or CRITICAL",
  "urgency": "ROUTINE, SCHEDULED, URGENT, or EMERGENCY",
  "isHazardous": true or false,
  "hazardTypes": ["NONE", "ELECTRICAL_SHOCK", "FIRE_ARC", "GAS_EXPLOSION", "ACTIVE_FLOODING"],
  "safetyInstructions": [
    { "stepNumber": 1, "action": "Clear containment instruction", "urgency": "IMMEDIATE_ACTION", "targetComponent": "Breaker/Valve" }
  ],
  "diyAllowed": true or false,
  "diyRiskReason": "Reason why DIY is unsafe, or null",
  "diyGuide": "Safe step-by-step DIY check if allowed, or null",
  "requiresArtisan": true or false,
  "estimatedBOM": [
    { "item": "Part Name", "specification": "Specs", "quantity": 1, "unit": "PCS", "estimatedCostMin": 5000, "estimatedCostMax": 9000, "marketCategory": "ELECTRICAL" }
  ],
  "estimatedLaborMin": 6000,
  "estimatedLaborMax": 15000,
  "currency": "NGN",
  "recommendedSkills": ["skill-slug-1", "skill-slug-2"],
  "visualObservations": "Visual notes from attached photo or null"
}`;

    const userContent =
      imageUrls.length > 0
        ? [
            { type: 'text', text: textPrompt || 'Please inspect this fault from the attached photos.' },
            ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
          ]
        : textPrompt;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Call Gemini 2.0 Flash Multimodal Vision & Reasoning API with FULL schema
   */
  static async _callGemini({ textPrompt, imageUrls = [] }) {
    if (!geminiClient) throw new Error('Gemini client not initialized');

    const systemPrompt = `You are the Chief Diagnostic Engineering AI for Fixmate (Artifix), Nigeria.
Diagnose the physical/mechanical/electrical fault based on the text description and photos.

Return strictly a valid JSON object matching this specification:
{
  "conversationalReply": "Warm, practical master-artisan advice in markdown",
  "diagnosticTitle": "Short 3-5 word technical title",
  "probableCause": "Precise root cause",
  "categorySlug": "One of: electrical-and-wiring, plumbing-and-pipefitting, hvac-and-ac-repair, generator-and-power-plants, carpentry-and-woodwork, masonry-and-tiling, painting-and-pop, appliance-repair",
  "severity": "LOW, MODERATE, HIGH, or CRITICAL",
  "urgency": "ROUTINE, SCHEDULED, URGENT, or EMERGENCY",
  "isHazardous": true or false,
  "hazardTypes": ["NONE", "ELECTRICAL_SHOCK", "FIRE_ARC", "GAS_EXPLOSION", "ACTIVE_FLOODING"],
  "safetyInstructions": [
    { "stepNumber": 1, "action": "Actionable step", "urgency": "IMMEDIATE_ACTION", "targetComponent": "Breaker/Valve" }
  ],
  "diyAllowed": true or false,
  "diyRiskReason": "Why DIY is unsafe, or null",
  "diyGuide": "Safe steps if allowed, or null",
  "requiresArtisan": true or false,
  "estimatedBOM": [
    { "item": "Part Name", "specification": "Specs", "quantity": 1, "unit": "PCS", "estimatedCostMin": 5000, "estimatedCostMax": 9000, "marketCategory": "ELECTRICAL" }
  ],
  "estimatedLaborMin": 6000,
  "estimatedLaborMax": 15000,
  "currency": "NGN",
  "recommendedSkills": ["skill-slug-1"],
  "visualObservations": "Observations or null"
}`;

    const contents = [{ text: systemPrompt }];
    if (textPrompt) {
      contents.push({ text: `User Description: ${textPrompt}` });
    }
    for (const url of imageUrls) {
      contents.push({ text: `ATTACHED MEDIA REFERENCE: ${url}` });
    }

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    return JSON.parse(response.text);
  }

  /**
   * Fallback heuristic simulation adhering strictly to unified schema
   */
  static _simulateDiagnostic({ textPrompt = '', imageUrls = [] }) {
    const lower = textPrompt.toLowerCase();

    // Electrical fault
    if (
      lower.includes('spark') ||
      lower.includes('shock') ||
      lower.includes('breaker') ||
      lower.includes('trip') ||
      lower.includes('wire') ||
      lower.includes('socket') ||
      lower.includes('nepa') ||
      lower.includes('light')
    ) {
      const isCritical =
        lower.includes('spark') || lower.includes('shock') || lower.includes('burn') || lower.includes('smoke');

      return {
        conversationalReply: isCritical
          ? 'I notice signs of an electrical arc short circuit. For your safety, isolate the main incomer breaker immediately before touching any switches.'
          : 'Your circuit breaker tripping is typically caused by circuit overload or an appliance surge. Let us have a certified electrician check the line.',
        diagnosticTitle: isCritical ? 'Critical Electrical Fault / Short Circuit' : 'Circuit Breaker Tripping / Overload',
        probableCause: isCritical
          ? 'Damaged cable insulation, loose terminal arcing, or severe grounding short circuit.'
          : 'Appliance power surge, faulty RCBO/MCB breaker, or unbalanced neutral line.',
        severity: isCritical ? 'CRITICAL' : 'HIGH',
        urgency: isCritical ? 'EMERGENCY' : 'URGENT',
        isHazardous: isCritical,
        hazardTypes: isCritical ? ['ELECTRICAL_SHOCK'] : ['NONE'],
        safetyInstructions: [
          { stepNumber: 1, action: 'Immediately switch off the main distribution incomer breaker.', urgency: 'IMMEDIATE_ACTION', targetComponent: 'Main Distribution Board' },
          { stepNumber: 2, action: 'Do NOT touch exposed wires, charred outlets, or metallic switchplates.', urgency: 'IMMEDIATE_ACTION', targetComponent: 'Switches' },
        ],
        diyAllowed: false,
        diyRiskReason: 'High voltage shock and fire hazard. Requires certified electrician.',
        diyGuide: null,
        requiresArtisan: true,
        estimatedBOM: [
          { item: 'Replacement MCB/RCBO 32A Breaker', specification: 'Schneider / Chint 32A', quantity: 1, unit: 'PCS', estimatedCostMin: 5500, estimatedCostMax: 9500, marketCategory: 'ELECTRICAL' },
          { item: 'Heavy-Duty Terminal Block & Insulation Tape', specification: 'Flame Retardant', quantity: 1, unit: 'PCS', estimatedCostMin: 1800, estimatedCostMax: 3500, marketCategory: 'ELECTRICAL' },
        ],
        estimatedLaborMin: 7000,
        estimatedLaborMax: 16000,
        currency: 'NGN',
        categorySlug: 'electrical-and-wiring',
        recommendedSkills: ['electrical-wiring', 'circuit-breaker-replacement', 'fault-finding'],
        visualObservations: imageUrls.length > 0 ? 'Signs of electrical panel wear or outlet discolouration.' : null,
        symptoms: ['Electrical arcing, breaker trip, or burning odor reported'],
        possibleCauses: [
          {
            label: isCritical ? 'Short circuit arcing or insulation breakdown' : 'Circuit overload or worn RCBO/MCB breaker',
            supportingEvidence: ['Symptom tokens present in user description'],
            missingEvidence: ['Physical continuity and insulation test'],
            likelihoodBand: isCritical ? 'high' : 'moderate',
          },
        ],
        guidanceSteps: [
          {
            stepNumber: 1,
            instruction: 'Switch off main isolator breaker if dry and safe to approach.',
            risk: 'low',
            stopConditions: ['Do not touch panel if wet, scorched, or sparking.'],
          },
        ],
        nextAction: isCritical ? 'show_emergency_options' : 'continue_chat',
      };
    }

    // Plumbing fault
    if (
      lower.includes('leak') ||
      lower.includes('pipe') ||
      lower.includes('water') ||
      lower.includes('tap') ||
      lower.includes('sink') ||
      lower.includes('toilet') ||
      lower.includes('pump') ||
      lower.includes('drain')
    ) {
      const isFlooding = lower.includes('burst') || lower.includes('flood') || lower.includes('gush');

      return {
        conversationalReply: isFlooding
          ? 'You have an active high-pressure pipe rupture. Turn off the main stopcock gate valve immediately to prevent structural damage.'
          : 'This looks like a worn valve washer or pipe seam leak. It can be serviced with replacement Teflon seal tape and coupling.',
        diagnosticTitle: isFlooding ? 'Burst High-Pressure Water Pipe' : 'Plumbing Joint Fissure & Faucet Leak',
        probableCause: isFlooding
          ? 'Failed PVC/PPR pipe seam or booster pump pressure surge rupturing line.'
          : 'Worn spindle rubber washer, calcified valve cartridge, or failed Teflon joint tape.',
        severity: isFlooding ? 'HIGH' : 'MODERATE',
        urgency: isFlooding ? 'URGENT' : 'SCHEDULED',
        isHazardous: isFlooding,
        hazardTypes: isFlooding ? ['ACTIVE_FLOODING'] : ['NONE'],
        safetyInstructions: [
          { stepNumber: 1, action: 'Turn off the main stopcock valve clockwise to halt incoming water.', urgency: 'IMMEDIATE_ACTION', targetComponent: 'Main Stopcock' },
          { stepNumber: 2, action: 'Power down any nearby water heater or booster pump.', urgency: 'IMMEDIATE_ACTION', targetComponent: 'Booster Pump' },
        ],
        diyAllowed: !isFlooding,
        diyRiskReason: isFlooding ? 'High water pressure can cause ceiling collapse and electrocution.' : null,
        diyGuide: !isFlooding ? 'Isolate the angle valve beneath the fixture and re-wrap Teflon tape clockwise.' : null,
        requiresArtisan: isFlooding,
        estimatedBOM: [
          { item: 'High-Pressure PPR Joint & Coupling (3/4")', specification: 'PN20 High Pressure', quantity: 2, unit: 'PCS', estimatedCostMin: 3000, estimatedCostMax: 6000, marketCategory: 'PLUMBING' },
          { item: 'Heavy Duty Teflon Sealant Tape & Thread Compound', specification: 'Gas & Water Grade', quantity: 2, unit: 'ROLLS', estimatedCostMin: 1200, estimatedCostMax: 2500, marketCategory: 'PLUMBING' },
        ],
        estimatedLaborMin: 6000,
        estimatedLaborMax: 14000,
        currency: 'NGN',
        categorySlug: 'plumbing-and-pipefitting',
        recommendedSkills: ['pipe-fitting', 'leak-repair', 'plumbing-fixtures'],
        visualObservations: imageUrls.length > 0 ? 'Visible moisture around piping junction or fixture threading.' : null,
        symptoms: [isFlooding ? 'High-pressure active water spray' : 'Localized moisture drip or joint leak'],
        possibleCauses: [
          {
            label: isFlooding ? 'Failed PPR pipe seam or booster pump surge' : 'Worn spindle washer or failing Teflon thread seal',
            supportingEvidence: ['Water leakage noted in description'],
            missingEvidence: ['Visual inspection of joint threading and valve seal'],
            likelihoodBand: isFlooding ? 'high' : 'moderate',
          },
        ],
        guidanceSteps: [
          {
            stepNumber: 1,
            instruction: 'Turn off the main external water stopcock valve clockwise.',
            risk: 'low',
            stopConditions: ['Do not enter waterlogged area if standing near live electrical points.'],
          },
        ],
        nextAction: isFlooding ? 'show_emergency_options' : 'continue_chat',
      };
    }

    // Default general repair
    return {
      conversationalReply: 'I have logged this maintenance symptom. A verified artisan can inspect and service the equipment on-site.',
      diagnosticTitle: 'General Property Maintenance & Repair',
      probableCause: 'Mechanical wear or component fatigue requiring on-site artisan physical inspection.',
      severity: 'LOW',
      urgency: 'ROUTINE',
      isHazardous: false,
      hazardTypes: ['NONE'],
      safetyInstructions: [
        { stepNumber: 1, action: 'Keep the affected area clean and dry.', urgency: 'PRECAUTIONARY', targetComponent: 'Equipment Area' },
      ],
      diyAllowed: true,
      diyRiskReason: null,
      diyGuide: 'Verify if simple cleaning or tightening resolves the issue safely.',
      requiresArtisan: false,
      estimatedBOM: [
        { item: 'General hardware fasteners & consumables', specification: 'Standard grade', quantity: 1, unit: 'SETS', estimatedCostMin: 2500, estimatedCostMax: 6000, marketCategory: 'HARDWARE' },
      ],
      estimatedLaborMin: 5000,
      estimatedLaborMax: 12000,
      currency: 'NGN',
      categorySlug: 'appliance-repair',
      recommendedSkills: ['general-maintenance', 'fault-inspection'],
      visualObservations: imageUrls.length > 0 ? 'Equipment visual reference logged.' : null,
      symptoms: [textPrompt ? `Observed symptom: ${textPrompt.slice(0, 120)}` : 'Routine wear and tear'],
      possibleCauses: [
        {
          label: 'Mechanical wear or component fatigue',
          supportingEvidence: ['User symptom report'],
          missingEvidence: ['Physical inspection and tool testing'],
          likelihoodBand: 'moderate',
        },
      ],
      guidanceSteps: [
        {
          stepNumber: 1,
          instruction: 'Visually check external screws and housing without touching internal mechanisms.',
          risk: 'low',
          stopConditions: ['Stop immediately if resistance or burning odor is felt.'],
        },
      ],
      nextAction: 'continue_chat',
    };
  }

  /**
   * Discern whether the input prompt describes an actual physical repair issue or is merely a greeting/general inquiry
   */
  static _detectUserIntent(textPrompt, imagesCount = 0, hasAudio = false) {
    if (imagesCount > 0 || hasAudio) {
      return { isGreeting: false, hasIssue: true };
    }

    const clean = (textPrompt || '').trim().toLowerCase();
    if (!clean) {
      return { isGreeting: false, hasIssue: false };
    }

    // Common trade & repair fault vocabulary
    const faultKeywords = [
      'leak', 'pipe', 'tap', 'sink', 'toilet', 'drain', 'water', 'plumb', 'flush', 'clog', 'tank', 'sump',
      'wire', 'spark', 'shock', 'light', 'socket', 'switch', 'breaker', 'fuse', 'electric', 'voltage', 'current', 'power', 'nepa', 'phase', 'tripping', 'trip',
      'ac', 'air condition', 'cool', 'gas', 'compressor', 'fridge', 'refrigerator', 'chiller', 'freon', 'r410',
      'gen', 'generator', 'engine', 'carburetor', 'oil', 'alternator', 'starter', 'cam',
      'door', 'wood', 'table', 'chair', 'cupboard', 'cabinet', 'hinge', 'lock', 'carpent', 'wardrobe', 'drawer',
      'paint', 'wall', 'crack', 'damp', 'ceiling', 'roof', 'tile', 'masonry', 'cement', 'plaster',
      'break', 'broken', 'damage', 'fault', 'spoil', 'not working', 'burnt', 'smell', 'smoke', 'burst', 'flood', 'overflow',
      'noise', 'humming', 'vibration', 'pressure', 'slow', 'stuck', 'jammed', 'loose', 'drip', 'dripping',
      'artisan', 'technician', 'plumber', 'electrician', 'carpenter', 'mechanic', 'repairman', 'fix', 'hire', 'service', 'install'
    ];

    const hasIssueKeyword = faultKeywords.some((kw) => clean.includes(kw));
    if (hasIssueKeyword) {
      return { isGreeting: false, hasIssue: true };
    }

    // Standard conversational greetings and introductory prompts
    const greetingWords = [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'good day',
      'how far', 'how are you', 'oga john', 'help', 'start', 'test', 'yo', 'sup',
      'who are you', 'what do you do', 'what can you do', 'how does this work', 'welcome', 'morning', 'afternoon', 'evening'
    ];

    const isGreeting = greetingWords.some(
      (g) => clean === g || clean === `${g}!` || clean === `${g}.` || clean.startsWith(`${g} `)
    );

    if (isGreeting || clean.length < 12) {
      return { isGreeting: true, hasIssue: false };
    }

    return { isGreeting: false, hasIssue: false };
  }

  /**
   * Dynamically synthesize contextual greeting without pre-programmed rigid templates
   */
  static async _generateDynamicGreeting(textPrompt = '') {
    const prompt = `You are Oga John, the Chief Master Diagnostic Engineer for Fixmate (Artifix) in Nigeria.
A user has just opened the chat and said: "${textPrompt || 'Hello'}".
Generate a warm, professional, dynamic greeting in authentic Nigerian English.
Introduce yourself concisely as Oga John, mention that you can diagnose mechanical, electrical, plumbing, HVAC, and generator faults from descriptions, photos, or voice notes, and ask what issue they are experiencing today.
Do NOT pretend an issue exists yet. Do NOT output markdown headers, just 2 friendly, natural paragraphs.`;

    if (geminiClient) {
      try {
        const response = await geminiClient.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ text: prompt }],
          config: { temperature: 0.7 },
        });
        if (response?.text) return response.text.trim();
      } catch (err) {
        console.warn('⚠️ Dynamic Gemini greeting failed, falling back:', err.message);
      }
    }

    if (openaiClient) {
      try {
        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });
        if (completion.choices?.[0]?.message?.content) {
          return completion.choices[0].message.content.trim();
        }
      } catch (err) {
        console.warn('⚠️ Dynamic OpenAI greeting failed, falling back:', err.message);
      }
    }

    // Adaptive contextual fallback
    const greetings = [
      `Hello! I am **Oga John**, your Artifix AI Technical Diagnostic Specialist. 👋\n\nI can help you troubleshoot technical faults around your home or office, diagnose what's broken, recommend safe step-by-step DIY solutions, or connect you with verified local artisans when you need one.\n\nWhat seems to be the problem today? You can describe the issue, upload a photo, or send a voice note (e.g., leaking pipe, tripping circuit breaker, AC not cooling, generator knocking, etc.).`,
      `Welcome! **Oga John** here from Artifix. 👋\n\nI am on hand to help you diagnose any property maintenance issue—from tripping breakers and low water pressure to faulty cooling systems. Tell me what is going on, or share an inspection photo, and we will get it sorted safely.\n\nHow can I help you today?`,
      `Good day! I am **Oga John**, your Artifix Technical Specialist. 👋\n\nIf you have a fault in your home or office—plumbing leak, electrical surge, AC breakdown, or generator troubles—I can help diagnose the root cause and advise on safe next steps or connect you with verified local artisans.\n\nWhat issue are you facing right now?`,
    ];
    const idx = Math.abs((textPrompt || '').length) % greetings.length;
    return greetings[idx];
  }

  /**
   * Enforce schema invariants via Zod validation
   */
  static _validateAndNormalize(raw) {
    if (raw.safetyInstructions) {
      raw.safetyInstructions = normalizeSafetyInstructions(raw.safetyInstructions);
    }
    const parsed = DiagnosticResponseSchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }
    console.warn('⚠️ Diagnostic response normalization notice:', parsed.error.issues);
    return {
      ...this._simulateDiagnostic({ textPrompt: raw.probableCause || '' }),
      ...raw,
      safetyInstructions: normalizeSafetyInstructions(raw.safetyInstructions || []),
    };
  }

  /**
   * Fetch a single diagnostic session by ID
   */
  static async getSessionById(sessionId) {
    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: {
        category: true,
        mediaFiles: true,
        recommendations: {
          include: { artisan: { include: { user: true } } },
        },
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found');
    }

    return session;
  }

  /**
   * Fetch historical sessions for a user
   */
  static async getUserSessions(userId, limit = 20) {
    return prisma.aiDiagnosticSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        category: true,
        mediaFiles: true,
      },
    });
  }

  /**
   * Process interactive clarification answer
   */
  static async submitClarificationAnswer({ sessionId, answer }) {
    if (!sessionId || !answer) {
      throw ApiError.badRequest('Session ID and clarification answer are required.');
    }

    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: { category: true },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found.');
    }

    const refinedProbableCause = `${session.probableCause} [Client Confirmed: ${answer}]`;

    const updatedSession = await prisma.aiDiagnosticSession.update({
      where: { id: sessionId },
      data: {
        clarificationAnswer: answer,
        probableCause: refinedProbableCause,
      },
      include: {
        category: true,
        mediaFiles: true,
      },
    });

    const matchResult = await MatchingEngineService.findTopMatches({
      diagnosticSessionId: sessionId,
      categoryId: updatedSession.matchedCategoryId,
      clientLat: updatedSession.clientLatitude ? Number(updatedSession.clientLatitude) : null,
      clientLng: updatedSession.clientLongitude ? Number(updatedSession.clientLongitude) : null,
      limit: 3,
    });

    return {
      session: updatedSession,
      matchedArtisans: matchResult.candidates || [],
      clarificationConfirmed: true,
    };
  }

  /**
   * Multi-Turn Conversational Chat Engine with OpenAI/Gemini reasoning & continuous safety scanning
   */
  static async processChatMessage({
    sessionId,
    userMessage = '',
    conversationHistory = [],
    clientCoords = null,
    newImageUrls = [],
    voiceAudioBuffer = null,
    voiceMimeType = 'audio/webm',
  }) {
    PromptGuardrailService.validateUserQuery(userMessage);

    if (!sessionId) {
      throw ApiError.badRequest('Session ID is required for chat messaging.');
    }

    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: { category: true, mediaFiles: true },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found.');
    }

    // 1. Process Voice Note Transcription if present
    let transcribedVoiceText = null;
    if (voiceAudioBuffer) {
      try {
        const audioResult = await TranscriptionService.transcribeAudioBuffer({
          audioBuffer: voiceAudioBuffer,
          mimeType: voiceMimeType,
        });
        transcribedVoiceText = audioResult?.technicalSummary || audioResult?.literalTranscript;
      } catch (err) {
        console.warn('⚠️ Voice transcription failed in chat follow-up:', err.message);
      }
    }

    const effectiveUserMessage = [
      userMessage?.trim(),
      transcribedVoiceText ? `[Transcribed Voice Note: ${transcribedVoiceText}]` : null,
    ].filter(Boolean).join('\n');

    if (!effectiveUserMessage && (!newImageUrls || newImageUrls.length === 0)) {
      throw ApiError.badRequest('Please provide a message, photo, or voice note.');
    }

    // 2. Real-time Hazard Check on incoming turn (Continuous Safety Shield)
    const currentHazardPayload = {
      diagnosticTitle: session.diagnosticTitle,
      probableCause: session.probableCause,
      severity: session.severity,
      urgency: session.urgency,
      isHazardous: session.isHazardous,
      hazardTypes: session.hazardTypes || [],
      safetyInstructions: session.safetyInstructions || [],
    };

    const hazardCheck = SafetyShieldService.scanAndEnforce(effectiveUserMessage, currentHazardPayload);
    const isHazardEscalated = hazardCheck.isHazardous && (!session.isHazardous || hazardCheck.severity === 'CRITICAL');
    const effectiveUrgency = isHazardEscalated ? 'EMERGENCY' : (hazardCheck.urgency || session.urgency);

    // 3. Multi-Turn LLM Reasoning Engine (OpenAI GPT-4o -> Gemini 2.0 Flash -> Smart Heuristic)
    const systemPrompt = `You are Oga John, the Chief Master Diagnostic Engineer and Senior Technical Consultant on Artifix (Fixmate), Nigeria.
You possess 20+ years of physical engineering expertise across electrical, plumbing, HVAC, generator plants, carpentry, and masonry systems in Lagos and Abuja.

ACTIVE SESSION TELEMETRY:
- Diagnostic Title: "${session.diagnosticTitle || 'Active Inspection'}"
- Known Probable Cause: "${session.probableCause || 'Under Triage'}"
- Active Trade Category: "${session.category?.name || 'General Maintenance'}"
- Current Urgency: "${effectiveUrgency}"
- Severity: "${isHazardEscalated ? hazardCheck.severity : session.severity}"
- Safe for DIY: ${(session.isHazardous || hazardCheck.isHazardous) ? 'NO (Active Hazard Detected - All DIY strictly suspended)' : (session.diyAllowed ? 'YES (Basic containment / low-risk maintenance only)' : 'NO (Hazardous / Specialized Tools Required)')}
- Client Location: "${session.clientAddress || (session.clientLatitude && session.clientLongitude ? `Coordinates [${session.clientLatitude}, ${session.clientLongitude}] in ${session.state || 'Lagos'}` : (clientCoords ? `Coordinates [${clientCoords.latitude}, ${clientCoords.longitude}]` : session.state || 'Lagos, Nigeria'))}"

OPERATIONAL PRINCIPLES:
1. VOICE & TONE: Professional, practical, reassuring, and highly technical. Speak with local Nigerian trade authority (using precise terms like PPR pipes, stopcock valves, MCBs, distribution boards, R410a gas, AVR, NEPA surges, and genuine vs substandard Alaba/Oko-Awo market fittings).
2. DIRECT PROBLEM SOLVING: If the user asks a technical or DIY question (e.g. "Can I use superglue or tape as a temporary fix?"), ALWAYS answer the technical question directly with engineering rationale (e.g. why cyanoacrylate glue crystallizes and bursts under 2-3 bar mains water pressure, or how silicone tape is strictly temporary containment). Provide a step-by-step DIY guide or fitting approach and precautions where applicable.
3. ARTISAN RECOMMENDATION & LOCATION RULES (CRITICAL):
   - Do NOT recommend or match an artisan when not asked to do so.
   - For technical or DIY follow-ups, set "intent" to "CONVERSATIONAL" and "shouldMatchArtisans" to false. Do NOT return "ANSWER_WITH_MATCH" unless the user explicitly asked for an artisan in this turn.
   - LOCATION AWARENESS: If Client Location or coordinates are populated in telemetry above, you ALREADY know their location. Do NOT ask the user where they are located. Use their detected location automatically.
   - EXCEPTION 1 (Emergency): If an active hazard/emergency is detected, set "intent" to "EMERGENCY_ESCALATION" and "shouldMatchArtisans" to true.
   - EXCEPTION 2 (Explicit Request): If the user clearly asks to hire, send, book, or match an artisan, set "intent" to "MATCH_ONLY" and "shouldMatchArtisans" to true.
   - Otherwise, set shouldMatchArtisans to false and do not push artisan recommendations.
4. HAZARD CONTINUITY & DIY SUSPENSION: If an active or reported physical/electrical hazard is present on this session (sparks, hot socket, smoke, burning smell, ceiling pooling water, gas smell), prioritize physical safety containment above all else. Under NO circumstances should you encourage or permit the user to resume DIY maintenance (such as cleaning AC filters, opening panels, or handling cords) while an unresolved electrical or structural hazard is linked to that equipment. If the user asks to go back to cleaning or DIY, explicitly instruct them to halt all DIY until a certified specialist completes an on-site inspection.
5. STRICT OUTPUT CONFORMANCE: You MUST respond strictly in a valid JSON object matching the schema specification below.

OUTPUT JSON SPECIFICATION:
{
  "conversationalReply": "Direct, empathetic, highly technical advice formatted in clean markdown. Break steps into bullets where helpful.",
  "intent": "CONVERSATIONAL" | "ANSWER_WITH_MATCH" | "MATCH_ONLY" | "EMERGENCY_ESCALATION",
  "shouldMatchArtisans": true or false,
  "updatedProbableCause": "Updated 1-sentence technical root cause if user provided new symptoms, else null",
  "updatedSeverity": "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | null,
  "safetyWarning": "Immediate safety instructions if physical hazard detected, else null",
  "diyAdvice": {
    "isFeasible": true or false,
    "instructions": ["Step 1", "Step 2"],
    "requiredTools": ["Teflon tape", "Adjustable wrench"],
    "risks": "What could go wrong"
  }
}`;

    let parsedResponse = null;

    // Build multi-turn conversational message array
    const formattedHistory = (conversationHistory || []).slice(-8).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content || '',
    }));

    const currentTurnContent = newImageUrls.length > 0
      ? [
          { type: 'text', text: effectiveUserMessage || 'Inspect these additional inspection photos.' },
          ...newImageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
        ]
      : effectiveUserMessage;

    const messagesPayload = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: currentTurnContent },
    ];

    if (openaiClient && AiCacheService.isProviderHealthy('openai')) {
      try {
        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-4o',
          messages: messagesPayload,
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });
        parsedResponse = JSON.parse(completion.choices[0].message.content);
        AiCacheService.recordProviderSuccess('openai');
      } catch (err) {
        AiCacheService.recordProviderFailure('openai', err);
        console.warn('⚠️ OpenAI chat follow-up failed, attempting Gemini:', err.message);
      }
    }

    if (!parsedResponse && geminiClient && AiCacheService.isProviderHealthy('gemini')) {
      try {
        const response = await geminiClient.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            { text: systemPrompt },
            { text: `Conversation History:\n${JSON.stringify(formattedHistory)}` },
            { text: `Current User Query:\n${effectiveUserMessage}` },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.25,
          },
        });
        parsedResponse = JSON.parse(response.text);
        AiCacheService.recordProviderSuccess('gemini');
      } catch (err) {
        AiCacheService.recordProviderFailure('gemini', err);
        console.warn('⚠️ Gemini chat follow-up failed:', err.message);
      }
    }

    // Heuristic intelligent fallback if LLMs unreachable
    if (!parsedResponse) {
      const lower = effectiveUserMessage.toLowerCase();
      const explicitHire = lower.includes('hire') || lower.includes('send') || lower.includes('book') || lower.includes('match') || lower.includes('artisan');
      
      parsedResponse = {
        conversationalReply: `Regarding your repair inquiry: makeshift materials like standard packing tape or superglue will rapidly fail under mains pressure or high electrical loads. It is best to isolate the main shut-off valve/breaker and inspect the joint directly. If you need a verified specialist on-site, I can dispatch one directly under Artifix escrow protection.`,
        intent: explicitHire ? 'MATCH_ONLY' : 'CONVERSATIONAL',
        shouldMatchArtisans: explicitHire || isHazardEscalated,
        updatedProbableCause: null,
        safetyWarning: isHazardEscalated ? 'Active Hazard Escalation Flagged. Switch off main isolator switch.' : null,
      };
    }

    // Safety & Containment Priority Override (Newly disclosed or escalated hazard)
    const newTurnHazard = SafetyShieldService.checkUrgentHazard(effectiveUserMessage);
    if (isHazardEscalated || newTurnHazard.isHazardous) {
      const alertHeadline = newTurnHazard.primaryHazard?.alertHeadline || 'CRITICAL SAFETY ALERT';
      if (!parsedResponse.conversationalReply.includes('CRITICAL SAFETY ALERT')) {
        parsedResponse.conversationalReply = `⚠️ **${alertHeadline}**\n\n` + parsedResponse.conversationalReply;
      }
      parsedResponse.intent = 'EMERGENCY_ESCALATION';
      parsedResponse.shouldMatchArtisans = true;
      parsedResponse.safetyWarning = parsedResponse.safetyWarning || `Immediate hazard detected: ${alertHeadline}`;
    }

    // Gate 2: Safe output validation against forbidden unsafe advice
    const outputSafety = SafetyShieldService.validateSafeOutput(parsedResponse.conversationalReply);
    if (!outputSafety.isSafe) {
      parsedResponse.conversationalReply = outputSafety.sanitizedText;
    }

    // If session did not have a category assigned (e.g. started from a greeting), resolve it now if user mentions fault
    const promptTextLower = effectiveUserMessage.toLowerCase();
    if (!session.matchedCategoryId) {
      let detectedSlug = null;
      if (promptTextLower.includes('plumb') || promptTextLower.includes('pipe') || promptTextLower.includes('leak') || promptTextLower.includes('tap') || promptTextLower.includes('sink') || promptTextLower.includes('toilet') || promptTextLower.includes('drain')) {
        detectedSlug = 'plumbing';
      } else if (promptTextLower.includes('electr') || promptTextLower.includes('wire') || promptTextLower.includes('spark') || promptTextLower.includes('breaker') || promptTextLower.includes('socket') || promptTextLower.includes('light') || promptTextLower.includes('power')) {
        detectedSlug = 'electrical';
      } else if (promptTextLower.includes('ac') || promptTextLower.includes('air cond') || promptTextLower.includes('fridge') || promptTextLower.includes('cool')) {
        detectedSlug = 'hvac';
      } else if (promptTextLower.includes('carpent') || promptTextLower.includes('wood') || promptTextLower.includes('door') || promptTextLower.includes('lock') || promptTextLower.includes('hinge')) {
        detectedSlug = 'carpentry';
      } else if (promptTextLower.includes('gen') || promptTextLower.includes('generator')) {
        detectedSlug = 'generator-repair';
      }

      if (detectedSlug) {
        const foundCategory = await prisma.jobCategory.findFirst({
          where: {
            OR: [
              { slug: { contains: detectedSlug, mode: 'insensitive' } },
              { name: { contains: detectedSlug.replace(/-/g, ' '), mode: 'insensitive' } },
            ],
          },
        });
        if (foundCategory) {
          session.matchedCategoryId = foundCategory.id;
          session.category = foundCategory;
          await prisma.aiDiagnosticSession.update({
            where: { id: sessionId },
            data: { matchedCategoryId: foundCategory.id },
          });
        }
      }
    }

    // 4. Resolve Artisan Matches (Strict Intent Gating)
    let matchedArtisans = [];
    let matchingNotice = null;

    const explicitHire =
      promptTextLower.includes('hire') ||
      promptTextLower.includes('send') ||
      promptTextLower.includes('book') ||
      promptTextLower.includes('match') ||
      promptTextLower.includes('artisan') ||
      promptTextLower.includes('recommend an artisan') ||
      promptTextLower.includes('recommend artisan') ||
      promptTextLower.includes('need an artisan') ||
      promptTextLower.includes('need a plumber') ||
      promptTextLower.includes('need an electrician') ||
      promptTextLower.includes('someone to fix') ||
      promptTextLower.includes('get me a') ||
      parsedResponse.intent === 'MATCH_ONLY';

    const isEmergency =
      effectiveUrgency === 'EMERGENCY' ||
      isHazardEscalated ||
      hazardCheck.isHazardous ||
      parsedResponse.intent === 'EMERGENCY_ESCALATION';

    // Strictly enforce: ONLY match artisans if explicit hire request OR active emergency hazard!
    const requiresMatching = (explicitHire || isEmergency) && Boolean(session.matchedCategoryId);

    if (requiresMatching) {
      let resolvedState = session.clientAddress?.toLowerCase().includes('abuja') ? 'FCT' : 'Lagos';
      const promptLower = effectiveUserMessage.toLowerCase();
      if (promptLower.includes('abuja') || promptLower.includes('fct') || promptLower.includes('maitama') || promptLower.includes('wuse')) {
        resolvedState = 'FCT';
      } else if (promptLower.includes('lagos') || promptLower.includes('lekki') || promptLower.includes('ikeja') || promptLower.includes('vi')) {
        resolvedState = 'Lagos';
      }

      const matchResult = await MatchingEngineService.findTopMatches({
        diagnosticSessionId: sessionId,
        categoryId: session.matchedCategoryId,
        categorySlug: session.category?.slug,
        clientLat: clientCoords?.latitude || (session.clientLatitude ? Number(session.clientLatitude) : null),
        clientLng: clientCoords?.longitude || (session.clientLongitude ? Number(session.clientLongitude) : null),
        clientState: resolvedState,
        isEmergency: effectiveUrgency === 'EMERGENCY',
        limit: 3,
      });

      matchedArtisans = matchResult.candidates || [];
      if (matchedArtisans.length === 0) {
        matchingNotice = matchResult.message;
      }
    }

    // 5. Dynamic Session Mutation & Diagnostic Evolution
    if (parsedResponse.updatedProbableCause || isHazardEscalated || parsedResponse.updatedSeverity) {
      await prisma.aiDiagnosticSession.update({
        where: { id: sessionId },
        data: {
          probableCause: parsedResponse.updatedProbableCause || session.probableCause,
          isHazardous: hazardCheck.isHazardous,
          urgency: effectiveUrgency,
          severity: parsedResponse.updatedSeverity || hazardCheck.severity,
          safetyInstructions: hazardCheck.safetyInstructions,
          diyAllowed: hazardCheck.isHazardous ? false : session.diyAllowed,
        },
      });
    }

    return {
      reply: parsedResponse.conversationalReply,
      intent: parsedResponse.intent,
      matchedArtisans,
      matchingNotice,
      diyRecommended: session.diyAllowed && matchedArtisans.length === 0,
      safetyWarning: parsedResponse.safetyWarning || (isHazardEscalated ? 'Immediate safety hazard detected. Containment required.' : null),
      isEmergency: effectiveUrgency === 'EMERGENCY',
      diyAdvice: parsedResponse.diyAdvice || null,
      updatedProbableCause: parsedResponse.updatedProbableCause || null,
    };
  }
}
