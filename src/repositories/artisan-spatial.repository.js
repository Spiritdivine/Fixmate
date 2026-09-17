import { Prisma } from '@prisma/client';
import prisma from '../config/db.js';
import { SphericalCosineStrategy } from '../utils/spatial-strategies/spherical-cosine.strategy.js';
import { GeoUtils } from '../utils/geo.utils.js';

/**
 * Data access repository for spatial queries on artisan profiles.
 * Adheres to Dependency Inversion: allows injection of spatial distance strategies
 * and database clients for testability.
 */
export class ArtisanSpatialRepository {
  /**
   * @param {import('../utils/spatial-strategies/spatial-strategy.interface.js').ISpatialDistanceStrategy} [spatialStrategy]
   * @param {typeof prisma} [db]
   */
  constructor(spatialStrategy = new SphericalCosineStrategy(), db = prisma) {
    this.spatialStrategy = spatialStrategy;
    this.db = db;
  }

  /**
   * Finds artisans within a radius of a target coordinate, matching optional filters.
   *
   * @param {object} params
   * @param {number} params.lat - Target latitude
   * @param {number} params.lng - Target longitude
   * @param {number} params.radius - Search radius in km
   * @param {number} [params.categoryId] - Filter by job trade category
   * @param {number} [params.skillId] - Filter by specific skill
   * @param {number} [params.minRating] - Minimum rating filter
   * @param {string} [params.search] - Search keyword
   * @param {boolean} [params.isAvailable=true] - Availability filter
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @returns {Promise<{ candidates: Array<object>, total: number }>}
   */
  async findNearbyArtisans({
    lat,
    lng,
    radius,
    categoryId,
    skillId,
    minRating,
    search,
    isAvailable = true,
    page = 1,
    limit = 20,
  }) {
    const numLat = Number(lat);
    const numLng = Number(lng);
    const numRadius = Number(radius);
    const numPage = Number(page || 1);
    const numLimit = Number(limit || 20);
    const skip = (numPage - 1) * numLimit;

    // 1. Compute bounding box for B-Tree index pre-filter (Stage 1)
    const { minLat, maxLat, minLng, maxLng } = GeoUtils.getBoundingBox(numLat, numLng, numRadius);

    // 2. Get parameterized distance calculation expression (Stage 2)
    const distanceExpression = this.spatialStrategy.getSqlDistanceExpression(numLat, numLng);

    // 3. Build dynamic parameterized WHERE conditions
    const whereConditions = [
      Prisma.sql`ap.latitude IS NOT NULL`,
      Prisma.sql`ap.longitude IS NOT NULL`,
      Prisma.sql`ap.is_available = ${Boolean(isAvailable)}`,
      Prisma.sql`ap.latitude BETWEEN ${minLat}::decimal AND ${maxLat}::decimal`,
      Prisma.sql`ap.longitude BETWEEN ${minLng}::decimal AND ${maxLng}::decimal`,
      Prisma.sql`${distanceExpression} <= ${numRadius}::float`,
    ];

    if (minRating != null && Number(minRating) > 0) {
      whereConditions.push(Prisma.sql`ap.rating_avg >= ${Number(minRating)}`);
    }

    if (categoryId) {
      whereConditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM artisan_skills ask
        JOIN job_skills js ON ask.skill_id = js.id
        WHERE ask.artisan_profile_id = ap.id AND js.category_id = ${Number(categoryId)}
      )`);
    }

    if (skillId) {
      whereConditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM artisan_skills ask
        WHERE ask.artisan_profile_id = ap.id AND ask.skill_id = ${Number(skillId)}
      )`);
    }

    if (search && search.trim().length > 0) {
      const searchPattern = `%${search.trim()}%`;
      whereConditions.push(Prisma.sql`(
        ap.business_name ILIKE ${searchPattern} OR
        ap.tagline ILIKE ${searchPattern} OR
        ap.bio ILIKE ${searchPattern}
      )`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`;

    // Query 1: Fetch candidate IDs and computed distances
    const candidates = await this.db.$queryRaw(Prisma.sql`
      SELECT 
        ap.id,
        ${distanceExpression} AS distance_km
      FROM artisan_profiles ap
      ${whereClause}
      ORDER BY distance_km ASC
      LIMIT ${numLimit} OFFSET ${skip}
    `);

    // Query 2: Fetch total matching count for pagination
    const countResult = await this.db.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM artisan_profiles ap
      ${whereClause}
    `);

    const total = countResult[0]?.total || 0;

    if (!candidates || candidates.length === 0) {
      return { candidates: [], total };
    }

    // 4. Hydrate full relational profiles via Prisma (type-safe relations)
    const artisanIds = candidates.map((c) => c.id);
    const fullProfiles = await this.db.artisanProfile.findMany({
      where: { id: { in: artisanIds } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            isKycVerified: true,
            avatarUrl: true,
          },
        },
        skills: {
          include: {
            skill: {
              include: { category: true },
            },
          },
        },
        portfolios: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
        services: {
          where: { isActive: true },
          take: 3,
        },
      },
    });

    // 5. Re-order hydrated profiles according to distance_km order
    const profileMap = new Map(fullProfiles.map((p) => [p.id, p]));
    const hydratedResults = candidates
      .map((c) => {
        const profile = profileMap.get(c.id);
        if (!profile) return null;
        return {
          ...profile,
          distanceKm: GeoUtils.formatDistance(Number(c.distance_km)),
        };
      })
      .filter(Boolean);

    return { candidates: hydratedResults, total };
  }

  /**
   * Finds artisans within a rectangular bounding box (viewport search).
   *
   * @param {object} params
   * @param {number} params.minLat
   * @param {number} params.maxLat
   * @param {number} params.minLng
   * @param {number} params.maxLng
   * @param {number} [params.centerLat]
   * @param {number} [params.centerLng]
   * @param {number} [params.categoryId]
   * @param {number} [params.skillId]
   * @param {number} [params.minRating]
   * @param {string} [params.search]
   * @param {boolean} [params.isAvailable=true]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @returns {Promise<{ candidates: Array<object>, total: number }>}
   */
  async findArtisansInBoundingBox({
    minLat,
    maxLat,
    minLng,
    maxLng,
    centerLat,
    centerLng,
    categoryId,
    skillId,
    minRating,
    search,
    isAvailable = true,
    page = 1,
    limit = 20,
  }) {
    const numMinLat = Number(minLat);
    const numMaxLat = Number(maxLat);
    const numMinLng = Number(minLng);
    const numMaxLng = Number(maxLng);
    const cLat = centerLat !== undefined ? Number(centerLat) : (numMinLat + numMaxLat) / 2;
    const cLng = centerLng !== undefined ? Number(centerLng) : (numMinLng + numMaxLng) / 2;
    const numPage = Number(page || 1);
    const numLimit = Number(limit || 20);
    const skip = (numPage - 1) * numLimit;

    const distanceExpression = this.spatialStrategy.getSqlDistanceExpression(cLat, cLng);

    const whereConditions = [
      Prisma.sql`ap.latitude IS NOT NULL`,
      Prisma.sql`ap.longitude IS NOT NULL`,
      Prisma.sql`ap.is_available = ${Boolean(isAvailable)}`,
      Prisma.sql`ap.latitude BETWEEN ${numMinLat}::decimal AND ${numMaxLat}::decimal`,
      Prisma.sql`ap.longitude BETWEEN ${numMinLng}::decimal AND ${numMaxLng}::decimal`,
    ];

    if (minRating != null && Number(minRating) > 0) {
      whereConditions.push(Prisma.sql`ap.rating_avg >= ${Number(minRating)}`);
    }

    if (categoryId) {
      whereConditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM artisan_skills ask
        JOIN job_skills js ON ask.skill_id = js.id
        WHERE ask.artisan_profile_id = ap.id AND js.category_id = ${Number(categoryId)}
      )`);
    }

    if (skillId) {
      whereConditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM artisan_skills ask
        WHERE ask.artisan_profile_id = ap.id AND ask.skill_id = ${Number(skillId)}
      )`);
    }

    if (search && search.trim().length > 0) {
      const searchPattern = `%${search.trim()}%`;
      whereConditions.push(Prisma.sql`(
        ap.business_name ILIKE ${searchPattern} OR
        ap.tagline ILIKE ${searchPattern} OR
        ap.bio ILIKE ${searchPattern}
      )`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`;

    const candidates = await this.db.$queryRaw(Prisma.sql`
      SELECT 
        ap.id,
        ${distanceExpression} AS distance_km
      FROM artisan_profiles ap
      ${whereClause}
      ORDER BY distance_km ASC
      LIMIT ${numLimit} OFFSET ${skip}
    `);

    const countResult = await this.db.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM artisan_profiles ap
      ${whereClause}
    `);

    const total = countResult[0]?.total || 0;

    if (!candidates || candidates.length === 0) {
      return { candidates: [], total };
    }

    const artisanIds = candidates.map((c) => c.id);
    const fullProfiles = await this.db.artisanProfile.findMany({
      where: { id: { in: artisanIds } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            isKycVerified: true,
            avatarUrl: true,
          },
        },
        skills: {
          include: {
            skill: {
              include: { category: true },
            },
          },
        },
        portfolios: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
        services: {
          where: { isActive: true },
          take: 3,
        },
      },
    });

    const profileMap = new Map(fullProfiles.map((p) => [p.id, p]));
    const hydratedResults = candidates
      .map((c) => {
        const profile = profileMap.get(c.id);
        if (!profile) return null;
        return {
          ...profile,
          distanceKm: GeoUtils.formatDistance(Number(c.distance_km)),
        };
      })
      .filter(Boolean);

    return { candidates: hydratedResults, total };
  }
}
