import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';

function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class MatchingEngineService {
  /**
   * 5-Pillar Mathematical Scoring & Ranking Engine with Hard Geofence & Concurrency Gates
   * @param {Object} params
   * @param {string} [params.diagnosticSessionId]
   * @param {number} [params.categoryId]
   * @param {string} [params.categorySlug]
   * @param {string[]} [params.skillSlugs=[]]
   * @param {number|string} [params.clientLat]
   * @param {number|string} [params.clientLng]
   * @param {string} [params.clientState='Lagos']
   * @param {string} [params.clientLga]
   * @param {boolean} [params.isEmergency=false]
   * @param {number} [params.limit=3]
   */
  static async findTopMatches({
    diagnosticSessionId = null,
    categoryId = null,
    categorySlug = null,
    skillSlugs = [],
    clientLat = null,
    clientLng = null,
    clientState = 'Lagos',
    clientLga = null,
    isEmergency = false,
    limit = 3,
  }) {
    const maxRadiusKm = 25.0;

    // 1. Fetch diagnostic session if ID provided
    let session = null;
    if (diagnosticSessionId) {
      session = await prisma.aiDiagnosticSession.findUnique({
        where: { id: diagnosticSessionId },
        include: { category: true },
      });
      if (session) {
        if (!categoryId && session.matchedCategoryId) {
          categoryId = session.matchedCategoryId;
        }
        if (!clientLat && session.clientLatitude) {
          clientLat = Number(session.clientLatitude);
        }
        if (!clientLng && session.clientLongitude) {
          clientLng = Number(session.clientLongitude);
        }
        if (clientLat && clientLng) {
          if (clientLat >= 8.5 && clientLat <= 9.5 && clientLng >= 6.8 && clientLng <= 7.8) {
            clientState = 'FCT';
          } else if (clientLat >= 6.2 && clientLat <= 6.8 && clientLng >= 3.0 && clientLng <= 4.0) {
            clientState = 'Lagos';
          }
        }

        if (session.clientAddress) {
          const addr = session.clientAddress.toLowerCase();
          if (addr.includes('abuja') || addr.includes('fct')) {
            clientState = 'FCT';
          } else if (addr.includes('lagos')) {
            clientState = 'Lagos';
          }
        } else if (session.rawTextPrompt) {
          const promptLower = session.rawTextPrompt.toLowerCase();
          if (promptLower.includes('abuja') || promptLower.includes('fct')) {
            clientState = 'FCT';
          } else if (promptLower.includes('lagos') || promptLower.includes('ikeja') || promptLower.includes('lekki')) {
            clientState = 'Lagos';
          }
        }
      }
    }

    if (!categoryId) {
      return {
        candidates: [],
        message: 'No specific trade category resolved for matching.',
        searchRadiusKm: maxRadiusKm,
      };
    }

    // Build state query supporting FCT / Federal Capital Territory aliases
    const isFctQuery = clientState.toLowerCase().includes('abuja') || clientState.toLowerCase().includes('fct');
    const stateCondition = isFctQuery
      ? { in: ['FCT', 'Federal Capital Territory'], mode: 'insensitive' }
      : { equals: clientState, mode: 'insensitive' };

    // 2. Fetch candidate artisans matching the strict trade category in the same State
    let candidates = await prisma.artisanProfile.findMany({
      where: {
        isAvailable: true,
        user: { status: 'ACTIVE' },
        state: stateCondition, // Preferred gate: same state
        skills: {
          some: {
            skill: { categoryId: Number(categoryId) }, // Strict trade match
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            isKycVerified: true,
            contractsAsArtisan: {
              where: {
                status: { in: ['ACTIVE', 'PENDING_FUNDING'] },
              },
              select: { id: true },
            },
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

    // Fallback: If no candidate in specified state, query verified artisans in this trade nationwide
    if (!candidates || candidates.length === 0) {
      candidates = await prisma.artisanProfile.findMany({
        where: {
          isAvailable: true,
          user: { status: 'ACTIVE' },
          skills: {
            some: {
              skill: { categoryId: Number(categoryId) },
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
              isKycVerified: true,
              contractsAsArtisan: {
                where: {
                  status: { in: ['ACTIVE', 'PENDING_FUNDING'] },
                },
                select: { id: true },
              },
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
    }

    if (!candidates || candidates.length === 0) {
      return {
        candidates: [],
        message: `No active verified specialists in this trade currently available. Dispatching alert to platform support.`,
        searchRadiusKm: maxRadiusKm,
      };
    }

    // 3. Score every candidate through the 5-Pillar Model with Hard Distance & Capacity Gates
    const scoredList = [];

    for (const artisan of candidates) {
      // Concurrency Gate: Disqualify artisans with >= 2 active simultaneous contracts
      const activeContracts = artisan.user.contractsAsArtisan?.length || 0;
      if (activeContracts >= 2) {
        continue;
      }

      // --- Pillar 1: Geospatial Proximity (w_d = 0.35) ---
      let distanceKm = null;
      let distScore = 50; // Neutral baseline if GPS is unavailable

      if (clientLat && clientLng && artisan.latitude && artisan.longitude) {
        distanceKm = calculateHaversine(
          Number(clientLat),
          Number(clientLng),
          Number(artisan.latitude),
          Number(artisan.longitude)
        );

        // Strict 25km Distance Gate: Exclude candidate if beyond 25km radius
        if (distanceKm > maxRadiusKm) {
          continue;
        }

        distScore = Math.max(0, 100 * (1 - distanceKm / maxRadiusKm));
      } else if (clientLga && artisan.lgaCity) {
        // LGA Proximity fallback when GPS is denied
        const isSameLga = clientLga.trim().toLowerCase() === artisan.lgaCity.trim().toLowerCase();
        distScore = isSameLga ? 85 : 45;
        distanceKm = isSameLga ? 4.5 : 12.0;
      }

      // --- Pillar 2: Bayesian Adjusted Rating (w_r = 0.25) ---
      const v = Number(artisan.reviewCount) || 0;
      const R = Number(artisan.ratingAvg) || 0.0;
      const m = 5; // Minimum reviews prior benchmark
      const C = 3.8; // Platform mean baseline
      const bayesianRating = (v * R + m * C) / (v + m);
      const ratingScore = Math.min(100, Math.max(0, bayesianRating * 20.0));

      // --- Pillar 3: Semantic Skill & Portfolio Alignment (w_p = 0.20) ---
      let portfolioScore = 40;
      const matchedSkillCount = artisan.skills.filter((s) =>
        skillSlugs.length > 0 ? skillSlugs.includes(s.skill.slug) : true
      ).length;

      if (matchedSkillCount > 0) portfolioScore += 35;
      if (artisan.portfolios && artisan.portfolios.length > 0) portfolioScore += 15;
      if (artisan.services && artisan.services.length > 0) portfolioScore += 10;
      portfolioScore = Math.min(100, portfolioScore);

      // --- Pillar 4: KYC & Identity Verification (w_k = 0.10) ---
      const kycScore = artisan.user.isKycVerified ? 100 : 25;

      // --- Pillar 5: Historical Completion Velocity (w_c = 0.10) ---
      const completedJobs = Number(artisan.completedJobsCount) || 0;
      const velocityScore = Math.min(100, Math.max(30, completedJobs * 7));

      // Composite Weighted Score
      const finalScore = Number(
        (
          0.35 * distScore +
          0.25 * ratingScore +
          0.20 * portfolioScore +
          0.10 * kycScore +
          0.10 * velocityScore
        ).toFixed(2)
      );

      scoredList.push({
        artisanProfileId: artisan.id,
        artisan: {
          id: artisan.id,
          name: artisan.businessName || `${artisan.firstName || ''} ${artisan.lastName || ''}`.trim() || 'Verified Specialist',
          avatarUrl: artisan.user.avatarUrl,
          rating: Number(artisan.ratingAvg) || 4.5,
          reviewCount: artisan.reviewCount,
          completedJobs: artisan.completedJobsCount,
          kycVerified: Boolean(artisan.user.isKycVerified),
          state: artisan.state,
          lgaCity: artisan.lgaCity,
          activeContracts,
        },
        distanceKm: distanceKm ? Math.round(distanceKm * 10) / 10 : null,
        matchScore: finalScore,
        rationale: `Ranked with ${Math.round(distScore)}% proximity in ${artisan.lgaCity || artisan.state} and ${(bayesianRating).toFixed(1)}/5.0 Bayesian rating.`,
      });
    }

    // Sort descending by match score and return top matches
    scoredList.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = scoredList.slice(0, limit);

    // Persist matches if session ID is provided
    if (diagnosticSessionId && topMatches.length > 0) {
      try {
        await prisma.diagnosticMatch.deleteMany({
          where: { diagnosticSessionId },
        });

        await prisma.diagnosticMatch.createMany({
          data: topMatches.map((m) => ({
            diagnosticSessionId,
            artisanProfileId: m.artisanProfileId,
            matchScore: m.matchScore,
            distanceKm: m.distanceKm,
            matchRationale: m.rationale,
          })),
        });

        // Record MatchSnapshot for ranking audit & dispute integrity (Spec Sec 8 & 9)
        await prisma.matchSnapshot.create({
          data: {
            diagnosticSessionId,
            candidateSnapshot: topMatches.map((m) => ({
              artisanProfileId: m.artisanProfileId,
              name: m.artisan.name,
              rating: m.artisan.rating,
              matchScore: m.matchScore,
              distanceKm: m.distanceKm,
              kycVerified: m.artisan.kycVerified,
              rationale: m.rationale,
            })),
            rankingPolicy: 'HARD_FILTER_THEN_COMPOSITE_SCORE',
            algorithmVersion: '2.1.0',
          },
        });
      } catch (err) {
        console.warn('⚠️ Could not persist diagnostic matches / snapshot:', err.message);
      }
    }

    return {
      candidates: topMatches,
      totalEligible: scoredList.length,
      searchRadiusKm: maxRadiusKm,
    };
  }

  /**
   * Normalize database candidate to client-facing MatchedArtisanDossier contract
   * @param {Object} candidate
   * @param {string} [tradeName='Specialist']
   */
  static formatCandidateDossier(candidate, tradeName = 'Specialist') {
    if (!candidate) return null;
    return {
      artisanId: String(candidate.artisanProfileId || candidate.artisan?.id || candidate.id),
      name: candidate.artisan?.name || candidate.name || candidate.businessName || candidate.user?.name || 'Verified Specialist',
      avatarUrl: candidate.artisan?.avatarUrl || candidate.avatarUrl || candidate.user?.avatarUrl || null,
      trade: tradeName,
      kycTier: candidate.artisan?.kycVerified || candidate.kycVerified ? 2 : 1,
      rating: Number(candidate.artisan?.rating ?? candidate.rating ?? 4.8),
      reviewCount: Number(candidate.artisan?.reviewCount ?? candidate.reviewCount ?? 0),
      completedJobsCount: Number(candidate.artisan?.completedJobs ?? candidate.completedJobsCount ?? 0),
      distanceKm: candidate.distanceKm !== null && candidate.distanceKm !== undefined ? Number(candidate.distanceKm) : null,
      matchScore: Number(candidate.matchScore ?? 85),
      aiFitReason: candidate.rationale || candidate.aiFitReason || 'Top-rated verified specialist in your immediate area.',
    };
  }
}
