import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { MatchingEngineService } from './matching-engine.service.js';
import { TranscriptionService } from './transcription.service.js';
import { AiCacheService } from './ai-cache.service.js';

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
   * Run multimodal diagnostic analysis
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
    userId = null,
    clientSessionToken = null,
    clientRequestedArtisan = false,
  }) {
    const activeVisionImages = visionImageUrls.length > 0 ? visionImageUrls : imageUrls;

    if (!textPrompt && (!activeVisionImages || activeVisionImages.length === 0) && !voiceAudioBuffer && !voiceAudioUrl) {
      throw ApiError.badRequest('Please provide a text description, photo, or voice note of the issue.');
    }

    let audioTranscriptionResult = null;
    let effectiveTextPrompt = textPrompt;

    // Transcribe audio if provided
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

    let parsedResult;
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

    if (!parsedResult) {
      if (openaiClient) {
        try {
          parsedResult = await this._callOpenAI({ textPrompt: effectiveTextPrompt, imageUrls: activeVisionImages });
        } catch (error) {
          console.warn(`⚠️ OpenAI diagnostic call failed (${error.message}). Falling back to Gemini / internal rules.`);
        }
      }

      if (!parsedResult && geminiClient) {
        try {
          parsedResult = await this._callGemini({ textPrompt: effectiveTextPrompt, imageUrls: activeVisionImages });
        } catch (error) {
          console.warn(`⚠️ Gemini API call failed (${error.message}). Falling back to internal diagnostic rules engine.`);
        }
      }

      if (!parsedResult) {
        // Intelligent heuristic fallback when API keys are unavailable or fail
        parsedResult = this._simulateDiagnostic({ textPrompt: effectiveTextPrompt, imageUrls });
      }

      if (cacheKey && parsedResult) {
        AiCacheService.set(cacheKey, parsedResult);
      }
    }

    // Override emergency if audio tone detector flagged it
    if (audioTranscriptionResult?.isEmergencyTone) {
      parsedResult.urgency = 'EMERGENCY';
      parsedResult.isHazardous = true;
    }

    // Resolve category from database by slug or fallback to general repair
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

    if (!category) {
      // Default fallback category if no exact match
      category = await prisma.jobCategory.findFirst({
        where: { isActive: true },
      });
    }

    // Determine input type enum
    let inputType = 'TEXT';
    if (voiceAudioBuffer || voiceAudioUrl) {
      inputType = imageUrls.length > 0 ? 'MULTIMODAL' : 'VOICE';
    } else if (imageUrls && imageUrls.length > 0) {
      inputType = textPrompt ? 'MULTIMODAL' : 'PHOTO';
    }

    // Check for interactive clarification questions if inquiry is ambiguous
    const clarification = TranscriptionService.generateClarificationQuestions({
      textPrompt: effectiveTextPrompt,
      categorySlug: parsedResult.categorySlug || '',
    });

    // Synthesize preliminary artisan audio briefing script
    const artisanScript = TranscriptionService.generateArtisanAudioScript({
      session: {
        diagnosticTitle: parsedResult.diagnosticTitle,
        probableCause: parsedResult.probableCause,
        clientAddress,
        estimatedBOM: parsedResult.estimatedBOM,
      },
    });

    // Persist session into PostgreSQL
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
          create: imageUrls.map((url) => ({
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

    // Requirement 1: If the diagnosed issue is something the client can resolve (diyAllowed is true)
    // and the client has not explicitly insisted on matching an artisan, suppress artisan matching.
    let matchedArtisans = [];
    const shouldMatchArtisans = !parsedResult.diyAllowed || clientRequestedArtisan === true;

    if (shouldMatchArtisans) {
      matchedArtisans = await MatchingEngineService.findTopMatches({
        diagnosticSessionId: session.id,
        categoryId: category ? category.id : null,
        categorySlug: parsedResult.categorySlug,
        skillSlugs: parsedResult.recommendedSkills || [],
        clientLat: clientCoords?.latitude || null,
        clientLng: clientCoords?.longitude || null,
        limit: 3,
      });
    }

    return {
      session,
      diagnosis: parsedResult,
      conversationalReply: parsedResult.conversationalReply || parsedResult.probableCause || 'Here is what I found regarding this fault.',
      category,
      diyRecommended: parsedResult.diyAllowed && !clientRequestedArtisan,
      matchedArtisans,
      preliminaryArtisans: matchedArtisans,
    };
  }

  /**
   * Master Artisan Conversational Diagnostic via OpenAI GPT-4o
   */
  static async _callOpenAI({ textPrompt, imageUrls = [] }) {
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const systemPrompt = `You are a master artisan and professional home services consultant on Artifix, with 15+ years of practical experience across electrical, plumbing, generator, HVAC/refrigeration, carpentry, masonry, and home repair trades.

YOUR PERSONA & SPEAKING STYLE:
- Speak naturally, warmly, and pragmatically like an experienced, trusted Nigerian/West African artisan and trade engineering consultant on a home visit or call.
- Speak directly to the client ("I understand", "Let's check this out", "Here is what is likely causing it").
- NO robotic forms or rigid data cards. DO NOT output tool lists, BOM tables, or robotic metadata unless specifically requested.
- If the user's description is brief or ambiguous (e.g. "my light is blinking", "my tap is dripping", "my AC makes noise"), do not make wild assumptions: ask 1-2 sharp, practical troubleshooting questions to narrow it down.
- If it's a hazardous issue (exposed live electrical wires, gas smell, structural wall crack, severe flooding), warn them immediately with clear safety containment steps (e.g. shut off the main incomer breaker) and explain why a certified artisan should inspect it.
- If the client indicates they want someone to come fix it or asks for an artisan, state that you can immediately match them with our top-rated, KYC-verified specialists nearby through Artifix Escrow.

OUTPUT FORMAT:
Return a JSON object conforming to:
{
  "conversationalReply": "Your authentic, natural, master-artisan response in conversational markdown paragraphs and clean bullet points if helpful.",
  "diagnosticTitle": "Short 3-5 word technical title for session record",
  "probableCause": "Brief 1-sentence technical root cause summary",
  "categorySlug": "One of: electrical-and-wiring, plumbing-and-pipefitting, hvac-and-ac-repair, carpentry-and-woodwork, masonry-and-tiling, painting-and-pop",
  "severity": "LOW, MODERATE, HIGH, or CRITICAL",
  "urgency": "ROUTINE, SCHEDULED, URGENT, or EMERGENCY",
  "isHazardous": true or false,
  "diyAllowed": true if safe for client to do simple check/tightening, false if requires specialist,
  "requiresArtisan": true if hazardous or client asked for a pro, false if simple DIY
}`;

    const userContent = imageUrls.length > 0
      ? [
          { type: 'text', text: textPrompt || 'Please inspect this fault from the attached photos.' },
          ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } }))
        ]
      : textPrompt;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.65,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Call Gemini 2.0 Flash Multimodal Vision & Reasoning API
   */
  static async _callGemini({ textPrompt, imageUrls }) {
    const systemPrompt = `
You are the chief diagnostic engineering AI for Artifix (Fixmate), an artisanal repair marketplace operating in Nigeria and West Africa.
Task: Diagnose the user's home/vehicle/electrical/plumbing/mechanical inquiry based on the text description and photos.

Requirements:
1. Provide a professional, concise diagnostic title.
2. Formulate the probable root cause in plain English.
3. Classify severity: LOW, MODERATE, HIGH, or CRITICAL.
4. Classify urgency: ROUTINE, SCHEDULED, URGENT, or EMERGENCY.
5. Check for immediate life/property hazards (fire, electric shock, gas leak, active flooding).
6. Give 1-3 immediate containment steps (e.g. "Switch off main isolator/breaker immediately").
7. Indicate whether it is safe for DIY or if a professional artisan is strictly required.
8. Provide estimated Bill of Materials (BOM) in Nigerian Naira (NGN) with realistic price ranges.
9. Provide estimated labor range in NGN.
10. Map to one of the canonical Artifix categories: [electrical, plumbing, hvac-refrigeration, carpentry, masonry-painting, generator-repair, appliance-repair].
11. Return strictly valid JSON conforming to the schema.
`;

    const contents = [{ text: systemPrompt }];

    if (textPrompt) {
      contents.push({ text: `User Description: ${textPrompt}` });
    }

    for (const url of imageUrls) {
      contents.push({ image: { uri: url } });
    }

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.15,
      },
    });

    return JSON.parse(response.text);
  }

  /**
   * Heuristic rules engine for development, offline, or fallback simulation
   */
  static _simulateDiagnostic({ textPrompt = '', imageUrls = [] }) {
    const lower = textPrompt.toLowerCase();

    // Electrical issues
    if (lower.includes('spark') || lower.includes('shock') || lower.includes('breaker') || lower.includes('trip') || lower.includes('wire') || lower.includes('socket') || lower.includes('nepa') || lower.includes('light')) {
      const isCritical = lower.includes('spark') || lower.includes('shock') || lower.includes('burn') || lower.includes('smoke');
      return {
        diagnosticTitle: isCritical ? 'Critical Electrical Fault / Short Circuit' : 'Circuit Breaker Tripping / Overload Condition',
        probableCause: isCritical
          ? 'Damaged cable insulation, loose terminal arcing, or severe grounding short circuit.'
          : 'Appliance power surge, faulty RCBO/MCB breaker, or unbalanced neutral line.',
        severity: isCritical ? 'CRITICAL' : 'HIGH',
        urgency: isCritical ? 'EMERGENCY' : 'URGENT',
        isHazardous: isCritical,
        safetyInstructions: [
          'Immediately switch off the main distribution incomer breaker.',
          'Do NOT touch exposed wires, charred outlets, or metallic switchplates.',
          'Keep children and water away from the area until an electrician inspects.',
        ],
        diyAllowed: false,
        diyGuide: null,
        estimatedBOM: [
          { item: 'Replacement MCB/RCBO 32A Breaker', estimatedCostMin: 4500, estimatedCostMax: 8500 },
          { item: 'Heavy-Duty Terminal Block & Insulation Tape', estimatedCostMin: 1500, estimatedCostMax: 3000 },
        ],
        estimatedLaborMin: 6000,
        estimatedLaborMax: 15000,
        currency: 'NGN',
        categorySlug: 'electrical',
        recommendedSkills: ['electrical-wiring', 'circuit-breaker-replacement', 'fault-finding'],
        visualObservations: imageUrls.length > 0 ? 'Visual inspection indicates signs of electrical panel or outlet wear.' : null,
      };
    }

    // Plumbing issues
    if (lower.includes('leak') || lower.includes('pipe') || lower.includes('water') || lower.includes('tap') || lower.includes('sink') || lower.includes('toilet') || lower.includes('pump') || lower.includes('drain')) {
      const isFlooding = lower.includes('burst') || lower.includes('flood') || lower.includes('gush');
      return {
        diagnosticTitle: isFlooding ? 'Burst High-Pressure Water Pipe' : 'Plumbing Joint Fissure & Faucet Leak',
        probableCause: isFlooding
          ? 'Failed PVC/PPR pipe seam or booster pump pressure surge rupturing line.'
          : 'Worn spindle rubber washer, calcified valve cartridge, or failed Teflon joint tape.',
        severity: isFlooding ? 'HIGH' : 'MODERATE',
        urgency: isFlooding ? 'URGENT' : 'SCHEDULED',
        isHazardous: isFlooding,
        safetyInstructions: [
          'Turn off the main stopcock valve immediately to halt water flow.',
          'Power down any nearby water heater or booster pump to prevent dry-running.',
          'Mop standing water away from electrical wall sockets.',
        ],
        diyAllowed: !isFlooding,
        diyGuide: !isFlooding ? 'You can isolate the angle valve beneath the fixture and replace the Teflon tape around the compression nut.' : null,
        estimatedBOM: [
          { item: 'High-Pressure PPR Joint & Coupling (3/4")', estimatedCostMin: 2500, estimatedCostMax: 5000 },
          { item: 'Heavy Duty Teflon Sealant Tape & Thread Compound', estimatedCostMin: 1000, estimatedCostMax: 2000 },
        ],
        estimatedLaborMin: 5000,
        estimatedLaborMax: 12000,
        currency: 'NGN',
        categorySlug: 'plumbing',
        recommendedSkills: ['pipe-fitting', 'leak-repair', 'plumbing-fixtures'],
        visualObservations: imageUrls.length > 0 ? 'Visible moisture around piping junction or fixture threading.' : null,
      };
    }

    // HVAC / Air Conditioning
    if (lower.includes('ac') || lower.includes('cool') || lower.includes('air conditioner') || lower.includes('freon') || lower.includes('compressor') || lower.includes('cold') || lower.includes('chilled')) {
      return {
        diagnosticTitle: 'Air Conditioner Blower Operating Without Active Cooling',
        probableCause: 'Failed dual run capacitor (35+5 uF) or low refrigerant charge due to copper flare joint leak.',
        severity: 'MODERATE',
        urgency: 'SCHEDULED',
        isHazardous: false,
        safetyInstructions: [
          'Turn off the AC from the outdoor isolator switch to prevent compressor motor overheating.',
          'Clear any debris or plastic bags blocking the outdoor condenser fan vents.',
        ],
        diyAllowed: false,
        diyGuide: null,
        estimatedBOM: [
          { item: 'Dual Run Capacitor (35+5 uF 450V)', estimatedCostMin: 5000, estimatedCostMax: 9500 },
          { item: 'R410A Refrigerant Top-up (if needed)', estimatedCostMin: 14000, estimatedCostMax: 22000 },
        ],
        estimatedLaborMin: 8000,
        estimatedLaborMax: 16000,
        currency: 'NGN',
        categorySlug: 'hvac-refrigeration',
        recommendedSkills: ['ac-repair', 'refrigerant-charging', 'compressor-servicing'],
        visualObservations: imageUrls.length > 0 ? 'HVAC unit outdoor or indoor unit depicted.' : null,
      };
    }

    // Generator issues
    if (lower.includes('gen') || lower.includes('generator') || lower.includes('engine') || lower.includes('carburetor') || lower.includes('starter') || lower.includes('smoke')) {
      return {
        diagnosticTitle: 'Generator Engine Cranking Without Smooth Combustion',
        probableCause: 'Dirty carburetor jet, fouled spark plug electrode, or bad Automatic Voltage Regulator (AVR).',
        severity: 'MODERATE',
        urgency: 'ROUTINE',
        isHazardous: false,
        safetyInstructions: [
          'Shut off the fuel tap before inspecting.',
          'Do NOT refuel while the exhaust muffler is hot.',
          'Disconnect the building changeover load switch before starting.',
        ],
        diyAllowed: true,
        diyGuide: 'You can remove the spark plug with a 16mm socket, clean carbon deposits with fine sandpaper, and verify the gap.',
        estimatedBOM: [
          { item: 'Replacement Spark Plug (NGK / Champion)', estimatedCostMin: 1800, estimatedCostMax: 3500 },
          { item: 'Carburetor Cleaner Spray', estimatedCostMin: 2500, estimatedCostMax: 4000 },
        ],
        estimatedLaborMin: 4000,
        estimatedLaborMax: 10000,
        currency: 'NGN',
        categorySlug: 'generator-repair',
        recommendedSkills: ['generator-repair', 'carburetor-tuning', 'small-engine-mechanic'],
        visualObservations: imageUrls.length > 0 ? 'Small displacement generator mechanical assembly.' : null,
      };
    }

    // General / Default Diagnostic
    return {
      diagnosticTitle: 'General Property Maintenance & Repair Requirement',
      probableCause: 'Mechanical wear or component fatigue requiring on-site artisan physical diagnosis.',
      severity: 'LOW',
      urgency: 'ROUTINE',
      isHazardous: false,
      safetyInstructions: [
        'Keep the affected area clean and dry.',
        'Avoid applying excessive force to moving parts.',
      ],
      diyAllowed: true,
      diyGuide: 'Evaluate whether simple tightening or lubrication resolves the symptom.',
      estimatedBOM: [
        { item: 'General hardware fasteners / consumables', estimatedCostMin: 2000, estimatedCostMax: 5000 },
      ],
      estimatedLaborMin: 4000,
      estimatedLaborMax: 10000,
      currency: 'NGN',
      categorySlug: 'appliance-repair',
      recommendedSkills: ['general-maintenance', 'fault-inspection'],
      visualObservations: imageUrls.length > 0 ? 'Attached image uploaded for inspection.' : null,
    };
  }

  /**
   * Helper to retrieve preliminary matching active artisans
   */
  static async _queryPreliminaryArtisans({ categoryId, clientCoords, limit = 3 }) {
    try {
      const artisans = await prisma.artisanProfile.findMany({
        where: {
          isAvailable: true,
          user: { status: 'ACTIVE' },
          ...(categoryId
            ? {
                skills: {
                  some: {
                    skill: {
                      categoryId,
                    },
                  },
                },
              }
            : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
              isKycVerified: true,
            },
          },
          skills: {
            include: { skill: true },
          },
        },
        take: limit,
      });

      return artisans.map((artisan) => {
        let distanceKm = 5.2; // default simulated distance
        if (clientCoords?.latitude && clientCoords?.longitude && artisan.latitude && artisan.longitude) {
          const lat1 = Number(clientCoords.latitude);
          const lon1 = Number(clientCoords.longitude);
          const lat2 = Number(artisan.latitude);
          const lon2 = Number(artisan.longitude);
          const R = 6371;
          const dLat = (lat2 - lat1) * (Math.PI / 180);
          const dLon = (lon2 - lon1) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceKm = Math.round(R * c * 10) / 10;
        }

        return {
          id: artisan.id,
          name: artisan.businessName || `${artisan.firstName || ''} ${artisan.lastName || ''}`.trim() || 'Verified Artisan',
          avatarUrl: artisan.user.avatarUrl,
          rating: Number(artisan.ratingAvg) || 4.8,
          reviewCount: artisan.reviewCount,
          completedJobs: artisan.completedJobsCount,
          kycVerified: Boolean(artisan.user.isKycVerified),
          distanceKm,
          state: artisan.state,
          lgaCity: artisan.lgaCity,
        };
      });
    } catch (err) {
      console.warn('Could not query preliminary artisans:', err.message);
      return [];
    }
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
   * Submit interactive clarification answer to refine diagnostic context
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.answer
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

    // Re-evaluate 5-pillar matches with refined diagnostic context
    const refinedMatches = await MatchingEngineService.findTopMatches({
      diagnosticSessionId: sessionId,
      categoryId: updatedSession.matchedCategoryId,
      clientLat: updatedSession.clientLatitude,
      clientLng: updatedSession.clientLongitude,
      limit: 3,
    });

    return {
      session: updatedSession,
      matchedArtisans: refinedMatches,
      clarificationConfirmed: true,
    };
  }

  /**
   * Retrieve or regenerate personalized artisan audio script
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} [params.artisanName='Specialist']
   */
  static async getArtisanAudioScript({ sessionId, artisanName = 'Specialist' }) {
    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found.');
    }

    const script = TranscriptionService.generateArtisanAudioScript({
      session,
      artisanName,
    });

    return {
      sessionId,
      artisanName,
      audioScript: script,
      targetDurationSecs: 25,
      language: 'Nigerian English & Trade Vernacular',
    };
  }

  /**
   * Process a follow-up chat message in a diagnostic session.
   * Handles multi-turn conversational dialog and detects if client insists on hiring an artisan.
   * Supports multimodal vision inspection of session/chat photos and voice note audio transcription.
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
    if (!sessionId) {
      throw ApiError.badRequest('Session ID is required for chat messaging.');
    }
    if (!userMessage?.trim() && (!newImageUrls || newImageUrls.length === 0) && !voiceAudioBuffer) {
      throw ApiError.badRequest('User message or media attachment cannot be empty.');
    }

    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: { category: true, mediaFiles: true },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found.');
    }

    // Transcribe attached voice note if provided in chat
    let transcribedVoiceText = null;
    if (voiceAudioBuffer) {
      try {
        const audioResult = await TranscriptionService.transcribeAudioBuffer({
          audioBuffer: voiceAudioBuffer,
          mimeType: voiceMimeType,
        });
        if (audioResult?.technicalSummary) {
          transcribedVoiceText = audioResult.technicalSummary;
        }
      } catch (err) {
        console.warn('⚠️ Voice transcription failed in chat follow-up:', err.message);
      }
    }

    // Formulate effective user query
    let effectiveUserMessage = userMessage?.trim() || '';
    if (transcribedVoiceText) {
      effectiveUserMessage = [
        effectiveUserMessage ? `User typed: ${effectiveUserMessage}` : '',
        `Voice note: ${transcribedVoiceText}`,
      ]
        .filter(Boolean)
        .join('\n');
    }
    if (!effectiveUserMessage && newImageUrls.length > 0) {
      effectiveUserMessage = 'Please inspect the fault shown in these attached photos and advise me.';
    }

    const lower = effectiveUserMessage.toLowerCase().trim();

    // Collect all active inspection images (newly uploaded + existing session photos, max 4)
    const sessionImages = (session.mediaFiles || []).map((m) => m.mediaUrl).filter(Boolean);
    const activeVisionImages = Array.from(new Set([...newImageUrls, ...sessionImages])).slice(0, 4);

    // Detect if the user is asking to match/hire an artisan
    const artisanIntentWords = [
      'artisan',
      'plumber',
      'electrician',
      'carpenter',
      'technician',
      'mechanic',
      'painter',
      'professional',
      'expert',
      'hire',
      'find me',
      'match me',
      'send someone',
      'book',
      'fix it for me',
      'come fix',
      'do it for me',
      'i insist',
      'give me someone',
    ];

    const insistsOnArtisan = artisanIntentWords.some((word) => lower.includes(word));

    if (insistsOnArtisan) {
      // Find top matches via 5-Pillar Matching Engine
      const coords =
        clientCoords ||
        (session.clientLatitude && session.clientLongitude
          ? { latitude: session.clientLatitude, longitude: session.clientLongitude }
          : null);

      const matchedArtisans = await MatchingEngineService.findTopMatches({
        diagnosticSessionId: sessionId,
        categoryId: session.matchedCategoryId,
        clientLat: coords?.latitude || null,
        clientLng: coords?.longitude || null,
        limit: 3,
      });

      return {
        reply:
          "Understood! Since you'd prefer an expert to handle this, I've matched you with our top-rated, KYC-verified specialists nearby. You can view their profiles and book them with escrow protection below:",
        intent: 'MATCH_ARTISANS',
        matchedArtisans,
        diyRecommended: false,
      };
    }

    // Dynamic Conversational response via OpenAI GPT-4o with Full Multimodal Vision
    if (openaiClient) {
      try {
        const systemPrompt = `You are a master artisan and professional home services consultant on Artifix, with 15+ years of practical experience across electrical, plumbing, generator, HVAC, carpentry, masonry, and home repair trades.

YOUR PERSONA & SPEAKING STYLE:
- Speak naturally, warmly, and pragmatically like an experienced, trusted Nigerian/West African artisan and trade consultant having a real dialogue.
- Answer whatever the visitor asks directly with practical, hands-on field experience.
- When photos or images of the fault are provided, actively examine the equipment, fittings, wiring, or physical damage in the images and reference concrete visual details in your diagnosis.
- If there's need for clarification to narrow down the problem, ask 1-2 sharp troubleshooting questions.
- NO robotic forms or rigid tools lists unless they specifically ask.
- If the visitor wants someone to come fix it or says they can't do it, let them know you'll match them with a verified specialist right away.
- Keep the response engaging, conversational, and real, formatted in clean markdown.

Context of the current issue being discussed:
- Issue: ${session.diagnosticTitle || 'Home repair'}
- Probable Cause: ${session.probableCause || 'Under inspection'}
- Severity: ${session.severity}
- Category: ${session.category?.name || 'General trade'}
- Photos Attached: ${activeVisionImages.length > 0 ? `${activeVisionImages.length} inspection photo(s) available` : 'None'}`;

        const formattedHistory = (conversationHistory || []).map((m) => ({
          role: m.sender === 'user' || m.role === 'user' ? 'user' : 'assistant',
          content: m.text || m.content || '',
        }));

        // Build multimodal content block if vision images are available
        const userContent = activeVisionImages.length > 0
          ? [
              { type: 'text', text: effectiveUserMessage },
              ...activeVisionImages.map((url) => ({
                type: 'image_url',
                image_url: { url },
              })),
            ]
          : effectiveUserMessage;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...formattedHistory,
          { role: 'user', content: userContent },
        ];

        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-4o',
          messages,
          temperature: 0.7,
        });

        const reply = completion.choices[0].message.content.trim();

        return {
          reply,
          intent: 'CONVERSATIONAL',
          matchedArtisans: [],
          diyRecommended: session.diyAllowed,
        };
      } catch (err) {
        console.warn('⚠️ OpenAI chat follow-up error:', err.message);
      }
    }

    // Conversational follow-up advice fallback via Gemini
    if (geminiClient) {
      try {
        const conversationPrompt = `
You are the Artifix Master Artisan Consultant assisting a client.
Context:
- Diagnosis: ${session.diagnosticTitle}
- Probable Cause: ${session.probableCause}
- Severity: ${session.severity}
- DIY Allowed: ${session.diyAllowed}

Client Question: "${effectiveUserMessage}"

Provide a natural, conversational, practical response directly answering their question and asking clarifying questions if needed.
`;
        const response = await geminiClient.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ text: conversationPrompt }],
          config: { temperature: 0.4 },
        });

        return {
          reply: response.text.trim(),
          intent: 'CONVERSATIONAL',
          matchedArtisans: [],
          diyRecommended: session.diyAllowed,
        };
      } catch (err) {
        console.warn('⚠️ Gemini chat follow-up error:', err.message);
      }
    }

    // Heuristic fallback for conversational response
    let reply =
      "Make sure the area is completely powered down or water is turned off before touching any fitting. Most standard replacement parts can be sourced from your nearest electrical or plumbing hardware merchant.";

    if (lower.includes('where') || lower.includes('buy') || lower.includes('store') || lower.includes('market')) {
      reply =
        'You can purchase standard replacement fittings and parts at any local building material market (such as Odunade, Alaba, or neighborhood hardware stores). Always take the faulty part along as a sample for exact fitting.';
    } else if (lower.includes('tool') || lower.includes('equipment') || lower.includes('need')) {
      reply =
        'For this repair, standard household tools like an adjustable wrench, flathead screwdriver, and Teflon sealant tape are typically sufficient. Ensure hands are dry and the area is well-lit.';
    } else if (lower.includes('safe') || lower.includes('danger') || lower.includes('hazard')) {
      reply =
        'Safety first: always isolate the main circuit breaker or stopcock valve. If you ever feel unsure or encounter live voltage, let me know and I will instantly connect you with a verified specialist.';
    }

    return {
      reply,
      intent: 'CONVERSATIONAL',
      matchedArtisans: [],
      diyRecommended: session.diyAllowed,
    };
  }
}
