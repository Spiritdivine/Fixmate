import prisma from '../config/db.js';

export class GuestSessionLinker {
  /**
   * Re-associate an anonymous guest session with a newly logged-in / registered user
   * @param {Object} params
   * @param {string} params.clientSessionToken - Guest token from localStorage / cookie
   * @param {string} params.authenticatedUserId - UUID of authenticated User
   * @returns {Promise<number>} count of linked sessions
   */
  static async linkGuestSession({ clientSessionToken, authenticatedUserId }) {
    if (!clientSessionToken || !authenticatedUserId) return 0;

    const result = await prisma.aiDiagnosticSession.updateMany({
      where: {
        clientSessionToken,
        userId: null,
      },
      data: {
        userId: authenticatedUserId,
      },
    });

    return result.count;
  }
}
