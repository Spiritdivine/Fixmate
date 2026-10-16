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
import { DiagnosticTurnResponseSchema } from '../schemas/ai-chat-turn.schema.js';
import { DiagnosticStateService } from './diagnostic-state.service.js';
import { OGA_JOHN_PROMPT_VERSION, buildOgaJohnTurnPrompt } from '../prompts/oga-john.prompt.js';

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
    const guestAccessToken = userId ? null : (clientSessionToken || DiagnosticStateService.createGuestToken());
    const persistedGuestToken = userId ? null : DiagnosticStateService.hashGuestToken(guestAccessToken);

    const activeVisionImages = visionImageUrls.length > 0 ? visionImageUrls : imageUrls;

    if (!textPrompt && (!activeVisionImages || activeVisionImages.length === 0) && !voiceAudioBuffer && !voiceAudioUrl) {
      throw ApiError.badRequest('Please provide a text description, photo, or voice note of the issue.');
    }

    let audioTranscriptionResult = null;
    let effectiveTextPrompt = textPrompt;

    // 2. Transcribe voice note if buffer provided
    if (voiceAudioBuffer && voiceAudioBuffer.length > 0) {
      try {
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
      } catch (err) {
        console.warn('⚠️ Voice transcription failed in diagnostic, continuing with available input:', err.message);
        if (!effectiveTextPrompt) {
          effectiveTextPrompt = 'Voice note attached: please inspect and diagnose the fault.';
        }
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
          clientSessionToken: persistedGuestToken,
          diagnosticStatus: 'INFORMATION_GATHERING',
          diagnosticState: DiagnosticStateService.initialState(),
          promptVersion: OGA_JOHN_PROMPT_VERSION,
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
      await prisma.aiDiagnosticTurn.createMany({
        data: [
          { diagnosticSessionId: session.id, role: 'user', content: textPrompt || 'Hello' },
          { diagnosticSessionId: session.id, role: 'assistant', content: conversationalReply },
        ],
      });

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
        guestAccessToken,
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
    const isInfoGathering = Boolean(
      parsedResult.clarificationNeeded ||
      parsedResult.status === 'INFORMATION_GATHERING' ||
      Boolean(parsedResult.clarificationQuestion) ||
      (!parsedResult.probableCause || parsedResult.probableCause.toLowerCase().includes('triage') || parsedResult.probableCause.toLowerCase().includes('inspection'))
    );
    const bomAsked = this._isBomRequested(effectiveTextPrompt);

    if (isInfoGathering && !bomAsked) {
      parsedResult.estimatedBOM = [];
      parsedResult.estimatedLaborMin = null;
      parsedResult.estimatedLaborMax = null;
    } else if (parsedResult.estimatedBOM && parsedResult.estimatedBOM.length > 0) {
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

    // Dynamic clarification questions directly from AI Diagnostic Engine
    const dynamicClarificationQuestion = parsedResult.clarificationQuestion || null;
    const dynamicClarificationOptions = Array.isArray(parsedResult.clarificationOptions)
      ? parsedResult.clarificationOptions
      : [];

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
    const resolvedStatus = isInfoGathering ? 'INFORMATION_GATHERING' : 'ASSESSMENT_READY';
    const session = await prisma.aiDiagnosticSession.create({
      data: {
        userId,
        clientSessionToken: persistedGuestToken,
        diagnosticStatus: resolvedStatus,
        diagnosticState: {
          ...DiagnosticStateService.initialState(),
          status: resolvedStatus,
          missingInformation: dynamicClarificationQuestion ? [dynamicClarificationQuestion] : [],
        },
        promptVersion: OGA_JOHN_PROMPT_VERSION,
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
        clarificationQuestion: dynamicClarificationQuestion,
        clarificationOptions: dynamicClarificationOptions,
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

    await prisma.aiDiagnosticTurn.createMany({
      data: [
        { diagnosticSessionId: session.id, role: 'user', content: effectiveTextPrompt || 'Inspection media attached' },
        { diagnosticSessionId: session.id, role: 'assistant', content: parsedResult.conversationalReply, structuredDecision: parsedResult },
      ],
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
    const latToCheck = clientCoords?.latitude || null;
    const lngToCheck = clientCoords?.longitude || null;
    if (latToCheck && lngToCheck) {
      if (latToCheck >= 8.5 && latToCheck <= 9.5 && lngToCheck >= 6.8 && lngToCheck <= 7.8) {
        resolvedState = 'FCT';
      } else if (latToCheck >= 6.2 && latToCheck <= 6.8 && lngToCheck >= 3.0 && lngToCheck <= 4.0) {
        resolvedState = 'Lagos';
      }
    }
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

      const tradeTitle = category?.name || 'Specialist';
      matchedArtisans = (matchResult.candidates || []).map((c) =>
        MatchingEngineService.formatCandidateDossier(c, tradeTitle)
      );
      if (matchedArtisans.length === 0) {
        matchingNotice = matchResult.message || `No active verified specialists in this trade currently available within ${resolvedState}.`;
      }
    }

    let conversationalReply =
      parsedResult.conversationalReply || parsedResult.probableCause || 'Diagnostic analysis completed.';

    // Gated professional check: if not safe for DIY and LLM hasn't already guided on professional care, add concise advice
    const requiresProfessionalCare = !parsedResult.diyAllowed || parsedResult.isHazardous;
    const alreadyOffersReferral =
      conversationalReply.toLowerCase().includes('specialist') ||
      conversationalReply.toLowerCase().includes('verified') ||
      conversationalReply.toLowerCase().includes('professional') ||
      conversationalReply.toLowerCase().includes('technician') ||
      conversationalReply.toLowerCase().includes('connect you');

    if (requiresProfessionalCare && !alreadyOffersReferral && !clientRequestedArtisan && !shouldMatchArtisans) {
      const tradeLabel = category?.name || 'specialist';
      conversationalReply += `\n\nThis fault requires specialized tools and trade precautions. Would you like me to connect you with a verified ${tradeLabel} nearby?`;
    }

    return {
      session,
      diagnosis: parsedResult,
      conversationalReply,
      category,
      diyRecommended: parsedResult.diyAllowed && !clientRequestedArtisan,
      matchedArtisans,
      preliminaryArtisans: matchedArtisans,
      guestAccessToken,
      matchingNotice,
    };
  }

  /**
   * Master Artisan Conversational Diagnostic via OpenAI GPT-4o with FULL structured output
   */
  /**
   * Master Artisan Conversational Diagnostic via OpenAI GPT-4o with FULL structured output
   */
  static async _callOpenAI({ textPrompt, imageUrls = [] }) {
    if (!openaiClient) throw new Error('OpenAI client not initialized');

    const systemPrompt = `You are Oga John, the Chief AI Diagnostic Engineer and Senior Technical Consultant for Artifix (Fixmate), Nigeria.
You apply the diagnostic reasoning, practical knowledge, and communication standards of an experienced multidisciplinary maintenance consultant across electrical, plumbing, HVAC, generator plants, carpentry/furniture, masonry, and roofing.
You are an AI assistant, not a physically present tradesperson. Never falsely claim personal physical work history, manual inspections, or guaranteed physical outcomes.

MISSION & DIAGNOSTIC REASONING PROTOCOL (Acknowledge -> Reassure -> Protect -> Diagnose -> Request Evidence -> Recommend Next Step):
1. ACKNOWLEDGE EMOTION & ISSUE:
   - Connect with the homeowner's emotion, frustration, or concern with natural empathy.
   - If they speak Nigerian English or Pidgin ("my couch leg just dey, break o", "wetin i fit do about am?"), mirror their tone naturally without mockery or excessive slang.
2. SCREEN SAFETY / PROTECT FIRST:
   - If there is any physical hazard (sparks, smoke, burning odor, gas smell, flooding, ceiling sag, unstable/collapsing furniture), issue an immediate clear precaution FIRST (e.g. "Abeg, no sit on that couch for now so e no go collapse further" or "Isolate the main distribution board breaker immediately").
3. ESTABLISH PLAUSIBLE CAUSES:
   - Do NOT guess blindly or force an early conclusion. Formulate 2-3 plausible hypotheses.
4. ASK THE SINGLE NEXT BEST QUESTION:
   - Ask ONE targeted, high-value question that narrows down the failure mechanism (e.g. "Is the leg wooden or metal, and did it snap in two or did the screws pull out from the frame?").
5. REQUEST VISUAL EVIDENCE:
   - If a photo helps distinguish the damage, invite the user to upload one ("If you fit send a clear picture of where the leg connects to the frame..."). Tell them NOT to buy materials yet.
6. PROFESSIONAL VS DIY GATING (CRITICAL):
   - IF THIS PROBLEM REQUIRES PROFESSIONAL SERVICES (electrical wiring/breakers, gas leaks, water main bursts, HVAC refrigerant, generator engine faults, structural damage):
     * DO NOT give the user a DIY step-by-step repair guide!
     * Set "diyAllowed": false, and explain in "diyRiskReason" why specialized trade tools/skills are required.
     * In "conversationalReply", give immediate containment precautions, explain why professional care is needed, and warmly ask: "Would you like me to connect you with a verified, vetted specialist nearby to handle this safely for you?"
   - IF THIS PROBLEM IS GENUINELY SAFE FOR DIY (e.g. tightening a loose hinge, replacing a faucet tap washer, unblocking a surface sink P-trap, cleaning AC dust filter mesh):
     * Set "diyAllowed": true.
     * Make "diyGuide" practical and detailed with clear household tools, steps, and explicit stop conditions.
7. NO SELF-REINTRODUCTION:
   - NEVER introduce yourself as "Hello, I am Oga John" in this response. The chat UI already displays your identity. Get straight to the problem.
8. RESTRICTED BILL OF MATERIALS & PRICING:
   - Restrict giving Bill of Materials (BOM) or parts cost breakdowns to when EXPLICITLY asked by the user ("what materials do I need?", "cost of parts", "BOM") or when reaching a confirmed ASSESSMENT_READY status where repair materials were specifically requested.
   - If the diagnosis is in early triage / INFORMATION_GATHERING, "estimatedBOM" MUST be [] (empty array), and "estimatedLaborMin" and "estimatedLaborMax" MUST be null.
   - NEVER invent or hallucinate fake parts or pricing when the diagnostic facts are incomplete.
9. CONCISE & NATURAL TONE:
   - Keep responses crisp, direct, and conversational. NEVER be verbose, rambling, or overly wordy.
   - Plain text without unsolicited tables.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "conversationalReply": "Crisp, concise, empathetic conversational reply in clean markdown. Plain text without verbosity or self-reintroduction.",
  "diagnosticTitle": "Short 3-5 word technical title",
  "probableCause": "Precise 1-sentence technical root cause summary",
  "categorySlug": "One of: electrical-and-wiring, plumbing-and-pipefitting, hvac-and-ac-repair, generator-and-power-plants, carpentry-and-woodwork, masonry-and-tiling, painting-and-pop, appliance-repair, or null",
  "severity": "LOW, MODERATE, HIGH, or CRITICAL",
  "urgency": "ROUTINE, SCHEDULED, URGENT, or EMERGENCY",
  "isHazardous": true or false,
  "hazardTypes": ["NONE", "ELECTRICAL_SHOCK", "FIRE_ARC", "GAS_EXPLOSION", "ACTIVE_FLOODING"],
  "safetyInstructions": [
    { "stepNumber": 1, "action": "Clear containment instruction", "urgency": "IMMEDIATE_ACTION", "targetComponent": "Breaker/Valve/Frame" }
  ],
  "diyAllowed": true or false,
  "diyRiskReason": "Reason why DIY is unsafe, or null",
  "diyGuide": "Detailed DIY steps if safe, or null if professional required",
  "requiresArtisan": true or false,
  "clarificationNeeded": true or false,
  "clarificationQuestion": "Targeted question if symptoms unclear, or null",
  "clarificationOptions": ["Specific realistic answer A tailored to the question", "Specific realistic answer B"],
  "estimatedBOM": [],
  "estimatedLaborMin": null,
  "estimatedLaborMax": null,
  "currency": "NGN",
  "recommendedSkills": ["skill-slug-1"],
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

    const systemPrompt = `You are Oga John, the Chief AI Diagnostic Engineer and Senior Technical Consultant for Fixmate (Artifix), Nigeria.
You apply the diagnostic reasoning, practical knowledge, and communication standards of an experienced multidisciplinary maintenance consultant across electrical, plumbing, HVAC, generator plants, carpentry/furniture, masonry, and roofing.
You are an AI assistant, not a physically present tradesperson. Never falsely claim personal physical work history, manual inspections, or guaranteed physical outcomes.

MISSION & DIAGNOSTIC REASONING PROTOCOL (Acknowledge -> Reassure -> Protect -> Diagnose -> Request Evidence -> Recommend Next Step):
1. ACKNOWLEDGE EMOTION & ISSUE:
   - Connect with the homeowner's emotion, frustration, or concern with natural empathy.
   - If they speak Nigerian English or Pidgin ("my couch leg just dey, break o", "wetin i fit do about am?"), mirror their tone naturally without mockery or excessive slang.
2. SCREEN SAFETY / PROTECT FIRST:
   - If there is any physical hazard (sparks, smoke, burning odor, gas smell, flooding, ceiling sag, unstable/collapsing furniture), issue an immediate clear precaution FIRST (e.g. "Abeg, no sit on that couch for now so e no go collapse further" or "Isolate the main distribution board breaker immediately").
3. ESTABLISH PLAUSIBLE CAUSES:
   - Do NOT guess blindly or force an early conclusion. Formulate 2-3 plausible hypotheses.
4. ASK THE SINGLE NEXT BEST QUESTION:
   - Ask ONE targeted, high-value question that narrows down the failure mechanism.
5. REQUEST VISUAL EVIDENCE:
   - If a photo helps distinguish the damage, invite the user to upload one ("If you fit send a clear picture of where the leg connects to the frame..."). Tell them NOT to buy materials yet.
6. PROFESSIONAL VS DIY GATING (CRITICAL):
   - IF THIS PROBLEM REQUIRES PROFESSIONAL SERVICES (electrical wiring/breakers, gas leaks, water main bursts, HVAC refrigerant, generator engine faults, structural damage):
     * DO NOT give the user a DIY step-by-step repair guide!
     * Set "diyAllowed": false, and explain in "diyRiskReason" why specialized trade tools/skills are required.
     * In "conversationalReply", give immediate containment precautions, explain why professional care is needed, and warmly ask: "Would you like me to connect you with a verified, vetted specialist nearby to handle this safely for you?"
   - IF THIS PROBLEM IS GENUINELY SAFE FOR DIY (e.g. tightening a loose hinge, replacing a faucet tap washer, unblocking a surface sink P-trap, cleaning AC dust filter mesh):
     * Set "diyAllowed": true.
     * Make "diyGuide" practical and detailed with clear household tools, steps, and explicit stop conditions.
7. NO SELF-REINTRODUCTION:
   - NEVER introduce yourself as "Hello, I am Oga John" in this response. The chat UI already displays your identity. Get straight to the problem.
8. RESTRICTED BILL OF MATERIALS & PRICING:
   - Restrict giving Bill of Materials (BOM) or parts cost breakdowns to when EXPLICITLY asked by the user ("what materials do I need?", "cost of parts", "BOM") or when reaching a confirmed ASSESSMENT_READY status where repair materials were specifically requested.
   - If the diagnosis is in early triage / INFORMATION_GATHERING, "estimatedBOM" MUST be [] (empty array), and "estimatedLaborMin" and "estimatedLaborMax" MUST be null.
   - NEVER invent or hallucinate fake parts or pricing when the diagnostic facts are incomplete.
9. CONCISE & NATURAL TONE:
   - Keep responses crisp, direct, and conversational. NEVER be verbose, rambling, or overly wordy.
   - Plain text without unsolicited tables.

Return strictly a valid JSON object matching this specification:
{
  "conversationalReply": "Warm, practical master-artisan advice in markdown. Plain text without verbosity or self-reintroduction.",
  "diagnosticTitle": "Short 3-5 word technical title",
  "probableCause": "Precise root cause",
  "categorySlug": "One of: electrical-and-wiring, plumbing-and-pipefitting, hvac-and-ac-repair, generator-and-power-plants, carpentry-and-woodwork, masonry-and-tiling, painting-and-pop, appliance-repair, or null",
  "severity": "LOW, MODERATE, HIGH, or CRITICAL",
  "urgency": "ROUTINE, SCHEDULED, URGENT, or EMERGENCY",
  "isHazardous": true or false,
  "hazardTypes": ["NONE", "ELECTRICAL_SHOCK", "FIRE_ARC", "GAS_EXPLOSION", "ACTIVE_FLOODING"],
  "safetyInstructions": [
    { "stepNumber": 1, "action": "Actionable step", "urgency": "IMMEDIATE_ACTION", "targetComponent": "Breaker/Valve/Frame" }
  ],
  "diyAllowed": true or false,
  "diyRiskReason": "Why DIY is unsafe, or null",
  "diyGuide": "Safe steps if allowed, or null",
  "requiresArtisan": true or false,
  "clarificationNeeded": true or false,
  "clarificationQuestion": "Question or null",
  "clarificationOptions": ["Specific realistic answer A tailored to the question", "Specific realistic answer B"],
  "estimatedBOM": [],
  "estimatedLaborMin": null,
  "estimatedLaborMax": null,
  "currency": "NGN",
  "recommendedSkills": ["skill-slug-1"],
  "visualObservations": "Observations or null"
}`;

    const contents = [{ text: systemPrompt }];
    if (textPrompt) {
      contents.push({ text: `User Description: ${textPrompt}` });
    }
    for (const url of imageUrls) {
      if (typeof url === 'string' && url.startsWith('data:image/')) {
        const match = url.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        if (match) {
          contents.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
          continue;
        }
      }
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

    // Carpentry & Furniture fault
    if (
      lower.includes('couch') ||
      lower.includes('sofa') ||
      lower.includes('chair') ||
      lower.includes('table') ||
      lower.includes('desk') ||
      lower.includes('wood') ||
      lower.includes('leg') ||
      lower.includes('door') ||
      lower.includes('hinge') ||
      lower.includes('cupboard') ||
      lower.includes('cabinet') ||
      lower.includes('wardrobe') ||
      lower.includes('drawer') ||
      lower.includes('bed')
    ) {
      return {
        conversationalReply: 'Sorry about that! Make we first see whether na the leg or fitting itself break or the joint wey hold am don give way. For now, abeg no sit or put heavy load on am so e no go collapse further. Is the piece wooden or metal, and did it snap or detach from the frame?',
        diagnosticTitle: 'Furniture Structural Support Defect',
        probableCause: 'Loose fastener, fractured mounting joint, or split timber support requiring physical inspection.',
        severity: 'LOW',
        urgency: 'SCHEDULED',
        isHazardous: false,
        hazardTypes: ['NONE'],
        safetyInstructions: [
          { stepNumber: 1, action: 'Do not sit on or place load on the affected furniture until stabilized.', urgency: 'PRECAUTIONARY', targetComponent: 'Furniture Frame' },
        ],
        diyAllowed: true,
        diyRiskReason: null,
        diyGuide: 'Inspect the underside to confirm if screws are loose or if the wood has split.',
        requiresArtisan: false,
        clarificationQuestion: 'Did the leg or joint snap in two, or did it completely detach from the frame?',
        clarificationOptions: ['Snapped in two', 'Detached from frame', 'Just loose and wobbling'],
        estimatedBOM: [],
        estimatedLaborMin: null,
        estimatedLaborMax: null,
        currency: 'NGN',
        categorySlug: 'carpentry-and-woodwork',
        recommendedSkills: ['furniture-repair', 'carpentry', 'woodwork-joinery'],
        visualObservations: imageUrls.length > 0 ? 'Furniture mounting reference logged.' : null,
        symptoms: ['Furniture support instability or fractured joint reported'],
        possibleCauses: [
          {
            label: 'Loose fastener or stripped screw hole',
            supportingEvidence: ['User symptom report'],
            missingEvidence: ['Visual inspection of joint attachment'],
            likelihoodBand: 'moderate',
          },
          {
            label: 'Split or snapped timber support',
            supportingEvidence: ['User symptom report'],
            missingEvidence: ['Clear photograph of break point'],
            likelihoodBand: 'moderate',
          },
        ],
        guidanceSteps: [
          {
            stepNumber: 1,
            instruction: 'Carefully tip the furniture to inspect whether the bracket is loose or the wood is broken.',
            risk: 'low',
            stopConditions: ['Do not apply heavy force if timber is actively splintering.'],
          },
        ],
        nextAction: 'answer_clarification',
      };
    }

    // Masonry, Tiling, Walls, and POP Ceilings
    if (
      lower.includes('wall') ||
      lower.includes('crack') ||
      lower.includes('tile') ||
      lower.includes('damp') ||
      lower.includes('pop') ||
      lower.includes('ceiling') ||
      lower.includes('plaster') ||
      lower.includes('cement') ||
      lower.includes('masonry')
    ) {
      const isSevereStructural = lower.includes('collapse') || lower.includes('sag') || (lower.includes('crack') && (lower.includes('deep') || lower.includes('wide') || lower.includes('through')));
      return {
        conversationalReply: isSevereStructural
          ? 'Deep wall cracks or sagging ceilings can pose a structural risk. Abeg stay clear of the area below and avoid placing weight above it. Is the crack vertical, horizontal, or diagonal across the blockwork?'
          : 'I see. Wall cracks, dampness, and loose tiles usually point to rising moisture, building settlement, or bonding mortar fatigue. Make we first confirm where the issue is coming from.',
        diagnosticTitle: isSevereStructural ? 'Structural Masonry / Substrate Cracking' : 'Masonry & Tiling Surface Defect',
        probableCause: isSevereStructural
          ? 'Differential foundation settlement, lintel beam deflection, or structural blockwork fatigue.'
          : 'Capillary damp ingress, plaster bonding failure, or thermal expansion in wall tiles.',
        severity: isSevereStructural ? 'CRITICAL' : 'MODERATE',
        urgency: isSevereStructural ? 'URGENT' : 'ROUTINE',
        isHazardous: isSevereStructural,
        hazardTypes: isSevereStructural ? ['STRUCTURAL_COLLAPSE'] : ['NONE'],
        safetyInstructions: [
          { stepNumber: 1, action: isSevereStructural ? 'Keep persons away from the immediate area under sagging plaster or unstable walls.' : 'Do not force loose tiles or peel damp plaster until inspected.', urgency: isSevereStructural ? 'IMMEDIATE_ACTION' : 'PRECAUTIONARY', targetComponent: 'Wall / Ceiling' },
        ],
        diyAllowed: !isSevereStructural,
        diyRiskReason: isSevereStructural ? 'High risk of blockwork collapse or structural failure. Requires certified structural mason.' : null,
        diyGuide: !isSevereStructural ? 'Light surface hair cracks can be scraped, sealed with acrylic filler, and repainted once dry.' : null,
        requiresArtisan: isSevereStructural,
        clarificationNeeded: true,
        clarificationQuestion: 'What does the wall or ceiling defect look like?',
        clarificationOptions: ['Hairline surface crack', 'Wide/deep crack through blocks', 'Damp/peeling paint with mold', 'Hollow or lifting floor tiles'],
        estimatedBOM: [],
        estimatedLaborMin: null,
        estimatedLaborMax: null,
        currency: 'NGN',
        categorySlug: 'masonry-and-tiling',
        recommendedSkills: ['masonry', 'tiling-and-paving', 'pop-ceiling-repair'],
        visualObservations: imageUrls.length > 0 ? 'Surface plaster and masonry profile logged.' : null,
        symptoms: ['Wall cracking, tile debonding, or damp patch reported'],
        possibleCauses: [
          {
            label: 'Moisture ingress or foundation settlement',
            supportingEvidence: ['Symptom report'],
            missingEvidence: ['Visual inspection of crack width and moisture reading'],
            likelihoodBand: 'moderate',
          },
        ],
        guidanceSteps: [
          {
            stepNumber: 1,
            instruction: 'Inspect whether the crack extends through the wall or is only in the paint/plaster layer.',
            risk: 'low',
            stopConditions: ['Stop immediately if brickwork shifts or ceiling begins sagging.'],
          },
        ],
        nextAction: 'answer_clarification',
      };
    }

    // Roofing, Leaks, and Gutters
    if (
      lower.includes('roof') ||
      lower.includes('gutter') ||
      lower.includes('ceiling leak') ||
      lower.includes('zinc') ||
      lower.includes('asbestos') ||
      lower.includes('flashing')
    ) {
      return {
        conversationalReply: 'Roof leaks can cause serious damage to ceilings and electrical fittings if rain penetrates. For your safety, abeg no climb onto wet roof sheets. Does the leak happen only during heavy rain, or does water drip long after the rain stops?',
        diagnosticTitle: 'Roof Sheet & Drainage Penetration Defect',
        probableCause: 'Dislodged roofing nail/washer, cracked valley flashing, or blocked gutter overflow.',
        severity: 'MODERATE',
        urgency: 'URGENT',
        isHazardous: false,
        hazardTypes: ['NONE'],
        safetyInstructions: [
          { stepNumber: 1, action: 'Do not climb onto the roof during or immediately after rain.', urgency: 'IMMEDIATE_ACTION', targetComponent: 'Roofing Structure' },
          { stepNumber: 2, action: 'Place a bucket or container under the ceiling drip and keep electrical outlets dry.', urgency: 'IMMEDIATE_ACTION', targetComponent: 'Ceiling / Floor' },
        ],
        diyAllowed: false,
        diyRiskReason: 'Roof climbing and working at heights poses severe fall and injury risks. Requires vetted professional roofer.',
        diyGuide: null,
        requiresArtisan: true,
        clarificationNeeded: true,
        clarificationQuestion: 'When does the water penetration occur?',
        clarificationOptions: ['Only during heavy rain/wind', 'Drips continuously even after rain', 'Water stains on ceiling without visible active drip'],
        estimatedBOM: [],
        estimatedLaborMin: null,
        estimatedLaborMax: null,
        currency: 'NGN',
        categorySlug: 'roofing-and-gutters',
        recommendedSkills: ['roofing-repair', 'leak-detection', 'gutter-maintenance'],
        visualObservations: imageUrls.length > 0 ? 'Roofing drainage reference logged.' : null,
        symptoms: ['Ceiling water staining or active roof leak reported'],
        possibleCauses: [
          {
            label: 'Perforated roofing sheet or failed rubber washer',
            supportingEvidence: ['User symptom report'],
            missingEvidence: ['Physical roof truss and valley inspection'],
            likelihoodBand: 'moderate',
          },
        ],
        guidanceSteps: [
          {
            stepNumber: 1,
            instruction: 'Place a catchment bucket beneath active drips and move furniture away from the ceiling stain.',
            risk: 'low',
            stopConditions: ['Do not touch wet light fixtures or switches beneath the ceiling leak.'],
          },
        ],
        nextAction: 'answer_clarification',
      };
    }

    // Default general repair - genuinely generic without fabricated BOM or wrong trade
    return {
      conversationalReply: 'I have logged this symptom. Make we first check the affected component to understand what is failing before taking any action.',
      diagnosticTitle: 'General Property Maintenance Assessment',
      probableCause: 'Physical wear, loose fitting, or component fatigue under triage.',
      severity: 'LOW',
      urgency: 'ROUTINE',
      isHazardous: false,
      hazardTypes: ['NONE'],
      safetyInstructions: [
        { stepNumber: 1, action: 'Keep the affected area clear and safe from interference.', urgency: 'PRECAUTIONARY', targetComponent: 'Affected Area' },
      ],
      diyAllowed: true,
      diyRiskReason: null,
      diyGuide: 'Perform a careful visual check without forcing or opening sealed assemblies.',
      requiresArtisan: false,
      clarificationQuestion: 'What specific part appears damaged, loose, or behaving unusually?',
      clarificationOptions: ['Loose fitting', 'Broken or cracked component', 'Unusual noise or leak'],
      estimatedBOM: [],
      estimatedLaborMin: null,
      estimatedLaborMax: null,
      currency: 'NGN',
      categorySlug: null,
      recommendedSkills: ['general-maintenance'],
      visualObservations: imageUrls.length > 0 ? 'Equipment visual reference logged.' : null,
      symptoms: [textPrompt ? `Observed symptom: ${textPrompt.slice(0, 120)}` : 'Routine wear and tear'],
      possibleCauses: [
        {
          label: 'Component wear or loose joint',
          supportingEvidence: ['User symptom report'],
          missingEvidence: ['Physical inspection and symptom clarification'],
          likelihoodBand: 'moderate',
        },
      ],
      guidanceSteps: [
        {
          stepNumber: 1,
          instruction: 'Visually check external connections without touching energized or pressurized components.',
          risk: 'low',
          stopConditions: ['Stop immediately if burning odor, electrical buzzing, or water spray occurs.'],
        },
      ],
      nextAction: 'answer_clarification',
    };
  }

  /**
   * Helper to detect if user explicitly asked for BOM/materials/parts
   */
  static _isBomRequested(text = '') {
    if (!text) return false;
    const pattern = /(bill\s*of\s*materials?|\bbom\b|\bparts?\b|\bmaterials?\b|cost\s*(of\s*)?(parts|materials)|price\s*(of\s*)?(parts|materials)|what\s*(do\s*i\s*)?(need\s*to\s*)?buy|pricing\s*breakdown|cost\s*breakdown|list\s*(of\s*)?(parts|materials))/i;
    return pattern.test(text);
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
  static async getSessionById(sessionId, access = {}) {
    await DiagnosticStateService.assertAccess({ sessionId, ...access });
    return prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: {
        category: true, mediaFiles: true, turns: { orderBy: { createdAt: 'asc' } },
        recommendations: { include: { artisan: { include: { user: true } } } },
      },
    });
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
    clientCoords = null,
    newImageUrls = [],
    voiceAudioBuffer = null,
    voiceMimeType = 'audio/webm',
    userId = null,
    guestToken = null,
  }) {
    PromptGuardrailService.validateUserQuery(userMessage);

    if (!sessionId) {
      throw ApiError.badRequest('Session ID is required for chat messaging.');
    }

    let session = await DiagnosticStateService.assertAccess({ sessionId, userId, guestToken });

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

    await prisma.aiDiagnosticTurn.create({
      data: { diagnosticSessionId: sessionId, role: 'user', content: effectiveUserMessage || 'Additional inspection media attached' },
    });
    const persistedTurns = await prisma.aiDiagnosticTurn.findMany({
      where: { diagnosticSessionId: sessionId }, orderBy: { createdAt: 'asc' }, take: 16,
    });
    const conversationHistory = persistedTurns.slice(0, -1).map((turn) => ({ role: turn.role, content: turn.content }));

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

    const systemPrompt = buildOgaJohnTurnPrompt({
      session,
      diagnosticState: session.diagnosticState || DiagnosticStateService.initialState(),
      urgency: effectiveUrgency,
    });

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
      const explicitHire =
        lower.includes('hire') ||
        lower.includes('send') ||
        lower.includes('book') ||
        lower.includes('match') ||
        lower.includes('artisan') ||
        lower.includes('yes') ||
        lower.includes('sure') ||
        lower.includes('connect me');
      
      const isProfessionalTask = !session.diyAllowed || session.isHazardous;

      let fallbackReply = '';
      if (explicitHire) {
        fallbackReply = `Understood! I am matching you with verified, vetted specialists nearby who can inspect and resolve this properly for you.`;
      } else if (isProfessionalTask) {
        fallbackReply = `This kind of fault requires specialized trade instruments to test and resolve safely. For your safety, please keep the area isolated (shut off the main breaker or stopcock valve). Would you like me to connect you with a verified, vetted professional nearby to handle this for you?`;
      } else {
        fallbackReply = `For this issue, a careful check of the fitting and applying proper sealant tape or tightening the loose fastener should resolve it safely. Make sure to isolate the local shut-off valve before starting. If at any point you notice water pressure persisting or threads stripping, stop and let a specialist take over.`;
      }

      parsedResponse = {
        conversationalReply: fallbackReply,
        intent: explicitHire ? 'MATCH_ONLY' : 'CONVERSATIONAL',
        shouldMatchArtisans: explicitHire || isHazardEscalated,
        updatedProbableCause: null,
        safetyWarning: isHazardEscalated ? 'Active Hazard Escalation Flagged. Switch off main isolator switch.' : null,
      };
    }

    const validatedTurn = DiagnosticTurnResponseSchema.safeParse(parsedResponse);
    if (validatedTurn.success) {
      parsedResponse = validatedTurn.data;
    } else {
      parsedResponse = {
        conversationalReply: 'I need one more detail before I can give safe advice. What exactly is loose, broken, leaking, or making the unusual sound?',
        status: 'INFORMATION_GATHERING', confirmedFacts: [], hypotheses: [],
        missingInformation: ['A clearer description of the affected part'],
        nextQuestion: 'What exactly is damaged or behaving unusually?', imageRequest: { needed: false, guidance: null },
        intent: 'CONVERSATIONAL', shouldMatchArtisans: false, updatedProbableCause: null, updatedSeverity: null,
        safetyWarning: null, diyAdvice: { isFeasible: false, instructions: [], requiredTools: [], risks: null },
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

    // 3.5 Topic Override & Dynamic Trade Pivot: Allow user to switch focus at any time
    const promptTextLower = effectiveUserMessage.toLowerCase();
    let detectedSlug = null;
    if (promptTextLower.includes('carpent') || promptTextLower.includes('wood') || promptTextLower.includes('couch') || promptTextLower.includes('furniture') || promptTextLower.includes('table') || promptTextLower.includes('chair') || promptTextLower.includes('cabinet') || promptTextLower.includes('hinge') || promptTextLower.includes('door')) {
      detectedSlug = 'carpentry';
    } else if (promptTextLower.includes('plumb') || promptTextLower.includes('pipe') || promptTextLower.includes('leak') || promptTextLower.includes('tap') || promptTextLower.includes('sink') || promptTextLower.includes('toilet') || promptTextLower.includes('drain')) {
      detectedSlug = 'plumbing';
    } else if (promptTextLower.includes('electr') || promptTextLower.includes('wire') || promptTextLower.includes('spark') || promptTextLower.includes('breaker') || promptTextLower.includes('socket') || promptTextLower.includes('light') || promptTextLower.includes('power')) {
      detectedSlug = 'electrical';
    } else if (promptTextLower.includes('ac') || promptTextLower.includes('air cond') || promptTextLower.includes('hvac') || promptTextLower.includes('chiller') || promptTextLower.includes('cooling') || promptTextLower.includes('fridge')) {
      detectedSlug = 'hvac';
    } else if (promptTextLower.includes('gen') || promptTextLower.includes('generator')) {
      detectedSlug = 'generator-repair';
    } else if (promptTextLower.includes('paint') || promptTextLower.includes('pop ceiling')) {
      detectedSlug = 'painting';
    } else if (promptTextLower.includes('mason') || promptTextLower.includes('tile') || promptTextLower.includes('tiling') || promptTextLower.includes('brick') || promptTextLower.includes('crack')) {
      detectedSlug = 'masonry';
    } else if (parsedResponse.categorySlug) {
      detectedSlug = parsedResponse.categorySlug;
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
      if (foundCategory && (!session.matchedCategoryId || session.matchedCategoryId !== foundCategory.id)) {
        session.matchedCategoryId = foundCategory.id;
        session.category = foundCategory;
        await prisma.aiDiagnosticSession.update({
          where: { id: sessionId },
          data: {
            matchedCategoryId: foundCategory.id,
            diagnosticTitle: parsedResponse.updatedProbableCause || `${foundCategory.name} Issue`,
          },
        });
      }
    }

    // 4. Resolve Artisan Matches (Strict Intent Gating + Affirmative Response Detection)
    let matchedArtisans = [];
    let matchingNotice = null;

    // Check if the previous assistant message offered a professional referral
    const lastAssistantMsg = (conversationHistory || [])
      .filter((m) => m.role === 'assistant')
      .slice(-1)[0]?.content?.toLowerCase() || '';

    const assistantOfferedProfessional =
      lastAssistantMsg.includes('connect you with a') ||
      lastAssistantMsg.includes('verified') ||
      lastAssistantMsg.includes('specialist') ||
      lastAssistantMsg.includes('professional') ||
      lastAssistantMsg.includes('artisan') ||
      !session.diyAllowed;

    const affirmativePattern = /\b(yes|yes please|sure|okay|ok|go ahead|connect me|please do|find one|match me|get me someone|i need one|send one|book one|yes i do)\b/i;
    const isAffirmativeResponse = assistantOfferedProfessional && affirmativePattern.test(promptTextLower);

    const professionalKeywords = /\b(hire|match|artisan|professional|specialist|handyman|plumber|electrician|carpenter|mechanic|technician|someone to fix|connect me|send someone|who is around|who dey around|find someone|find one|book one|bring out|waiting|recommend someone|find me a|closest professional|closest carpenter|closest plumber|closest electrician|find me a carpenter|get me a carpenter)\b/i;
    const explicitHire =
      professionalKeywords.test(promptTextLower) ||
      isAffirmativeResponse ||
      parsedResponse.intent === 'MATCH_ONLY' ||
      parsedResponse.intent === 'MATCH_REQUESTED' ||
      parsedResponse.shouldMatchArtisans === true;

    // Fast-path: When user explicitly requests an artisan, bypass diagnostic badgering!
    if (explicitHire) {
      parsedResponse.intent = 'MATCH_REQUESTED';
      parsedResponse.shouldMatchArtisans = true;
      parsedResponse.clarificationOptions = [];
      parsedResponse.nextQuestion = null;

      // Clean out diagnostic badgering phrases from conversationalReply
      const replyLower = (parsedResponse.conversationalReply || '').toLowerCase();
      if (
        replyLower.includes('i need one more detail before i can give safe advice') ||
        replyLower.includes('would you like me to connect you with a verified') ||
        replyLower.includes('can you confirm if') ||
        replyLower.includes("let's first confirm")
      ) {
        const tradeTitle = session.category?.name || 'Specialist';
        parsedResponse.conversationalReply = `Understood! Connecting you with verified ${tradeTitle} specialists nearby who can inspect and fix this for you.`;
      }
    }

    const isEmergency =
      effectiveUrgency === 'EMERGENCY' ||
      isHazardEscalated ||
      hazardCheck.isHazardous ||
      parsedResponse.intent === 'EMERGENCY_ESCALATION';

    // Match verified artisans if requested by user or active emergency hazard
    const requiresMatching = (explicitHire || isEmergency) && Boolean(session.matchedCategoryId);

    if (requiresMatching) {
      const turnLat = clientCoords?.latitude || (session.clientLatitude ? Number(session.clientLatitude) : null);
      const turnLng = clientCoords?.longitude || (session.clientLongitude ? Number(session.clientLongitude) : null);
      let resolvedState = 'Lagos';
      if (turnLat && turnLng) {
        if (turnLat >= 8.5 && turnLat <= 9.5 && turnLng >= 6.8 && turnLng <= 7.8) {
          resolvedState = 'FCT';
        } else if (turnLat >= 6.2 && turnLat <= 6.8 && turnLng >= 3.0 && turnLng <= 4.0) {
          resolvedState = 'Lagos';
        }
      } else if (session.clientAddress?.toLowerCase().includes('abuja')) {
        resolvedState = 'FCT';
      }
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

      const tradeTitle = session.category?.name || 'Specialist';
      matchedArtisans = (matchResult.candidates || []).map((c) =>
        MatchingEngineService.formatCandidateDossier(c, tradeTitle)
      );
      if (matchedArtisans.length === 0) {
        matchingNotice = matchResult.message;
      }
    }

    // 5. Handle On-Demand BOM if requested or confirmed
    let activeBOM = session.estimatedBOM || [];
    const isBomAsked = this._isBomRequested(effectiveUserMessage) || this._isBomRequested(userMessage);

    if (parsedResponse.estimatedBOM && parsedResponse.estimatedBOM.length > 0) {
      activeBOM = await BomPricingService.adjustBomToMarket({
        bomItems: parsedResponse.estimatedBOM,
        state: session.clientAddress?.toLowerCase().includes('abuja') ? 'FCT' : 'Lagos',
        tradeCategory: session.category?.slug || 'general',
      });
    }

    // 6. Persist an authoritative state update; the client never owns diagnostic history.
    const diagnosticState = DiagnosticStateService.mergeState(session.diagnosticState, parsedResponse);
    const updatedSession = await prisma.aiDiagnosticSession.update({
      where: { id: sessionId },
      data: {
        probableCause: parsedResponse.updatedProbableCause || session.probableCause,
        isHazardous: hazardCheck.isHazardous,
        urgency: effectiveUrgency,
        severity: parsedResponse.updatedSeverity || hazardCheck.severity,
        safetyInstructions: hazardCheck.safetyInstructions,
        diyAllowed: hazardCheck.isHazardous ? false : session.diyAllowed,
        diagnosticStatus: isEmergency ? 'EMERGENCY' : parsedResponse.status,
        diagnosticState,
        conversationSummary: DiagnosticStateService.buildSummary(diagnosticState),
        promptVersion: OGA_JOHN_PROMPT_VERSION,
        ...(activeBOM.length > 0 && isBomAsked ? { estimatedBOM: activeBOM } : {}),
      },
    });

    const finalReply = parsedResponse.conversationalReply || 'Understood. Let me know if you would like me to connect you with a verified artisan.';
    await prisma.aiDiagnosticTurn.create({
      data: { diagnosticSessionId: sessionId, role: 'assistant', content: finalReply, structuredDecision: parsedResponse },
    });

    return {
      reply: finalReply,
      intent: parsedResponse.intent,
      matchedArtisans,
      matchingNotice,
      diyRecommended: updatedSession.diyAllowed && matchedArtisans.length === 0,
      safetyWarning: parsedResponse.safetyWarning || (isHazardEscalated ? 'Immediate safety hazard detected. Containment required.' : null),
      isEmergency: effectiveUrgency === 'EMERGENCY',
      diyAdvice: parsedResponse.diyAdvice || null,
      updatedProbableCause: parsedResponse.updatedProbableCause || null,
      billOfMaterials: isBomAsked ? activeBOM : [],
      diagnosticStatus: updatedSession.diagnosticStatus,
      diagnosticState,
      nextQuestion: parsedResponse.nextQuestion,
      clarificationOptions: (matchedArtisans.length > 0 || parsedResponse.intent === 'MATCH_REQUESTED' || parsedResponse.intent === 'MATCH_ONLY')
        ? []
        : (parsedResponse.clarificationOptions || []).filter((opt) => !/^Option\s*\d+$/i.test(String(opt).trim())),
      isResolved: Boolean(parsedResponse.isResolved || updatedSession.diagnosticStatus === 'RESOLVED'),
      imageRequest: parsedResponse.imageRequest,
    };
  }
}
