import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { ArtisanSpatialRepository } from '../repositories/artisan-spatial.repository.js';
import { GeoUtils } from '../utils/geo.utils.js';
import { spatialCache } from '../utils/spatial-cache.js';

export class ProfileService {
  static async updateArtisanProfile(userId, data) {
    const { skillIds, ...profileData } = data;

    const profile = await prisma.artisanProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw ApiError.notFound('Artisan profile not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (skillIds && Array.isArray(skillIds)) {
        await tx.artisanSkill.deleteMany({
          where: { artisanProfileId: profile.id },
        });

        if (skillIds.length > 0) {
          await tx.artisanSkill.createMany({
            data: skillIds.map((skillId) => ({
              artisanProfileId: profile.id,
              skillId,
            })),
          });
        }
      }

      return tx.artisanProfile.update({
        where: { id: profile.id },
        data: profileData,
        include: {
          skills: { include: { skill: true } },
          portfolios: true,
          services: true,
        },
      });
    });

    spatialCache.invalidateAll();
    return updated;
  }

  static async updateClientProfile(userId, data) {
    const profile = await prisma.clientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw ApiError.notFound('Client profile not found');
    }

    return prisma.clientProfile.update({
      where: { id: profile.id },
      data,
    });
  }

  static async getNearbyArtisans(query = {}) {
    const isBBoxMode =
      query.minLat !== undefined &&
      query.maxLat !== undefined &&
      query.minLng !== undefined &&
      query.maxLng !== undefined;

    // 1. Check Spatial Cache
    const cacheKey = spatialCache.generateKey(
      query.lat,
      query.lng,
      query.radius,
      query
    );

    const cached = spatialCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const repository = new ArtisanSpatialRepository();
    let candidates = [];
    let total = 0;

    if (isBBoxMode) {
      const result = await repository.findArtisansInBoundingBox({
        minLat: query.minLat,
        maxLat: query.maxLat,
        minLng: query.minLng,
        maxLng: query.maxLng,
        centerLat: query.lat,
        centerLng: query.lng,
        categoryId: query.categoryId,
        skillId: query.skillId,
        minRating: query.minRating,
        search: query.search,
        isAvailable: query.isAvailable,
        page: query.page,
        limit: query.limit,
      });
      candidates = result.candidates;
      total = result.total;
    } else {
      const result = await repository.findNearbyArtisans(query);
      candidates = result.candidates;
      total = result.total;
    }

    // Apply deterministic coordinate fuzzing for client map rendering
    const fuzzedArtisans = candidates.map((artisan) => {
      const rawLat = artisan.latitude != null ? Number(artisan.latitude) : null;
      const rawLng = artisan.longitude != null ? Number(artisan.longitude) : null;

      const { fuzzedLat, fuzzedLng, isFuzzed } = GeoUtils.fuzzCoordinates(
        rawLat,
        rawLng,
        artisan.id
      );

      return {
        ...artisan,
        displayLatitude: fuzzedLat,
        displayLongitude: fuzzedLng,
        isLocationObfuscated: isFuzzed,
        // Suppress exact raw coordinates from public discovery responses
        latitude: undefined,
        longitude: undefined,
      };
    });

    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);

    const searchCenter = isBBoxMode
      ? {
          lat: query.lat !== undefined ? Number(query.lat) : (Number(query.minLat) + Number(query.maxLat)) / 2,
          lng: query.lng !== undefined ? Number(query.lng) : (Number(query.minLng) + Number(query.maxLng)) / 2,
        }
      : {
          lat: Number(query.lat),
          lng: Number(query.lng),
        };

    const response = {
      artisans: fuzzedArtisans,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        searchCenter,
        radiusKm: isBBoxMode ? null : Number(query.radius || 15),
        isViewportSearch: isBBoxMode,
      },
    };

    // Cache the result for subsequent requests
    spatialCache.set(cacheKey, response);

    return response;
  }

  static async getArtisans(filters = {}) {
    const { state, lgaCity, skillId, categoryId, search, page = 1, limit = 20 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      isAvailable: true,
      ...(state && { state: { equals: state, mode: 'insensitive' } }),
      ...(lgaCity && { lgaCity: { equals: lgaCity, mode: 'insensitive' } }),
      ...(skillId && { skills: { some: { skillId: Number(skillId) } } }),
      ...(categoryId && { skills: { some: { skill: { categoryId: Number(categoryId) } } } }),
      ...(search && {
        OR: [
          { businessName: { contains: search, mode: 'insensitive' } },
          { tagline: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [artisans, total] = await Promise.all([
      prisma.artisanProfile.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: { select: { id: true, email: true, phoneNumber: true, isKycVerified: true, avatarUrl: true } },
          skills: { include: { skill: true } },
          portfolios: true,
        },
        orderBy: [{ ratingAvg: 'desc' }, { completedJobsCount: 'desc' }],
      }),
      prisma.artisanProfile.count({ where }),
    ]);

    return {
      artisans,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async getArtisanById(id) {
    const artisan = await prisma.artisanProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, phoneNumber: true, isKycVerified: true, avatarUrl: true } },
        skills: { include: { skill: { include: { category: true } } } },
        portfolios: true,
        services: { where: { isActive: true } },
      },
    });

    if (!artisan) {
      throw ApiError.notFound('Artisan not found');
    }

    return artisan;
  }

  /**
   * Portfolio Items
   */
  static async addPortfolioItem(userId, data) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Artisan profile not found');

    return prisma.artisanPortfolio.create({
      data: {
        artisanProfileId: profile.id,
        title: data.title,
        description: data.description,
        mediaUrls: data.mediaUrls,
        completionDate: data.completionDate ? new Date(data.completionDate) : null,
      },
    });
  }

  static async updatePortfolioItem(userId, portfolioId, data) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Artisan profile not found');

    const item = await prisma.artisanPortfolio.findUnique({ where: { id: portfolioId } });
    if (!item || item.artisanProfileId !== profile.id) {
      throw ApiError.notFound('Portfolio item not found or unauthorized');
    }

    return prisma.artisanPortfolio.update({
      where: { id: portfolioId },
      data: {
        ...data,
        completionDate: data.completionDate ? new Date(data.completionDate) : undefined,
      },
    });
  }

  static async deletePortfolioItem(userId, portfolioId) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Artisan profile not found');

    const item = await prisma.artisanPortfolio.findUnique({ where: { id: portfolioId } });
    if (!item || item.artisanProfileId !== profile.id) {
      throw ApiError.notFound('Portfolio item not found or unauthorized');
    }

    return prisma.artisanPortfolio.delete({ where: { id: portfolioId } });
  }

  /**
   * Packaged Artisan Services (Catalog)
   */
  static async createArtisanService(userId, data) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Artisan profile not found');

    return prisma.artisanService.create({
      data: {
        artisanProfileId: profile.id,
        title: data.title,
        description: data.description,
        price: data.price,
        deliveryDays: data.deliveryDays,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  static async updateArtisanService(userId, serviceId, data) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Artisan profile not found');

    const service = await prisma.artisanService.findUnique({ where: { id: serviceId } });
    if (!service || service.artisanProfileId !== profile.id) {
      throw ApiError.notFound('Service not found or unauthorized');
    }

    return prisma.artisanService.update({
      where: { id: serviceId },
      data,
    });
  }

  static async deleteArtisanService(userId, serviceId) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Artisan profile not found');

    const service = await prisma.artisanService.findUnique({ where: { id: serviceId } });
    if (!service || service.artisanProfileId !== profile.id) {
      throw ApiError.notFound('Service not found or unauthorized');
    }

    return prisma.artisanService.delete({ where: { id: serviceId } });
  }

  /**
   * Saved Artisans (Bookmarks)
   */
  static async saveArtisan(userId, artisanProfileId) {
    const artisan = await prisma.artisanProfile.findUnique({ where: { id: artisanProfileId } });
    if (!artisan) throw ApiError.notFound('Artisan profile not found');

    return prisma.savedArtisan.upsert({
      where: { userId_artisanProfileId: { userId, artisanProfileId } },
      update: {},
      create: { userId, artisanProfileId },
    });
  }

  static async unsaveArtisan(userId, artisanProfileId) {
    return prisma.savedArtisan.deleteMany({
      where: { userId, artisanProfileId },
    });
  }

  static async getSavedArtisans(userId) {
    const saved = await prisma.savedArtisan.findMany({
      where: { userId },
      include: {
        artisanProfile: {
          include: {
            user: { select: { id: true, email: true, phoneNumber: true, isKycVerified: true, avatarUrl: true } },
            skills: { include: { skill: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((s) => s.artisanProfile);
  }

  /**
   * Availability & Location Quick Toggles
   */
  static async toggleAvailability(userId, isAvailable) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Artisan profile not found');

    const updated = await prisma.artisanProfile.update({
      where: { id: profile.id },
      data: { isAvailable },
    });

    spatialCache.invalidateAll();
    return updated;
  }

  static async updateLocation(userId, latitude, longitude, addressDetails = {}) {
    const profile = await prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw ApiError.notFound('Artisan profile not found');

    const updateData = { latitude, longitude };
    if (addressDetails?.address) updateData.address = addressDetails.address;
    if (addressDetails?.state) updateData.state = addressDetails.state;
    if (addressDetails?.lgaCity) updateData.lgaCity = addressDetails.lgaCity;

    const updated = await prisma.artisanProfile.update({
      where: { id: profile.id },
      data: updateData,
    });

    spatialCache.invalidateAll();
    return updated;
  }

  /**
   * Account Deactivation
   */
  static async softDeleteAccount(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: 'DEACTIVATED',
      },
    });
  }

  /**
   * KYC
   */
  static async submitKyc(userId, data) {
    const existingPending = await prisma.kycVerification.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (existingPending) {
      throw ApiError.conflict('You already have a pending KYC verification request');
    }

    return prisma.kycVerification.create({
      data: {
        userId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentFrontUrl: data.documentFrontUrl,
        documentBackUrl: data.documentBackUrl,
        selfieUrl: data.selfieUrl,
        status: 'PENDING',
      },
    });
  }

  static async reviewKyc(adminId, kycId, { status, rejectionReason }) {
    const kyc = await prisma.kycVerification.findUnique({ where: { id: kycId } });
    if (!kyc) throw ApiError.notFound('KYC record not found');

    return prisma.$transaction(async (tx) => {
      const updatedKyc = await tx.kycVerification.update({
        where: { id: kycId },
        data: {
          status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
          reviewedByAdminId: adminId,
          reviewedAt: new Date(),
        },
      });

      if (status === 'APPROVED') {
        await tx.user.update({
          where: { id: kyc.userId },
          data: { isKycVerified: true },
        });
      }

      return updatedKyc;
    });
  }

  static async updateWalletAddress(userId, walletAddress) {
    if (walletAddress) {
      const existingUser = await prisma.user.findFirst({
        where: {
          walletAddress: { equals: walletAddress, mode: 'insensitive' },
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw ApiError.conflict('This wallet address is already linked to another account');
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: { walletAddress: walletAddress || null },
      select: {
        id: true,
        email: true,
        role: true,
        walletAddress: true,
        updatedAt: true,
      },
    });
  }
}

export default ProfileService;
