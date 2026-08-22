import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';

export class AdminService {
  /**
   * Job Category Management
   */
  static async createCategory(data) {
    const existing = await prisma.jobCategory.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw ApiError.conflict('Category with this slug already exists');
    }

    return prisma.jobCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parentId || null,
        iconUrl: data.iconUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  static async updateCategory(id, data) {
    const numId = Number(id);
    const category = await prisma.jobCategory.findUnique({ where: { id: numId } });
    if (!category) throw ApiError.notFound('Category not found');

    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.jobCategory.findUnique({ where: { slug: data.slug } });
      if (existing) throw ApiError.conflict('Category with this slug already exists');
    }

    return prisma.jobCategory.update({
      where: { id: numId },
      data,
    });
  }

  static async deleteCategory(id) {
    const numId = Number(id);
    const category = await prisma.jobCategory.findUnique({ where: { id: numId } });
    if (!category) throw ApiError.notFound('Category not found');

    // Deactivate rather than hard-delete to maintain historical job integrity
    return prisma.jobCategory.update({
      where: { id: numId },
      data: { isActive: false },
    });
  }

  /**
   * Skill Management
   */
  static async createSkill(data) {
    const existing = await prisma.skill.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw ApiError.conflict('Skill with this slug already exists');
    }

    return prisma.skill.create({
      data: {
        categoryId: Number(data.categoryId),
        name: data.name,
        slug: data.slug,
      },
      include: { category: true },
    });
  }

  static async updateSkill(id, data) {
    const numId = Number(id);
    const skill = await prisma.skill.findUnique({ where: { id: numId } });
    if (!skill) throw ApiError.notFound('Skill not found');

    return prisma.skill.update({
      where: { id: numId },
      data: {
        ...(data.categoryId ? { categoryId: Number(data.categoryId) } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
      },
      include: { category: true },
    });
  }

  static async deleteSkill(id) {
    const numId = Number(id);
    const skill = await prisma.skill.findUnique({ where: { id: numId } });
    if (!skill) throw ApiError.notFound('Skill not found');

    return prisma.skill.delete({
      where: { id: numId },
    });
  }

  /**
   * User Management & Suspension with Audit Log
   */
  static async updateUserStatus(adminId, userId, status, reason) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { status },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          isKycVerified: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: `USER_STATUS_CHANGE_${status}`,
          entityType: 'User',
          entityId: userId,
          oldState: { status: user.status },
          newState: { status, reason },
        },
      });

      return updatedUser;
    });
  }

  /**
   * Audit Logs
   */
  static async getAuditLogs({ page = 1, limit = 50, action, entityType } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
      ...(entityType ? { entityType: { equals: entityType, mode: 'insensitive' } } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          actor: { select: { id: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({ ...l, id: l.id.toString() })),
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * System Settings
   */
  static async getSystemSettings() {
    return prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  static async updateSystemSetting(adminId, key, value, description) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        ...(description ? { description } : {}),
        updatedBy: adminId,
      },
      create: {
        key,
        value,
        description: description || null,
        updatedBy: adminId,
      },
    });
  }
}

export default AdminService;
