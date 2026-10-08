import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';

export class MatchingEngineService {
  /**
   * 5-Pillar Mathematical Scoring & Ranking Engine
   * @param {Object} params
   * @param {string} params.diagnosticSessionId
   * @param {number} [params.categoryId]
   * @param {string} [params.categorySlug]
   * @param {string[]} [params.skillSlugs=[]]
   * @param {number|string} [params.clientLat]
   * @param {number|string} [params.clientLng]
   * @param {number} [params.limit=3]
   * @param {number} [params.maxRadiusKm=25.0]
   */
  static async findTopMatches({
    diagnosticSessionId,
    categoryId = null,
    categorySlug = null,
    skillSlugs = [],
    clientLat = null,
    clientLng = null,
    limit = 3,
    maxRadiusKm = 25.0,
  }) {
    // 1. Fetch diagnostic session if ID provided
    let session = null;
    if (diagnosticSessionId) {
      session = await prisma.aiDiagnosticSession.findUnique({
        where: { id: diagnosticSessionId },
        include: { category: true, mediaFiles: true },
      });
      if (session) {
        if (!categoryId && session.matchedCategoryId) {
          categoryId = session.matchedCategoryId;
        }
        if (!clientLat && session.clientLatitude) {
          clientLat = session.clientLatitude;
        }
        if (!clientLng && session.clientLongitude) {
          clientLng = session.clientLongitude;
        }
      }
    }

    // 2. Fetch candidate artisans matching trade category
    let candidates = await prisma.artisanProfile.findMany({
      where: {
        isAvailable: true,
        user: { status: 'ACTIVE' },
        ...(categoryId
          ? {
              skills: {
                some: {
                  skill: { categoryId: Number(categoryId) },
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
        portfolios: {
          take: 3,
        },
        services: true,
      },
    });

    // Fallback: If no candidate matched the strict category filter, broaden to all active artisans
    if ((!candidates || candidates.length === 0) && categoryId) {
      candidates = await prisma.artisanProfile.findMany({
        where: {
          isAvailable: true,
          user: { status: 'ACTIVE' },
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
          portfolios: {
            take: 3,
          },
          services: true,
        },
        take: limit * 2,
      });
    }

    if (!candidates || candidates.length === 0) {
      return [];
    }

    // 3. Score every candidate through the 5-Pillar Model
    const scoredList = candidates.map((artisan) => {
      // --- Pillar 1: Geospatial Proximity Score (w_d = 0.35) ---
      let distanceKm = 6.5; // Baseline assumption if coordinates absent
      if (clientLat && clientLng && artisan.latitude && artisan.longitude) {
        distanceKm = calculateHaversine(
          Number(clientLat),
          Number(clientLng),
          Number(artisan.latitude),
          Number(artisan.longitude)
        );
      }
      const distScore = Math.max(0, 100 * (1 - distanceKm / maxRadiusKm));

      // --- Pillar 2: Bayesian Adjusted Rating Score (w_r = 0.25) ---
      const v = Number(artisan.reviewCount) || 0;
      const R = Number(artisan.ratingAvg) || 0.0;
      const m = 5; // Minimum reviews prior
      const C = 3.5; // Platform mean baseline
      const bayesianRating = (v * R + m * C) / (v + m);
      const ratingScore = Math.min(100, Math.max(0, bayesianRating * 20.0)); // 5.0 -> 100

      // --- Pillar 3: Semantic Portfolio / Skill Alignment (w_p = 0.20) ---
      let portfolioScore = 50; // default baseline
      const skillMatches = artisan.skills.filter((s) =>
        skillSlugs.length > 0 ? skillSlugs.includes(s.skill.slug) : true
      ).length;

      if (skillMatches > 0) portfolioScore += 25;
      if (artisan.portfolios && artisan.portfolios.length > 0) portfolioScore += 15;
      if (artisan.services && artisan.services.length > 0) portfolioScore += 10;
      portfolioScore = Math.min(100, portfolioScore);

      // --- Pillar 4: KYC & Identity Verification (w_k = 0.10) ---
      const kycScore = artisan.user.isKycVerified ? 100 : 30;

      // --- Pillar 5: Velocity & Reliability (w_v = 0.10) ---
      const jobs = Number(artisan.completedJobsCount) || 0;
      const velocityScore = Math.min(100, Math.round(100 * (jobs / (jobs + 2))));

      // --- Weighted Total Formulation ---
      const finalScore =
        0.35 * distScore +
        0.25 * ratingScore +
        0.20 * portfolioScore +
        0.10 * kycScore +
        0.10 * velocityScore;

      const roundedScore = Math.round(finalScore * 10) / 10;
      const roundedDistance = Math.round(distanceKm * 10) / 10;

      const rationale = `${roundedDistance} km away • ${artisan.ratingAvg}★ (${artisan.reviewCount} reviews) • ${artisan.completedJobsCount} jobs completed${
        artisan.user.isKycVerified ? ' • KYC Verified' : ''
      }`;

      return {
        artisanProfileId: artisan.id,
        artisan: {
          id: artisan.id,
          name: artisan.businessName || `${artisan.firstName || ''} ${artisan.lastName || ''}`.trim() || 'Verified Artisan',
          avatarUrl: artisan.user.avatarUrl,
          rating: Number(artisan.ratingAvg) || 4.8,
          reviewCount: artisan.reviewCount,
          completedJobs: artisan.completedJobsCount,
          kycVerified: Boolean(artisan.user.isKycVerified),
          state: artisan.state,
          lgaCity: artisan.lgaCity,
          hourlyRate: artisan.hourlyRate ? Number(artisan.hourlyRate) : null,
          skills: artisan.skills.map((s) => s.skill.name),
        },
        distanceKm: roundedDistance,
        matchScore: roundedScore,
        rationale,
      };
    });

    // 4. Sort Descending & slice top matches
    scoredList.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scoredList.slice(0, limit);

    // 5. Persist DiagnosticMatch records if session exists
    if (diagnosticSessionId) {
      // Clear previous match records for this session to keep idempotent
      await prisma.diagnosticMatch.deleteMany({
        where: { diagnosticSessionId },
      });

      await Promise.all(
        topMatches.map((m) =>
          prisma.diagnosticMatch.create({
            data: {
              diagnosticSessionId,
              artisanProfileId: m.artisanProfileId,
              matchScore: m.matchScore,
              distanceKm: m.distanceKm,
              matchRationale: m.rationale,
            },
          })
        )
      );
    }

    return topMatches;
  }

  /**
   * Compile standardized "Artisan Job Dossier" for arrival & prep
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.artisanProfileId
   */
  static async generateArtisanDossier({ sessionId, artisanProfileId }) {
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

    const artisan = await prisma.artisanProfile.findUnique({
      where: { id: artisanProfileId },
      include: {
        user: { select: { id: true, email: true, phoneNumber: true, avatarUrl: true } },
      },
    });

    if (!artisan) {
      throw ApiError.notFound('Artisan profile not found');
    }

    // Synthesize recommended tool kit based on category and skills
    const toolkits = {
      electrical: ['Digital Multimeter / Clamp Meter', 'Insulated Screwdrivers (1000V rated)', 'Wire Strippers', 'Phase Tester'],
      plumbing: ['Adjustable Pipe Wrench', 'Teflon Seal Tape', 'PPR Pipe Welder (if thermofusion needed)', 'Hacksaw & Pipe Cutter'],
      'hvac-refrigeration': ['Manifold Gauge Set (R410A/R22)', 'Capacitor Tester', 'Vacuum Pump', 'Refrigerant Leak Detector'],
      'generator-repair': ['Spark Plug Spanner (16/21mm)', 'Carburetor Cleaning Kit', 'Multimeter for AVR Voltage', 'Feeler Gauge'],
    };

    const categoryKey = session.category?.slug || 'general';
    const recommendedTools = toolkits[categoryKey] || ['Standard Artisan Hand Toolkit', 'Measuring Tape', 'Inspection Flashlight'];

    return {
      dossierId: `DOS-${session.id.slice(0, 8).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      jobOverview: {
        title: session.diagnosticTitle,
        probableCause: session.probableCause,
        severity: session.severity,
        urgency: session.urgency,
        category: session.category?.name || 'General Maintenance',
      },
      safetyAlerts: {
        isHazardous: session.isHazardous,
        instructions: session.safetyInstructions || [],
      },
      materialsAndTools: {
        partsToProcure: session.estimatedBOM || [],
        recommendedSpecialtyTools: recommendedTools,
      },
      financialGuidelines: {
        estimatedLaborMin: session.estimatedLaborMin ? Number(session.estimatedLaborMin) : 5000,
        estimatedLaborMax: session.estimatedLaborMax ? Number(session.estimatedLaborMax) : 15000,
        currency: session.currency || 'NGN',
        paymentRail: 'Monad USDC & Paystack Escrow Protected',
      },
      clientDetails: {
        address: session.clientAddress || 'Client Residence (Exact address revealed upon contract lock)',
        latitude: session.clientLatitude ? Number(session.clientLatitude) : null,
        longitude: session.clientLongitude ? Number(session.clientLongitude) : null,
      },
      mediaEvidence: session.mediaFiles.map((m) => m.mediaUrl),
      artisanAssigned: {
        id: artisan.id,
        businessName: artisan.businessName || `${artisan.firstName || ''} ${artisan.lastName || ''}`.trim(),
        phone: artisan.user.phoneNumber || null,
      },
    };
  }

  /**
   * 1-Click "Diagnosis to Job Draft" Conversion
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.userId - Client user ID
   * @param {string} [params.preferredArtisanId]
   * @param {string} [params.customNotes]
   */
  static async convertDiagnosisToJob({ sessionId, userId, preferredArtisanId = null, customNotes = '' }) {
    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: { category: true, mediaFiles: true },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found');
    }

    if (session.convertedToJobId) {
      const existingJob = await prisma.job.findUnique({
        where: { id: session.convertedToJobId },
      });
      if (existingJob) {
        return { job: existingJob, session, isAlreadyConverted: true };
      }
    }

    // Default category ID if not set
    let categoryId = session.matchedCategoryId;
    if (!categoryId) {
      const defaultCategory = await prisma.jobCategory.findFirst({ where: { isActive: true } });
      categoryId = defaultCategory ? defaultCategory.id : 1;
    }

    // Build comprehensive description
    const description = [
      `### AI Diagnostic Report: ${session.diagnosticTitle}`,
      `**Probable Root Cause:** ${session.probableCause}`,
      session.isHazardous ? `⚠️ **Hazard Warning:** ${session.safetyInstructions?.join('; ')}` : '',
      customNotes ? `\n**Client Additional Notes:** ${customNotes}` : '',
      `\n*Created seamlessly from Artifix Multimodal AI Diagnostic Copilot.*`,
    ]
      .filter(Boolean)
      .join('\n\n');

    // Create Job record
    const job = await prisma.job.create({
      data: {
        clientId: userId,
        categoryId,
        title: session.diagnosticTitle || 'Artisanal Repair Request',
        description,
        budgetType: 'FIXED',
        budgetMin: session.estimatedLaborMin ? Number(session.estimatedLaborMin) : 5000,
        budgetMax: session.estimatedLaborMax ? Number(session.estimatedLaborMax) : 15000,
        state: 'Lagos',
        lgaCity: 'Lekki Phase 1',
        address: session.clientAddress || null,
        latitude: session.clientLatitude ? Number(session.clientLatitude) : null,
        longitude: session.clientLongitude ? Number(session.clientLongitude) : null,
        status: 'OPEN',
        materialsProvidedBy: 'ARTISAN',
        completionProofReq: 'Completed repair photo with before/after comparison',
        attachments: {
          create: session.mediaFiles.map((m, idx) => ({
            fileUrl: m.mediaUrl,
            fileName: `diagnostic_photo_${idx + 1}.webp`,
            fileSizeBytes: BigInt(m.fileSize || 1024),
            mimeType: m.mediaType || 'image/webp',
          })),
        },
      },
      include: {
        category: true,
        attachments: true,
      },
    });

    // Link job back to session
    await prisma.aiDiagnosticSession.update({
      where: { id: sessionId },
      data: {
        convertedToJobId: job.id,
        selectedArtisanId: preferredArtisanId || null,
      },
    });

    // If preferred artisan specified, create invitation
    if (preferredArtisanId) {
      try {
        const artisanProfile = await prisma.artisanProfile.findUnique({
          where: { id: preferredArtisanId },
          select: { userId: true },
        });
        if (artisanProfile?.userId) {
          await prisma.jobInvitation.create({
            data: {
              jobId: job.id,
              artisanId: artisanProfile.userId,
              status: 'PENDING',
            },
          });
        }
      } catch (err) {
        console.warn('Could not create JobInvitation:', err.message);
      }
    }

    return { job, session, isAlreadyConverted: false };
  }
}

/**
 * Haversine formula to compute great-circle distance in kilometers
 */
function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
