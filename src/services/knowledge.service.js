import prisma from '../config/db.js';

export class KnowledgeService {
  /**
   * Retrieve approved trade standards and safety regulations by trade name
   */
  static async getRegulationsByTrade(trade) {
    if (!trade) return [];
    
    return prisma.knowledgeSource.findMany({
      where: {
        trade: { equals: trade, mode: 'insensitive' },
        status: 'APPROVED',
      },
      orderBy: { riskLevel: 'desc' },
    });
  }

  /**
   * Search knowledge sources relevant to a diagnostic inquiry
   */
  static async searchRelevantCodes(query) {
    if (!query) return [];
    const tokens = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (tokens.length === 0) return [];

    return prisma.knowledgeSource.findMany({
      where: {
        status: 'APPROVED',
        OR: tokens.map((token) => ({
          content: { contains: token, mode: 'insensitive' },
        })),
      },
      take: 5,
    });
  }

  /**
   * Retrieve all knowledge sources
   */
  static async listAll() {
    return prisma.knowledgeSource.findMany({
      where: { status: 'APPROVED' },
      orderBy: { trade: 'asc' },
    });
  }
}

export default KnowledgeService;
