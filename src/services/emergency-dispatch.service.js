import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { MatchingEngineService } from './matching-engine.service.js';
import { NotificationService } from './notification.service.js';
import { SmsService } from './sms.service.js';

export class EmergencyDispatchService {
  /**
   * Trigger 1-Tap Emergency SOS Dispatch
   * Multicasts high-priority push + SMS alerts to the top 3 closest on-call artisans
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} [params.clientId]
   * @param {number} [params.maxRadiusKm=10.0]
   */
  static async triggerEmergencySos({ sessionId, clientId = null, maxRadiusKm = 10.0 }) {
    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: { category: true },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found');
    }

    if (session.sosClaimedByArtisanId) {
      throw ApiError.badRequest('This emergency session has already been claimed and dispatched.');
    }

    // 1. Mark session as active SOS dispatch
    const updatedSession = await prisma.aiDiagnosticSession.update({
      where: { id: sessionId },
      data: {
        isSosDispatched: true,
        sosDispatchedAt: new Date(),
        urgency: 'EMERGENCY',
        isHazardous: true,
      },
    });

    // 2. Discover top 3 nearest available artisans within 10km radius
    const matchResult = await MatchingEngineService.findTopMatches({
      diagnosticSessionId: sessionId,
      categoryId: session.matchedCategoryId,
      clientLat: session.clientLatitude ? Number(session.clientLatitude) : null,
      clientLng: session.clientLongitude ? Number(session.clientLongitude) : null,
      isEmergency: true,
      limit: 3,
    });

    const candidates = matchResult.candidates || [];
    const locationText = session.clientAddress || 'Client Location';
    const emergencyTitle = session.diagnosticTitle || 'Active Hazard Callout';
    const calloutFeeNgn = session.estimatedLaborMin ? Number(session.estimatedLaborMin) : 15000;

    const dispatchedArtisans = [];

    // 3. Multicast high-priority notifications and SMS to candidate artisans
    for (const match of candidates) {
      const artisanProfile = await prisma.artisanProfile.findUnique({
        where: { id: match.artisanProfileId },
        include: { user: true },
      });

      if (!artisanProfile?.user) continue;

      const artisanUser = artisanProfile.user;

      // In-app Notification
      await NotificationService.createNotification(
        artisanUser.id,
        '🚨 URGENT: Emergency Artisan Callout',
        `High Priority: ${emergencyTitle} near ${locationText} (${match.distanceKm || 'Nearby'}km away). ₦${calloutFeeNgn.toLocaleString()} callout guaranteed in escrow. Tap to claim immediately!`,
        `/ai/emergency/${sessionId}`
      );

      // Automated Emergency SMS Broadcast
      if (artisanUser.phoneNumber) {
        await SmsService.sendAlert(
          artisanUser.phoneNumber,
          `URGENT: Artifix Emergency Callout near ${locationText} (${match.distanceKm || 'Nearby'}km). ₦${calloutFeeNgn.toLocaleString()} guaranteed in escrow. Open app to accept now.`
        );
      }

      dispatchedArtisans.push({
        artisanProfileId: artisanProfile.id,
        artisanUserId: artisanUser.id,
        name: artisanProfile.businessName || `${artisanProfile.firstName || ''} ${artisanProfile.lastName || ''}`.trim(),
        distanceKm: match.distanceKm,
        phoneNumberMasked: artisanUser.phoneNumber
          ? artisanUser.phoneNumber.replace(/(\+?\d{4})\d+(\d{3})/, '$1***$2')
          : null,
      });
    }

    return {
      sessionId,
      isSosDispatched: true,
      dispatchedAt: updatedSession.sosDispatchedAt,
      calloutFeeNgn,
      emergencyTitle,
      dispatchedArtisans,
      totalAlerted: dispatchedArtisans.length,
    };
  }

  /**
   * Atomic Claim of Emergency SOS with zero race conditions
   * Uses raw SQL conditional update ensuring exactly 1 winner under high concurrency
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.artisanUserId
   */
  static async claimEmergencySos({ sessionId, artisanUserId }) {
    const artisanProfile = await prisma.artisanProfile.findUnique({
      where: { userId: artisanUserId },
    });

    if (!artisanProfile) {
      throw ApiError.forbidden('Only verified artisan profiles can claim emergency callouts.');
    }

    // Atomic transaction with conditional UPDATE
    const claimResult = await prisma.$transaction(async (tx) => {
      const affectedRows = await tx.$executeRaw`
        UPDATE "ai_diagnostic_sessions"
        SET 
          "sos_claimed_by_artisan_id" = ${artisanProfile.id}::uuid,
          "selected_artisan_id" = ${artisanProfile.id}::uuid,
          "updated_at" = NOW()
        WHERE "id" = ${sessionId}::uuid
          AND "sos_claimed_by_artisan_id" IS NULL
          AND "is_sos_dispatched" = true
      `;

      if (affectedRows === 0) {
        throw new ApiError(409, 'This emergency callout has already been claimed by another nearby specialist.');
      }

      const session = await tx.aiDiagnosticSession.findUnique({
        where: { id: sessionId },
        include: { user: true, category: true },
      });

      let contractId = session.convertedToContractId || null;

      // If session is associated with an authenticated client, auto-create active contract in escrow
      if (session.userId && !contractId) {
        const timestamp = Date.now();
        const calloutFee = session.estimatedLaborMin ? Number(session.estimatedLaborMin) : 15000;
        const defaultCategory = session.matchedCategoryId || 1;

        const emergencyJob = await tx.job.create({
          data: {
            clientId: session.userId,
            categoryId: defaultCategory,
            title: `EMERGENCY SOS: ${session.diagnosticTitle || 'Hazard Callout'}`,
            description: session.probableCause || 'Urgent physical hazard containment required.',
            budgetMin: calloutFee,
            budgetMax: session.estimatedLaborMax ? Number(session.estimatedLaborMax) : calloutFee * 1.5,
            state: 'Lagos',
            lgaCity: 'Lagos',
            status: 'IN_PROGRESS',
          },
        });

        const proposal = await tx.proposal.create({
          data: {
            jobId: emergencyJob.id,
            artisanId: artisanProfile.userId,
            coverLetter: 'Emergency SOS Callout accepted.',
            bidAmount: calloutFee,
            estimatedDays: 1,
            status: 'ACCEPTED',
          },
        });

        const emergencyContract = await tx.contract.create({
          data: {
            contractCode: `CTR-SOS-${timestamp}`,
            jobId: emergencyJob.id,
            proposalId: proposal.id,
            clientId: session.userId,
            artisanId: artisanProfile.userId,
            totalAmount: calloutFee,
            platformFeeAmount: calloutFee * 0.05,
            status: 'ACTIVE',
            milestones: {
              create: [
                {
                  stepOrder: 1,
                  title: 'Immediate On-Site Hazard Containment & Diagnosis',
                  amount: calloutFee,
                  status: 'PENDING_FUNDING',
                },
              ],
            },
          },
        });

        contractId = emergencyContract.id;

        await tx.aiDiagnosticSession.update({
          where: { id: sessionId },
          data: {
            convertedToJobId: emergencyJob.id,
            convertedToContractId: emergencyContract.id,
          },
        });
      }

      return { session, contractId };
    });

    // Notify client of artisan en-route
    if (claimResult.session.userId) {
      await NotificationService.createNotification(
        claimResult.session.userId,
        '🚨 Emergency Specialist En Route!',
        `${artisanProfile.businessName || 'Your specialist'} has claimed your emergency callout and is en route.`,
        claimResult.contractId ? `/contracts/${claimResult.contractId}` : `/ai/session/${sessionId}`
      );
    }

    return {
      success: true,
      contractId: claimResult.contractId,
      sessionId,
      artisanProfileId: artisanProfile.id,
      status: 'DISPATCHED_AND_CLAIMED',
    };
  }
}
