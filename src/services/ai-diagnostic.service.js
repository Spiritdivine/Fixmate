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

let cachedTaxonomy = null;
let lastTaxonomyFetchTime = 0;
const TAXONOMY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class AiDiagnosticService {
  /**
   * Dynamically fetch active trade categories and associated skills from DB with 5-minute TTL cache
   * @returns {Promise<{ categories: Array, taxonomyPromptString: string, validSlugs: Set<string> }>}
   */
  static async getActiveCategoryTaxonomy() {
    const now = Date.now();
    if (cachedTaxonomy && now - lastTaxonomyFetchTime < TAXONOMY_CACHE_TTL_MS) {
      return cachedTaxonomy;
    }

    try {
      const dbCategories = await prisma.jobCategory.findMany({
        where: { isActive: true },
        include: { skills: true },
        orderBy: { name: 'asc' },
      });

      const validSlugs = new Set(dbCategories.map((c) => c.slug));

      const lines = dbCategories.map((c) => {
        const skillList = c.skills?.length
          ? c.skills.map((s) => s.name).join(', ')
          : 'General maintenance in this trade';
        return `- Slug: "${c.slug}" | Trade: "${c.name}" | Jurisdiction & Scope: Core competencies include ${skillList}.`;
      });

      const taxonomyPromptString = lines.join('\n');

      cachedTaxonomy = {
        categories: dbCategories,
        taxonomyPromptString,
        validSlugs,
      };
      lastTaxonomyFetchTime = now;
      return cachedTaxonomy;
    } catch (err) {
      console.error('Failed to fetch active category taxonomy from DB:', err.message);
      if (cachedTaxonomy) return cachedTaxonomy;
      return {
        categories: [],
        taxonomyPromptString: `- Slug: "electrical-and-wiring" | Trade: "Electrical & Wiring"
- Slug: "plumbing-and-pipefitting" | Trade: "Plumbing & Pipefitting"
- Slug: "carpentry-and-woodwork" | Trade: "Carpentry & Woodwork"
- Slug: "masonry-and-tiling" | Trade: "Masonry & Tiling"
- Slug: "hvac-and-ac-repair" | Trade: "HVAC & Air Conditioning"
- Slug: "painting-and-pop" | Trade: "Painting & POP Ceiling"`,
        validSlugs: new Set([
          'electrical-and-wiring',
          'plumbing-and-pipefitting',
          'carpentry-and-woodwork',
          'masonry-and-tiling',
          'hvac-and-ac-repair',
          'painting-and-pop',
        ]),
      };
    }
  }

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

    // 3. Cache lookup for pure text queries
    let parsedResult = null;
    const cacheKey =
      effectiveTextPrompt && (!activeVisionImages || activeVisionImages.length === 0)
        ? AiCacheService.hashKey(effectiveTextPrompt, '', clientAddress || '')
        : null;

    if (cacheKey) {
      const cached = await AiCacheService.getAsync(cacheKey);
      if (cached) {
        parsedResult = { ...cached, isCacheHit: true };
      }
    }

    // Fetch active dynamic trade taxonomy from DB
    const taxonomy = await this.getActiveCategoryTaxonomy();

    // 4. Model Inference Tier: OpenAI -> Gemini -> Heuristic Fallback
    if (!parsedResult) {
      if (openaiClient && AiCacheService.isProviderHealthy('openai')) {
        try {
          parsedResult = await this._callOpenAI({
            textPrompt: effectiveTextPrompt,
            imageUrls: activeVisionImages,
            dynamicTaxonomyPrompt: taxonomy.taxonomyPromptString,
          });
          AiCacheService.recordProviderSuccess('openai');
        } catch (error) {
          AiCacheService.recordProviderFailure('openai', error);
          console.warn(`⚠️ OpenAI diagnostic call failed (${error.message}). Falling back to Gemini / rules.`);
        }
      }

      if (!parsedResult && geminiClient && AiCacheService.isProviderHealthy('gemini')) {
        try {
          parsedResult = await this._callGemini({
            textPrompt: effectiveTextPrompt,
            imageUrls: activeVisionImages,
            dynamicTaxonomyPrompt: taxonomy.taxonomyPromptString,
          });
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

    // 5.4 Out-of-Scope Gating: Reject motor vehicles, personal consumer electronics, non-property inquiries
    if (parsedResult.userIntent === 'OUT_OF_SCOPE') {
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
          diagnosticTitle: 'Out of Scope Request',
          probableCause: null,
          severity: 'LOW',
          urgency: 'ROUTINE',
          isHazardous: false,
          safetyInstructions: [],
          diyAllowed: false,
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

      const conversationalReply =
        parsedResult.conversationalReply ||
        'Fixmate specializes strictly in residential and commercial property maintenance (such as electrical wiring, plumbing, HVAC and AC repair, carpentry, masonry, and painting). We do not service motor vehicles or personal electronic devices like phones or laptops.';

      await prisma.aiDiagnosticTurn.createMany({
        data: [
          { diagnosticSessionId: session.id, role: 'user', content: textPrompt || 'Out of scope inquiry' },
          { diagnosticSessionId: session.id, role: 'assistant', content: conversationalReply },
        ],
      });

      return {
        session,
        diagnosis: {
          diagnosticTitle: 'Out of Scope Request',
          probableCause: null,
          severity: 'LOW',
          urgency: 'ROUTINE',
          isHazardous: false,
          diyAllowed: false,
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

    // 5.5 Dynamic AI Intent Handling: Pure Greeting vs Diagnostic Consultation
    if (parsedResult.userIntent === 'GREETING') {
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

      const conversationalReply = parsedResult.conversationalReply || await this._generateDynamicGreeting(textPrompt);
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
    const bomAsked = parsedResult.bomRequested === true;

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

    // 9. Resolve category from database by slug validated against active DB taxonomy
    let category = null;
    if (parsedResult.categorySlug && taxonomy.validSlugs.has(parsedResult.categorySlug)) {
      category = await prisma.jobCategory.findUnique({
        where: { slug: parsedResult.categorySlug },
      });
    } else if (parsedResult.categorySlug) {
      category = await prisma.jobCategory.findFirst({
        where: {
          isActive: true,
          OR: [
            { slug: { contains: parsedResult.categorySlug, mode: 'insensitive' } },
            { name: { contains: parsedResult.categorySlug.replace(/-/g, ' '), mode: 'insensitive' } },
          ],
        },
      });
    }
    if (!category) {
      parsedResult.categorySlug = null;
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

    // Persist normalized forensic diagnostic evidence
    try {
      const evidenceRecords = [];
      if (effectiveTextPrompt) {
        evidenceRecords.push({
          diagnosticSessionId: session.id,
          evidenceType: 'USER_STATEMENT',
          normalizedFact: effectiveTextPrompt.substring(0, 500),
          confidenceBand: 'high',
        });
      }
      if (parsedResult.probableCause) {
        evidenceRecords.push({
          diagnosticSessionId: session.id,
          evidenceType: mediaFiles && mediaFiles.length > 0 ? 'PHOTO_FEATURE' : 'DIAGNOSTIC_INFERENCE',
          normalizedFact: parsedResult.probableCause.substring(0, 500),
          confidenceBand: parsedResult.confidence || 'moderate',
        });
      }
      if (evidenceRecords.length > 0) {
        await prisma.diagnosticEvidence.createMany({ data: evidenceRecords });
      }
    } catch (err) {
      console.warn('⚠️ Could not record diagnostic evidence:', err.message);
    }

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
    const isLifeSafetyEmergency =
      parsedResult.urgency === 'EMERGENCY' ||
      parsedResult.severity === 'CRITICAL' ||
      (Array.isArray(parsedResult.hazardTypes) &&
        parsedResult.hazardTypes.some((h) => ['GAS_EXPLOSION', 'ACTIVE_FLOODING', 'FIRE_ARC'].includes(h)));
    const shouldMatchArtisans =
      (isLifeSafetyEmergency ||
        clientRequestedArtisan === true ||
        parsedResult.userIntent === 'ARTISAN_HIRE_REQUESTED' ||
        parsedResult.shouldMatchArtisans === true) &&
      category != null;

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

    // Persist finalized conversationalReply and matchedArtisans into assistant turn
    try {
      await prisma.aiDiagnosticTurn.updateMany({
        where: { diagnosticSessionId: session.id, role: 'assistant' },
        data: {
          content: conversationalReply,
          structuredDecision: {
            ...parsedResult,
            matchedArtisans,
          },
        },
      });

      if (matchedArtisans && matchedArtisans.length > 0) {
        const matchData = matchedArtisans
          .filter((a) => a?.id)
          .map((artisan) => ({
            diagnosticSessionId: session.id,
            artisanProfileId: artisan.id,
            matchScore: artisan.matchScore || 90.0,
            distanceKm: artisan.distanceKm ? Number(artisan.distanceKm) : null,
            matchRationale: 'Recommended during initial diagnostic intake',
          }));

        if (matchData.length > 0) {
          await prisma.diagnosticMatch.createMany({
            data: matchData,
            skipDuplicates: true,
          }).catch((err) => {
            console.warn('⚠️ Non-fatal notice creating diagnostic matches batch:', err.message);
          });
        }
      }
    } catch (saveErr) {
      console.warn('⚠️ Could not update initial diagnostic turn with matched artisans:', saveErr.message);
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
   * Shared Master Diagnostic System Prompt incorporating the 4 Engineering Principles:
   * 1. Scope and Safety Gate (Property maintenance only; out-of-scope rejection; electrical hazard dominance)
   * 2. Dynamic Trade Taxonomy (Database-backed category slugs and jurisdictions, no hardcoded words)
   * 3. Root-Cause & Multi-Trade Reasoning (Underlying fault priority over superficial symptoms)
   * 4. Evidence-Based Classification (categorySlug: null on ambiguity; 1 targeted clarifying question)
   */
  static _buildMasterDiagnosticSystemPrompt(dynamicTaxonomyPrompt = '') {
    const taxonomySection = dynamicTaxonomyPrompt
      ? `ACTIVE DATABASE TRADE TAXONOMY & JURISDICTIONS:\n${dynamicTaxonomyPrompt}`
      : `ACTIVE DATABASE TRADE TAXONOMY & JURISDICTIONS:
- Slug: "electrical-and-wiring" | Trade: "Electrical & Wiring" | Scope: Distribution boards, breakers, circuits, lighting, switches, inverters, solar, generators, electrical safety.
- Slug: "plumbing-and-pipefitting" | Trade: "Plumbing & Pipefitting" | Scope: Water supply, pipes, taps, toilets, drainage, pumps, water heaters, pipe leaks.
- Slug: "carpentry-and-woodwork" | Trade: "Carpentry & Woodwork" | Scope: Furniture, doors, frames, roof trusses, cabinetry, wardrobes, timber structures.
- Slug: "masonry-and-tiling" | Trade: "Masonry & Tiling" | Scope: Brickwork, plastering, screeding, ceramic/granite tiling, structural masonry.
- Slug: "hvac-and-ac-repair" | Trade: "HVAC & Air Conditioning" | Scope: Split units, chillers, refrigeration, compressors, ducting, cooling systems.
- Slug: "painting-and-pop" | Trade: "Painting & POP Ceiling" | Scope: Wall finishes, emulsion/gloss paint, POP ceiling designs, screeding, waterproofing.`;

    return `You are Oga John, the Chief AI Diagnostic Engineer and Senior Technical Consultant for Artifix (Fixmate), Nigeria.
You apply the diagnostic reasoning, engineering principles, and communication standards of an experienced multidisciplinary maintenance consultant across electrical, plumbing, HVAC, generator plants, carpentry/furniture, masonry, and painting/roofing.
You are an AI assistant, not a physically present tradesperson. Never falsely claim personal physical work history, manual inspections, or guaranteed physical outcomes.

ENGINEERING PRINCIPLES & CORE PROTOCOLS:

1. SCOPE AND SAFETY GATE:
   - PROPERTY MAINTENANCE SCOPE: Fixmate is strictly dedicated to residential, commercial property, and building infrastructure maintenance.
   - OUT-OF-SCOPE INQUIRIES: Motor vehicles (cars, motorcycles, auto engines/transmissions), personal electronics (smartphones, laptops, tablets, consumer TVs, computer hardware), medical devices, or industrial plant machinery are OUT OF SCOPE.
     * When the user inquiry is out of scope:
       - Set "userIntent": "OUT_OF_SCOPE"
       - Set "categorySlug": null
       - Set "diagnosticTitle": "Out of Scope Request"
       - Set "probableCause": null
       - Set "shouldMatchArtisans": false
       - Set "bomRequested": false
       - Set "estimatedBOM": []
       - In "conversationalReply", politely and warmly explain that Fixmate specializes exclusively in property, building, and household infrastructure maintenance (electrical, plumbing, HVAC, carpentry, masonry, painting), and cannot diagnose or repair motor vehicles or personal electronics.
   - HAZARD DOMINANCE: Life and property safety take absolute priority over ordinary diagnosis or artisan matching.
     * When water and electricity interact dangerously (e.g. water leaking into a socket, damp distribution board, wet breaker, sparking water heater):
       - ELECTRICAL HAZARD TAKES ABSOLUTE DOMINANCE.
       - Prioritize immediate electrical containment (shutting off the main incomer breaker) before considering plumbing repairs.
       - Never instruct a user to touch wet electrical appliances or approach energized circuits.

2. DYNAMIC TRADE TAXONOMY & JURISDICTION:
${taxonomySection}
   - Determine "categorySlug" strictly based on engineering jurisdiction and physical systems from the active database taxonomy above.
   - NEVER rely on superficial keyword coincidence (e.g. "outdoor unit" of an AC is HVAC, not Carpentry/door; "water heater" electrical element is Electrical/Plumbing root).
   - If the issue matches an active category, return its exact slug. If the issue is out of scope or ambiguous, return null.

3. ROOT-CAUSE AND MULTI-TRADE REASONING:
   - Separate the underlying fault from its superficial symptoms.
   - If a leaking pipe causes ceiling paint to peel or POP plaster to soften, the ROOT CAUSE is plumbing/water ingress; do not classify it as cosmetic painting until the water source is arrested.
   - If multiple trades are involved, preserve that uncertainty in your "hypotheses", prioritize immediate hazard containment, and do not force the problem into an arbitrary category.

4. EVIDENCE-BASED CLASSIFICATION:
   - When evidence is insufficient or ambiguous (e.g. "something is making noise", "it stopped working" without identifying the equipment), return "categorySlug": null.
   - Set "clarificationNeeded": true.
   - Ask ONE targeted, high-value clarifying question to identify the specific component and failure mode.
   - Provide 2-3 realistic clarification options.
   - Never invent or hallucinate a trade category, repair diagnosis, bill of materials, or price estimate to complete the request. Treat model confidence as an estimate.

5. USER INTENT CLASSIFICATION:
   - "GREETING": If user is just saying hello, pleasantry, or asking who you are without describing any physical problem:
     * Set "userIntent": "GREETING", "categorySlug": null, "diagnosticTitle": null, "probableCause": null, "shouldMatchArtisans": false, "estimatedBOM": [].
     * In "conversationalReply", warmly introduce yourself as Oga John and ask what building/home maintenance issue they have today.
   - "DIAGNOSTIC_CONSULTATION": If user describes a problem, fault, noise, leak, damage, or asks how to troubleshoot/fix something:
     * Set "userIntent": "DIAGNOSTIC_CONSULTATION".
     * Set "shouldMatchArtisans": false. Do NOT recommend or match an artisan unsolicited during diagnosis! Explain the issue and ask if they would like to be connected with a specialist.
   - "ARTISAN_HIRE_REQUESTED": If user explicitly asks to hire, find, or send an artisan/technician:
     * Set "userIntent": "ARTISAN_HIRE_REQUESTED".
     * Set "shouldMatchArtisans": true.
   - "OUT_OF_SCOPE": If user asks about vehicles, phones, laptops, or non-property items.

6. DIAGNOSTIC REASONING PROTOCOL (For DIAGNOSTIC_CONSULTATION):
   - Acknowledge emotion & issue with natural empathy, mirroring Nigerian English or Pidgin naturally if spoken.
   - Screen safety / protect first: If there is physical hazard (sparks, burning smell, gas leak, flooding, collapsing furniture), issue an immediate clear precaution FIRST.
   - Formulate 2-3 plausible hypotheses.
   - Ask ONE targeted, high-value question narrowing down the failure.
   - Request visual evidence: Invite user to upload a clear photo if helpful.
   - Professional vs DIY gating:
     * For dangerous faults (arcing, gas, refrigerant, engine knock, structural damage), set "diyAllowed": false, do not give DIY steps, and offer verified specialist assistance.
     * For safe fixes (tightening loose hinge, tap washer, sink P-trap clear, AC dust mesh), set "diyAllowed": true and provide clear steps.
   - No self-reintroduction in consultation: If already diagnosing, get straight to the problem without "Hello, I am Oga John".

7. RESTRICTED BILL OF MATERIALS & PRICING:
   - Set "bomRequested": true and populate "estimatedBOM" ONLY when the user EXPLICITLY asks for parts, pricing, materials, or bill of materials.
   - In all other cases, set "bomRequested": false and "estimatedBOM": [].

You MUST respond strictly with a valid JSON object matching this schema:
{
  "userIntent": "GREETING" | "DIAGNOSTIC_CONSULTATION" | "ARTISAN_HIRE_REQUESTED" | "OUT_OF_SCOPE",
  "conversationalReply": "Crisp, concise, empathetic conversational reply in clean markdown. Plain text without verbosity.",
  "diagnosticTitle": "Short 3-5 word technical title or null if greeting/out of scope",
  "probableCause": "Precise 1-sentence technical root cause summary or null if greeting/out of scope",
  "categorySlug": "Exact slug from active taxonomy, or null if ambiguous or out of scope",
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
  "shouldMatchArtisans": true or false,
  "bomRequested": true or false,
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
  }

  /**
   * Master Artisan Conversational Diagnostic via OpenAI GPT-4o with FULL structured output
   */
  static async _callOpenAI({ textPrompt, imageUrls = [], dynamicTaxonomyPrompt = '' }) {
    if (!openaiClient) throw new Error('OpenAI client not initialized');

    const systemPrompt = this._buildMasterDiagnosticSystemPrompt(dynamicTaxonomyPrompt);

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
  static async _callGemini({ textPrompt, imageUrls = [], dynamicTaxonomyPrompt = '' }) {
    if (!geminiClient) throw new Error('Gemini client not initialized');

    const systemPrompt = this._buildMasterDiagnosticSystemPrompt(dynamicTaxonomyPrompt);

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

    // HVAC & Air Conditioning fault
    const isHvacIssue =
      /\b(ac|a\/c|air\s*condition(?:er|ing)?|split\s*unit|compressor|chiller|freon|refrigerant|cooling|evaporator|condenser|fan\s*coil)\b/i.test(lower) ||
      (lower.includes('warm air') && (lower.includes('unit') || lower.includes('outdoor') || lower.includes('ac') || lower.includes('blow'))) ||
      (lower.includes('outdoor unit') && (lower.includes('ac') || lower.includes('loud') || lower.includes('noise') || lower.includes('fan')));

    if (isHvacIssue) {
      const isLoudCompressor = lower.includes('loud') || lower.includes('noise') || lower.includes('buzz') || lower.includes('sound');
      const isNotCooling = lower.includes('warm') || lower.includes('not cool') || lower.includes('not blowing cold') || lower.includes('hot air');
      
      return {
        conversationalReply: isNotCooling && isLoudCompressor
          ? 'I understand how frustrating it can be when your AC is blowing warm air while the outdoor unit is unusually loud. This typically points to a malfunctioning compressor motor, a damaged condenser fan, or low refrigerant pressure. Since working with high-voltage dual capacitors and pressurized refrigerant lines requires certified diagnostic tools, would you like me to connect you with a verified HVAC specialist nearby to inspect this safely?'
          : 'Air conditioning systems require proper refrigerant charge, clean condenser airflow, and balanced capacitor voltage to cool effectively. To protect the compressor motor from overheating or burning out, please switch off the unit at its isolator. Would you like me to connect you with a verified HVAC specialist nearby?',
        diagnosticTitle: isLoudCompressor ? 'HVAC Compressor / Condenser Fault' : 'Air Conditioner Cooling Performance Loss',
        probableCause: isLoudCompressor
          ? 'Failing compressor motor, defective start capacitor, or obstructed outdoor condenser fan.'
          : 'Low refrigerant charge, clogged condenser coils, or faulty thermostatic expansion valve.',
        severity: 'MODERATE',
        urgency: 'SCHEDULED',
        isHazardous: false,
        hazardTypes: ['NONE'],
        safetyInstructions: [
          { stepNumber: 1, action: 'Turn off the AC via remote and switch off its local isolator switch to prevent compressor burnout.', urgency: 'PRECAUTIONARY', targetComponent: 'AC Isolator Switch' },
          { stepNumber: 2, action: 'Do NOT attempt to open the outdoor condenser electrical cover while power is connected.', urgency: 'IMMEDIATE_ACTION', targetComponent: 'Outdoor Unit Cover' },
        ],
        diyAllowed: false,
        diyRiskReason: 'HVAC sealed refrigeration systems and high-voltage dual capacitors pose electrical shock and pressurized refrigerant hazard. Requires certified HVAC technician.',
        diyGuide: null,
        requiresArtisan: true,
        clarificationQuestion: 'Is the outdoor condenser fan spinning when the loud noise occurs, or is the sound coming from a buzzing motor that refuses to spin?',
        clarificationOptions: ['Fan is spinning, but making grinding noise', 'Fan is completely stuck, humming loudly', 'Outdoor unit vibrates violently'],
        estimatedBOM: [],
        estimatedLaborMin: null,
        estimatedLaborMax: null,
        currency: 'NGN',
        categorySlug: 'hvac-and-ac-repair',
        recommendedSkills: ['ac-repair', 'refrigerant-charging', 'compressor-servicing'],
        visualObservations: imageUrls.length > 0 ? 'Outdoor condensing unit reference logged.' : null,
        symptoms: ['AC blowing warm air, abnormal noise from outdoor condenser unit reported'],
        possibleCauses: [
          {
            label: 'Faulty run/start capacitor preventing compressor or fan startup',
            supportingEvidence: ['Loud humming/buzzing with warm air symptoms'],
            missingEvidence: ['Capacitance microfarad multimeter test'],
            likelihoodBand: 'high',
          },
          {
            label: 'Compressor mechanical failure or low refrigerant pressure',
            supportingEvidence: ['Outdoor unit noise combined with zero cooling'],
            missingEvidence: ['Manifold gauge pressure reading'],
            likelihoodBand: 'moderate',
          },
        ],
        guidanceSteps: [
          {
            stepNumber: 1,
            instruction: 'Switch off the AC isolator switch beside the outdoor unit to avoid overheating the compressor.',
            risk: 'low',
            stopConditions: ['Do not touch live electrical terminals inside the outdoor unit.'],
          },
        ],
        nextAction: 'answer_clarification',
      };
    }

    // Carpentry & Furniture fault
    const isCarpentry =
      lower.includes('couch') ||
      lower.includes('sofa') ||
      lower.includes('chair') ||
      lower.includes('table') ||
      lower.includes('desk') ||
      lower.includes('wood') ||
      lower.includes('cabinet') ||
      lower.includes('wardrobe') ||
      lower.includes('drawer') ||
      lower.includes('cupboard') ||
      /\b(?<!in|out)doors?\b/i.test(lower) ||
      /\bhinges?\b/i.test(lower) ||
      (/\blegs?\b/i.test(lower) && (lower.includes('broken') || lower.includes('wobble') || lower.includes('snap') || lower.includes('furniture')));

    if (isCarpentry) {
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

    const taxonomy = await this.getActiveCategoryTaxonomy();

    const systemPrompt = buildOgaJohnTurnPrompt({
      session,
      diagnosticState: session.diagnosticState || DiagnosticStateService.initialState(),
      urgency: effectiveUrgency,
      dynamicTaxonomyPrompt: taxonomy.taxonomyPromptString,
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

    // 3.5 Dynamic Trade Classification: AI semantic judgment validated against DB taxonomy
    const detectedSlug = parsedResponse.categorySlug || null;
    if (detectedSlug && taxonomy.validSlugs.has(detectedSlug)) {
      const foundCategory = await prisma.jobCategory.findUnique({
        where: { slug: detectedSlug },
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
    } else if (detectedSlug) {
      const foundCategory = await prisma.jobCategory.findFirst({
        where: {
          isActive: true,
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
      } else if (!foundCategory) {
        parsedResponse.categorySlug = null;
      }
    }

    // Out-of-Scope Safety Gate Override
    if (parsedResponse.intent === 'OUT_OF_SCOPE') {
      parsedResponse.shouldMatchArtisans = false;
      parsedResponse.categorySlug = null;
      parsedResponse.estimatedBOM = [];
      parsedResponse.bomRequested = false;
    }

    // 4. Resolve Artisan Matches (Strict AI Semantic Intent Gating)
    let matchedArtisans = [];
    let matchingNotice = null;

    // AI Semantic Intent determines whether artisan matching is requested
    const explicitHire =
      parsedResponse.intent !== 'OUT_OF_SCOPE' &&
      (parsedResponse.intent === 'MATCH_REQUESTED' ||
        parsedResponse.intent === 'MATCH_ONLY' ||
        parsedResponse.shouldMatchArtisans === true);

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
    } else {
      // User is diagnosing: do not force match or dispatch
      parsedResponse.intent = parsedResponse.intent || 'CONVERSATIONAL';
      parsedResponse.shouldMatchArtisans = false;
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
    const isBomAsked = parsedResponse.bomRequested === true || parsedResponse.intent === 'BOM_REQUESTED';

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
      data: {
        diagnosticSessionId: sessionId,
        role: 'assistant',
        content: finalReply,
        structuredDecision: {
          ...parsedResponse,
          matchedArtisans,
        },
      },
    });

    if (matchedArtisans && matchedArtisans.length > 0) {
      const matchData = matchedArtisans
        .filter((a) => a?.id)
        .map((artisan) => ({
          diagnosticSessionId: sessionId,
          artisanProfileId: artisan.id,
          matchScore: artisan.matchScore || 90.0,
          distanceKm: artisan.distanceKm ? Number(artisan.distanceKm) : null,
          matchRationale: 'Recommended during conversational consultation',
        }));

      if (matchData.length > 0) {
        await prisma.diagnosticMatch.createMany({
          data: matchData,
          skipDuplicates: true,
        }).catch((err) => {
          console.warn('⚠️ Non-fatal notice creating conversational diagnostic matches batch:', err.message);
        });
      }
    }

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
