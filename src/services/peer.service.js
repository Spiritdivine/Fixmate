import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class PeerService {
  /**
   * Get peer directory with proximity calculation and skill/trade filtering
   */
  static async getPeerDirectory(currentUserId, {
    search,
    trade,
    lat,
    lng,
    radius = 50,
    page = 1,
    limit = 30,
  } = {}) {
    const currentProfile = await prisma.artisanProfile.findUnique({
      where: { userId: currentUserId },
      select: { id: true, latitude: true, longitude: true, state: true, lgaCity: true },
    });

    const userLat = lat != null ? Number(lat) : (currentProfile?.latitude != null ? Number(currentProfile.latitude) : null);
    const userLng = lng != null ? Number(lng) : (currentProfile?.longitude != null ? Number(currentProfile.longitude) : null);

    const where = {
      ...(currentProfile ? { id: { not: currentProfile.id } } : {}),
      user: {
        status: 'ACTIVE',
      },
    };

    if (trade && trade !== 'All Peers' && trade !== 'All') {
      where.OR = [
        { tagline: { contains: trade, mode: 'insensitive' } },
        { businessName: { contains: trade, mode: 'insensitive' } },
        { skills: { some: { name: { contains: trade, mode: 'insensitive' } } } },
        { services: { some: { title: { contains: trade, mode: 'insensitive' } } } },
      ];
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { businessName: { contains: q, mode: 'insensitive' } },
            { tagline: { contains: q, mode: 'insensitive' } },
            { lgaCity: { contains: q, mode: 'insensitive' } },
            { state: { contains: q, mode: 'insensitive' } },
            { skills: { some: { name: { contains: q, mode: 'insensitive' } } } },
          ],
        },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [artisanProfiles, total] = await Promise.all([
      prisma.artisanProfile.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              kycSubmissions: {
                where: { status: 'APPROVED' },
                take: 1,
              },
            },
          },
          skills: {
            take: 3,
            select: { name: true },
          },
        },
        orderBy: [
          { isAvailable: 'desc' },
          { ratingAvg: 'desc' },
          { completedJobsCount: 'desc' },
        ],
      }),
      prisma.artisanProfile.count({ where }),
    ]);

    const peers = artisanProfiles.map((artisan) => {
      const artLat = artisan.latitude != null ? Number(artisan.latitude) : null;
      const artLng = artisan.longitude != null ? Number(artisan.longitude) : null;

      let distanceKm = 4.5; // fallback default
      if (userLat != null && userLng != null && artLat != null && artLng != null) {
        distanceKm = haversineDistanceKm(userLat, userLng, artLat, artLng) || 4.5;
      }

      const primaryTrade =
        artisan.skills?.[0]?.name ||
        artisan.tagline ||
        artisan.businessName ||
        'Certified Artisan';

      const fullName = [artisan.firstName, artisan.lastName].filter(Boolean).join(' ') ||
        artisan.businessName ||
        'Verified Artisan';

      const isKycVerified = (artisan.user?.kycSubmissions?.length || 0) > 0;

      return {
        id: artisan.id,
        userId: artisan.user.id,
        fullName,
        trade: primaryTrade,
        rating: Number(artisan.ratingAvg) || 5.0,
        completedJobs: artisan.completedJobsCount || 0,
        locationCity: [artisan.lgaCity, artisan.state].filter(Boolean).join(', ') || 'Nigeria',
        distanceKm,
        avatarUrl: undefined,
        isKycVerified,
        isAvailableForSubcontract: artisan.isAvailable,
        phone: artisan.user.phoneNumber,
      };
    });

    return {
      peers,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Propose a subcontract from a Prime Artisan to a Peer Sub-Artisan
   */
  static async createSubcontract(currentUserId, { contractId, subArtisanId, title, scope, agreedAmount }) {
    const primeProfile = await prisma.artisanProfile.findUnique({
      where: { userId: currentUserId },
    });

    if (!primeProfile) {
      throw ApiError.forbidden('Only artisans can propose subcontracts');
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.artisanId !== currentUserId) {
      throw ApiError.badRequest('You must be the prime artisan on this contract to subcontract tasks');
    }

    const subProfile = await prisma.artisanProfile.findUnique({
      where: { id: subArtisanId },
      include: { user: true },
    });

    if (!subProfile) {
      throw ApiError.notFound('Sub-artisan profile not found');
    }

    const subcontract = await prisma.jobSubcontract.create({
      data: {
        contractId,
        primeArtisanId: primeProfile.id,
        subArtisanId: subProfile.id,
        title,
        scope,
        agreedAmount,
        status: 'PENDING',
      },
    });

    // Notify Sub-Artisan via in-app & mobile push
    NotificationService.createNotification(
      subProfile.userId,
      'New Subcontract Proposal',
      `${primeProfile.firstName || 'A peer artisan'} proposed a subcontract: "${title}" (₦${Number(agreedAmount).toLocaleString()})`,
      `/contracts/${contractId}`
    ).catch(() => {});

    return subcontract;
  }

  /**
   * Fetch subcontracts for the current artisan (both as prime and subcontractor)
   */
  static async getMySubcontracts(currentUserId) {
    const profile = await prisma.artisanProfile.findUnique({
      where: { userId: currentUserId },
    });

    if (!profile) return { prime: [], assigned: [] };

    const [prime, assigned] = await Promise.all([
      prisma.jobSubcontract.findMany({
        where: { primeArtisanId: profile.id },
        include: {
          subArtisan: {
            select: { id: true, firstName: true, lastName: true, businessName: true, user: { select: { phoneNumber: true } } },
          },
          contract: {
            select: { id: true, contractCode: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobSubcontract.findMany({
        where: { subArtisanId: profile.id },
        include: {
          primeArtisan: {
            select: { id: true, firstName: true, lastName: true, businessName: true, user: { select: { phoneNumber: true } } },
          },
          contract: {
            select: { id: true, contractCode: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { prime, assigned };
  }

  /**
   * Update status of subcontract (e.g. ACCEPTED, DECLINED, COMPLETED)
   */
  static async updateSubcontractStatus(currentUserId, subcontractId, status, completionNotes = null) {
    const subcontract = await prisma.jobSubcontract.findUnique({
      where: { id: subcontractId },
      include: {
        primeArtisan: { include: { user: true } },
        subArtisan: { include: { user: true } },
      },
    });

    if (!subcontract) {
      throw ApiError.notFound('Subcontract assignment not found');
    }

    const isPrime = subcontract.primeArtisan.userId === currentUserId;
    const isSub = subcontract.subArtisan.userId === currentUserId;

    if (!isPrime && !isSub) {
      throw ApiError.forbidden('Unauthorized to update this subcontract');
    }

    const updated = await prisma.jobSubcontract.update({
      where: { id: subcontractId },
      data: {
        status,
        ...(completionNotes ? { completionNotes } : {}),
      },
    });

    const notifyRecipientId = isSub ? subcontract.primeArtisan.userId : subcontract.subArtisan.userId;
    NotificationService.createNotification(
      notifyRecipientId,
      'Subcontract Status Updated',
      `Subcontract "${subcontract.title}" status changed to ${status}`,
      `/contracts/${subcontract.contractId}`
    ).catch(() => {});

    return updated;
  }
}
