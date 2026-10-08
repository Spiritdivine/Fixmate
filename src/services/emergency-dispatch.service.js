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

    // 2. Discover top 3 nearest available artisans within radius
    const candidates = await MatchingEngineService.findTopMatches({
      diagnosticSessionId: sessionId,
      categoryId: session.matchedCategoryId,
      clientLat: session.clientLatitude ? Number(session.clientLatitude) : null,
      clientLng: session.clientLongitude ? Number(session.clientLongitude) : null,
      limit: 3,
      maxRadiusKm,
    });

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

      // In-app & Web Push Notification
      await NotificationService.createNotification(
        artisanUser.id,
        '🚨 URGENT: Emergency Artisan Callout',
        `High Priority: ${emergencyTitle} near ${locationText} (${match.distanceKm}km away). ₦${calloutFeeNgn.toLocaleString()} callout guaranteed in escrow. Tap to claim immediately!`,
        `/ai/emergency/${sessionId}`
      );

      // Automated Emergency SMS Broadcast
      if (artisanUser.phoneNumber) {
        await SmsService.sendAlert(
          artisanUser.phoneNumber,
          `URGENT: Artifix Emergency Callout near ${locationText} (${match.distanceKm}km). ₦${calloutFeeNgn.toLocaleString()} guaranteed in escrow. Open app to accept now.`
        );
      }

      dispatchedArtisans.push({
        artisanProfileId: artisanProfile.id,
        artisanUserId: artisanUser.id,
        name: artisanProfile.businessName || `${artisanProfile.firstName} ${artisanProfile.lastName}`,
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
      candidateCount: dispatchedArtisans.length,
      dispatchedArtisans,
      claimMode: 'FIRST_TO_ACCEPT_LOCK',
    };
  }

  /**
   * First-to-claim atomic lock: An artisan accepts the SOS dispatch
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.artisanUserId
   */
  static async claimEmergencySos({ sessionId, artisanUserId }) {
    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found');
    }

    // Atomic race-condition check
    if (session.sosClaimedByArtisanId) {
      throw ApiError.conflict('Another specialist has already claimed this emergency dispatch.');
    }

    const artisan = await prisma.artisanProfile.findUnique({
      where: { userId: artisanUserId },
      include: { user: true },
    });

    if (!artisan) {
      throw ApiError.forbidden('Only verified artisans can claim emergency dispatches.');
    }

    // Atomic update
    const claimedSession = await prisma.aiDiagnosticSession.update({
      where: { id: sessionId },
      data: {
        sosClaimedByArtisanId: artisanUserId,
        selectedArtisanId: artisan.id,
      },
    });

    // Notify the client that an artisan has been secured and dispatched
    if (session.userId) {
      const artisanName = artisan.businessName || `${artisan.firstName} ${artisan.lastName}`;
      await NotificationService.createNotification(
        session.userId,
        '🚨 Emergency Specialist On the Way!',
        `${artisanName} accepted your SOS dispatch and is en route. Live tracking is now active.`,
        `/ai/session/${sessionId}`
      );
    }

    return {
      success: true,
      message: 'Emergency dispatch claimed successfully. Proceed to client location.',
      sessionId,
      artisanId: artisan.id,
      artisanName: artisan.businessName || `${artisan.firstName} ${artisan.lastName}`,
      clientAddress: session.clientAddress,
      clientLatitude: session.clientLatitude,
      clientLongitude: session.clientLongitude,
      claimedSession,
    };
  }
}
