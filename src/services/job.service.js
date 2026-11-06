import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';
import { JobPrivacyUtil } from '../utils/job-privacy.util.js';
import { JobEventDispatcher } from '../events/job.events.js';
import { GeoUtils } from '../utils/geo.utils.js';
import crypto from 'crypto';

export class JobService {
  static async createJob(clientId, data) {
    const { skillIds, attachments, ...jobData } = data;

    if (jobData.budgetMin > jobData.budgetMax) {
      throw ApiError.badRequest('Minimum budget cannot exceed maximum budget');
    }

    const job = await prisma.job.create({
      data: {
        clientId,
        ...jobData,
        deadlineDate: jobData.deadlineDate ? new Date(jobData.deadlineDate) : null,
        skills: skillIds && skillIds.length > 0
          ? {
              create: skillIds.map((skillId) => ({ skillId })),
            }
          : undefined,
        attachments: attachments && attachments.length > 0
          ? {
              create: attachments.map((att) => ({
                fileUrl: att.fileUrl,
                fileName: att.fileName,
                fileSizeBytes: BigInt(att.fileSizeBytes),
                mimeType: att.mimeType,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        skills: { include: { skill: true } },
        attachments: true,
      },
    });

    return {
      ...job,
      attachments: job.attachments.map((a) => ({
        ...a,
        fileSizeBytes: a.fileSizeBytes.toString(),
      })),
    };
  }

  static async updateJob(clientId, jobId, data) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');
    if (job.status !== 'OPEN' && job.status !== 'DRAFT') {
      throw ApiError.badRequest('Cannot update a job that is already in progress or completed');
    }

    const { skillIds, attachments, ...jobData } = data;

    if (jobData.budgetMin && jobData.budgetMax && jobData.budgetMin > jobData.budgetMax) {
      throw ApiError.badRequest('Minimum budget cannot exceed maximum budget');
    }

    return prisma.$transaction(async (tx) => {
      if (skillIds && Array.isArray(skillIds)) {
        await tx.jobSkill.deleteMany({ where: { jobId } });
        if (skillIds.length > 0) {
          await tx.jobSkill.createMany({
            data: skillIds.map((skillId) => ({ jobId, skillId })),
          });
        }
      }

      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        await tx.jobAttachment.createMany({
          data: attachments.map((att) => ({
            jobId,
            fileUrl: att.fileUrl,
            fileName: att.fileName,
            fileSizeBytes: BigInt(att.fileSizeBytes),
            mimeType: att.mimeType,
          })),
        });
      }

      const updated = await tx.job.update({
        where: { id: jobId },
        data: {
          ...jobData,
          deadlineDate: jobData.deadlineDate ? new Date(jobData.deadlineDate) : undefined,
        },
        include: {
          category: true,
          skills: { include: { skill: true } },
          attachments: true,
        },
      });

      const updatedResult = {
        ...updated,
        attachments: updated.attachments.map((a) => ({
          ...a,
          fileSizeBytes: a.fileSizeBytes.toString(),
        })),
      };

      // Notify existing bidders of scope/budget update
      try {
        const proposals = await tx.proposal.findMany({
          where: { jobId },
          select: { artisanId: true },
        });
        const bidderIds = proposals.map((p) => p.artisanId);
        if (bidderIds.length > 0) {
          JobEventDispatcher.onJobUpdated(jobId, updated.title, bidderIds);
        }
      } catch (evtErr) {
        console.warn('[JobService.updateJob] Bidder event notification error:', evtErr.message);
      }

      return updatedResult;
    });
  }

  static async updateJobStatus(clientId, jobId, status) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');

    if (job.status === status) {
      return job;
    }

    const ALLOWED_TRANSITIONS = {
      DRAFT: ['OPEN', 'CANCELLED'],
      OPEN: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'DISPUTED'],
      DISPUTED: ['IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = ALLOWED_TRANSITIONS[job.status] || [];
    if (!allowed.includes(status)) {
      throw ApiError.badRequest(`Invalid state transition: Cannot transition job from ${job.status} to ${status}`);
    }

    return prisma.job.update({
      where: { id: jobId },
      data: { status },
    });
  }

  static async deleteJob(clientId, jobId, reason = null) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        contracts: true,
        proposals: {
          select: { id: true, artisanId: true },
        },
      },
    });

    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');

    // Prevent deletion if an active, funded, or disputed contract is underway
    const activeContracts = (job.contracts || []).filter((c) =>
      ['ACTIVE', 'PENDING_FUNDING', 'DISPUTED'].includes(c.status)
    );
    if (activeContracts.length > 0) {
      throw ApiError.badRequest('Cannot delete a job with active or pending contracts');
    }

    const affectedArtisanIds = (job.proposals || []).map((p) => p.artisanId);

    await prisma.$transaction(async (tx) => {
      // 1. Decouple conversation references to prevent P2003 FK constraint crash
      await tx.conversation.updateMany({
        where: { jobId },
        data: { jobId: null },
      });

      // 2. If historical contracts exist, soft-cancel to preserve financial audit trail
      if (job.contracts && job.contracts.length > 0) {
        await tx.job.update({
          where: { id: jobId },
          data: { status: 'CANCELLED' },
        });
      } else {
        // 3. Otherwise clean hard-delete (proposals, skills, attachments, invitations cascade)
        await tx.job.delete({
          where: { id: jobId },
        });
      }
    });

    // 4. Notify all artisans who submitted bids that the job has been cancelled
    for (const artisanId of affectedArtisanIds) {
      NotificationService.createNotification(
        artisanId,
        'Job Request Closed',
        `The job "${job.title}" was cancelled by the client${reason ? ` (${reason})` : ''}.`,
        '/jobs'
      ).catch((err) => console.warn('[JobService.deleteJob] Notification error:', err.message));
    }

    // 5. Broadcast real-time domain event to client and marketplace
    JobEventDispatcher.onJobCancelled(jobId, job.title, affectedArtisanIds);

    return { success: true, jobId };
  }

  static async deleteJobAttachment(clientId, jobId, attachmentId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');

    const attachment = await prisma.jobAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.jobId !== jobId) {
      throw ApiError.notFound('Attachment not found');
    }

    return prisma.jobAttachment.delete({
      where: { id: attachmentId },
    });
  }

  static async getJobs(filters = {}, requestingUserId = null) {
    const {
      categoryId,
      state,
      lgaCity,
      status = 'OPEN',
      minBudget,
      maxBudget,
      search,
      lat,
      lng,
      radiusKm = 50,
      page = 1,
      limit = 20,
    } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(status && { status }),
      ...(categoryId && { categoryId: Number(categoryId) }),
      ...(state && { state: { equals: state, mode: 'insensitive' } }),
      ...(lgaCity && { lgaCity: { equals: lgaCity, mode: 'insensitive' } }),
      ...(minBudget && { budgetMax: { gte: Number(minBudget) } }),
      ...(maxBudget && { budgetMin: { lte: Number(maxBudget) } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Geospatial Bounding-Box Pre-Filter (Uses Composite B-Tree Index on latitude, longitude)
    const hasCoordinates =
      lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
    if (hasCoordinates) {
      const radius = Number(radiusKm);
      const latNum = Number(lat);
      const lngNum = Number(lng);
      const latDelta = radius / 111.045;
      const lngDelta = radius / (111.045 * Math.cos((latNum * Math.PI) / 180));

      where.latitude = {
        gte: latNum - latDelta,
        lte: latNum + latDelta,
      };
      where.longitude = {
        gte: lngNum - lngDelta,
        lte: lngNum + lngDelta,
      };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          clientId: true,
          title: true,
          description: true,
          budgetMin: true,
          budgetMax: true,
          budgetType: true,
          status: true,
          state: true,
          lgaCity: true,
          address: true,
          latitude: true,
          longitude: true,
          proposalsCount: true,
          createdAt: true,
          client: {
            select: {
              id: true,
              email: true,
              avatarUrl: true,
              clientProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                  companyName: true,
                  state: true,
                  city: true,
                },
              },
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconUrl: true,
            },
          },
          urgency: true,
          attachments: {
            select: {
              id: true,
              fileUrl: true,
              fileName: true,
              mimeType: true,
            },
          },
          skills: {
            select: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    // Compute Exact Spherical Haversine Distance (in km)
    let enrichedJobs = jobs.map((job) => {
      let distanceKm = null;
      if (hasCoordinates && job.latitude != null && job.longitude != null) {
        const R = 6371; // Earth radius in km
        const dLat = ((Number(job.latitude) - Number(lat)) * Math.PI) / 180;
        const dLon = ((Number(job.longitude) - Number(lng)) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((Number(lat) * Math.PI) / 180) *
            Math.cos((Number(job.latitude) * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = Number((R * c).toFixed(1));
      }
      return {
        ...job,
        urgency: job.urgency || 'NORMAL',
        attachments: job.attachments || [],
        attachmentsCount: job.attachments ? job.attachments.length : 0,
        distanceKm,
      };
    });

    // If proximity search, sort by closest distance first
    if (hasCoordinates) {
      enrichedJobs.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    // Apply Zero-Trust Client Privacy Masking (Hides raw street address & fuzzed coords)
    const sanitizedJobs = JobPrivacyUtil.sanitizeJobsList(enrichedJobs, requestingUserId);

    return {
      jobs: sanitizedJobs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async getJobById(id, requestingUserId = null) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, email: true, clientProfile: true, avatarUrl: true },
        },
        category: true,
        skills: { include: { skill: true } },
        attachments: true,
        contracts: {
          select: { id: true, artisanId: true, status: true },
        },
      },
    });

    if (!job) throw ApiError.notFound('Job not found');

    const formatted = {
      ...job,
      attachments: job.attachments.map((a) => ({
        ...a,
        fileSizeBytes: a.fileSizeBytes.toString(),
      })),
    };

    // Apply Zero-Trust Privacy Safeguards based on requester identity
    return JobPrivacyUtil.sanitizeJob(formatted, requestingUserId);
  }

  static async getClientJobs(clientId, status = null) {
    const where = { clientId };
    if (status && status !== 'ALL') {
      where.status = status;
    } else if (!status) {
      // By default exclude soft-cancelled jobs from active dashboard
      where.status = { not: 'CANCELLED' };
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        category: true,
        skills: {
          include: {
            skill: true,
          },
        },
        attachments: true,
        proposals: {
          include: {
            artisan: {
              include: { artisanProfile: true },
            },
          },
        },
        contracts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => ({
      ...job,
      attachments: (job.attachments || []).map((a) => ({
        ...a,
        fileSizeBytes: a.fileSizeBytes != null ? a.fileSizeBytes.toString() : '0',
      })),
    }));
  }

  /**
   * Job Invitations
   */
  static async inviteArtisan(clientId, jobId, artisanId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');

    const artisan = await prisma.user.findUnique({ where: { id: artisanId } });
    if (!artisan || artisan.role !== 'ARTISAN') {
      throw ApiError.badRequest('Invalid artisan recipient');
    }

    const invitation = await prisma.jobInvitation.upsert({
      where: { jobId_artisanId: { jobId, artisanId } },
      update: { status: 'PENDING' },
      create: {
        jobId,
        artisanId,
        status: 'PENDING',
      },
      include: { job: true },
    });

    await NotificationService.createNotification(
      artisanId,
      'New Job Invitation',
      `You have been invited to apply for "${job.title}"`,
      `/jobs/${job.id}`
    );

    // Real-Time Domain Event Emission to Artisan Room
    JobEventDispatcher.onInvitationSent(artisanId, invitation, job);

    return invitation;
  }

  static async getArtisanInvitations(artisanId) {
    return prisma.jobInvitation.findMany({
      where: { artisanId },
      include: {
        job: {
          include: {
            category: true,
            client: { select: { id: true, email: true, clientProfile: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async respondToInvitation(artisanId, invitationId, status) {
    const invitation = await prisma.jobInvitation.findUnique({
      where: { id: invitationId },
      include: { job: true },
    });
    if (!invitation || invitation.artisanId !== artisanId) {
      throw ApiError.notFound('Invitation not found');
    }

    const updated = await prisma.jobInvitation.update({
      where: { id: invitationId },
      data: { status },
    });

    // Real-Time Domain Event Emission to Client Room
    if (invitation.job?.clientId) {
      JobEventDispatcher.onInvitationResponded(invitation.job.clientId, invitation, status);
    }

    return updated;
  }

  static async cancelInvitation(clientId, invitationId) {
    const invitation = await prisma.jobInvitation.findUnique({
      where: { id: invitationId },
      include: { job: true },
    });

    if (!invitation || invitation.job.clientId !== clientId) {
      throw ApiError.notFound('Invitation not found or unauthorized');
    }

    return prisma.jobInvitation.delete({
      where: { id: invitationId },
    });
  }

  /**
   * Saved Jobs (Bookmarks)
   */
  static async saveJob(userId, jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');

    return prisma.savedJob.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: {},
      create: { userId, jobId },
    });
  }

  static async unsaveJob(userId, jobId) {
    return prisma.savedJob.deleteMany({
      where: { userId, jobId },
    });
  }

  static async getSavedJobs(userId) {
    const saved = await prisma.savedJob.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            category: true,
            skills: { include: { skill: true } },
            client: { select: { id: true, email: true, clientProfile: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((s) => s.job);
  }

  /**
   * Client generates a dynamic on-site QR check-in token for an active job.
   */
  static async getCheckInToken(clientId, jobId) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          include: { artisan: { include: { artisanProfile: true } } },
        },
      },
    });

    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: You are not the client for this job');

    const activeContract = job.contracts[0];
    if (!activeContract) {
      throw ApiError.badRequest('No active escrow contract found for this job');
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const secretHash = crypto
      .createHash('sha256')
      .update(`${job.id}:${job.clientId}:${todayStr}`)
      .digest('hex')
      .slice(0, 16);

    const qrValue = `artisan:checkin:${job.id}:${secretHash}`;

    return {
      jobId: job.id,
      contractId: activeContract.id,
      title: job.title,
      qrValue,
      token: secretHash,
      assignedArtisan: activeContract.artisan?.artisanProfile?.businessName || 'Assigned Artisan',
      validForDate: todayStr,
    };
  }

  /**
   * Artisan scans client's check-in QR code upon arriving on-site.
   * Validates GPS geofence and credits the artisan with an arrival loyalty reward.
   */
  static async verifyArrival(artisanId, jobId, { token, latitude, longitude }) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        contracts: {
          where: { artisanId, status: 'ACTIVE' },
          include: { client: true },
        },
      },
    });

    if (!job) throw ApiError.notFound('Job not found');
    const contract = job.contracts[0];
    if (!contract) {
      throw ApiError.forbidden('You do not have an active contract for this job');
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${job.id}:${job.clientId}:${todayStr}`)
      .digest('hex')
      .slice(0, 16);

    if (token !== expectedHash) {
      throw ApiError.badRequest('Invalid or expired on-site check-in token');
    }

    // Geofence check if job coordinates and artisan coordinates exist
    let distanceMeters = null;
    let isGeofenceVerified = true;

    if (latitude && longitude && job.latitude && job.longitude) {
      const distKm = GeoUtils.calculateDistance(
        Number(latitude),
        Number(longitude),
        Number(job.latitude),
        Number(job.longitude)
      );
      distanceMeters = Math.round(distKm * 1000);
      if (distanceMeters > 1000) {
        isGeofenceVerified = false;
      }
    }

    // Reward artisan with on-time physical arrival bonus (+25 points)
    let pointsAwarded = 0;
    try {
      const { PointLedgerService } = await import('./point-ledger.service.js');
      await PointLedgerService.recordTransaction({
        userId: artisanId,
        amount: 25,
        transactionType: 'JOB_COMPLETION_ARTISAN_REWARD',
        idempotencyKey: `arrival-bonus:${job.id}:${todayStr}`,
        referenceType: 'JOB_ARRIVAL',
        referenceId: job.id,
        description: `Verified on-site arrival check-in for "${job.title}"`,
      });
      pointsAwarded = 25;
    } catch (err) {
      console.warn('[JobService.verifyArrival] Points credit deferred:', err.message);
    }

    // Notify client that artisan is now on-site
    try {
      await NotificationService.createNotification(
        job.clientId,
        'Artisan Arrived On-Site 📍',
        `Your artisan has verified physical arrival for "${job.title}".`,
        `/contracts/${contract.id}`
      );
    } catch (notifErr) {
      console.warn('[JobService.verifyArrival] Notification dispatch warning:', notifErr.message);
    }

    return {
      verified: true,
      jobId: job.id,
      contractId: contract.id,
      distanceMeters,
      isGeofenceVerified,
      pointsAwarded,
      verifiedAt: new Date().toISOString(),
    };
  }
}


export default JobService;
