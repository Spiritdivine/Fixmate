import crypto from 'crypto';
import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';

export class DiagnosticStateService {
  static hashGuestToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static createGuestToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  static async assertAccess({ sessionId, userId = null, guestToken = null }) {
    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: { category: true, mediaFiles: true },
    });
    if (!session) throw ApiError.notFound('Diagnostic session not found.');
    if (session.userId) {
      if (!userId || session.userId !== userId) throw ApiError.forbidden('You do not have access to this diagnostic session.');
      return session;
    }
    if (!guestToken || session.clientSessionToken !== this.hashGuestToken(guestToken)) {
      throw ApiError.forbidden('A valid diagnostic session token is required.');
    }
    return session;
  }

  static initialState() {
    return { status: 'INFORMATION_GATHERING', confirmedFacts: [], hypotheses: [], missingInformation: [], lastQuestion: null };
  }

  static mergeState(previous = {}, response = {}) {
    return {
      status: response.status || previous.status || 'INFORMATION_GATHERING',
      confirmedFacts: [...new Set([...(previous.confirmedFacts || []), ...(response.confirmedFacts || [])])].slice(-30),
      hypotheses: (response.hypotheses || previous.hypotheses || []).slice(0, 6),
      missingInformation: (response.missingInformation || previous.missingInformation || []).slice(0, 8),
      lastQuestion: response.nextQuestion || null,
    };
  }

  static buildSummary(state) {
    const facts = (state.confirmedFacts || []).slice(-8).join('; ');
    const missing = (state.missingInformation || []).slice(0, 4).join('; ');
    return [facts && `Known: ${facts}`, missing && `Still needed: ${missing}`].filter(Boolean).join(' | ').slice(0, 3000);
  }
}
