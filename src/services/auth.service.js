import { env } from '../config/env.js';
import prisma from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/hash.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateOtp,
} from '../utils/token.util.js';
import { ApiError } from '../utils/api-error.js';
import { SmsService } from './sms.service.js';
import { EmailService } from './email.service.js';

export class AuthService {
  static async register(data) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw ApiError.conflict('User with this email already exists');
      }
      throw ApiError.conflict('User with this phone number already exists');
    }

    const passwordHash = await hashPassword(data.password);

    // Atomic creation of User + Profile + Wallet
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          phoneNumber: data.phoneNumber,
          passwordHash,
          role: data.role,
          wallet: {
            create: {
              currency: 'NGN',
              availableBalance: 0.0,
              escrowLockedBalance: 0.0,
            },
          },
        },
      });

      if (data.role === 'ARTISAN') {
        await tx.artisanProfile.create({
          data: {
            userId: user.id,
            businessName: data.businessName || `${data.firstName || ''} Services`.trim(),
            state: data.state,
            lgaCity: data.lgaCity,
          },
        });
      } else {
        await tx.clientProfile.create({
          data: {
            userId: user.id,
            firstName: data.firstName || 'Client',
            lastName: data.lastName || 'User',
            state: data.state,
            city: data.lgaCity,
          },
        });
      }

      // Generate initial verification OTP
      const otpCode = generateOtp();
      const hashedOtp = hashToken(otpCode);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await tx.otpVerification.create({
        data: {
          identifier: user.phoneNumber,
          otpHash: hashedOtp,
          purpose: 'PHONE_VERIFICATION',
          expiresAt,
        },
      });

      return { user, otpCode };
    });

    // Dispatch OTP via SMS
    await SmsService.sendOtp(result.user.phoneNumber, result.otpCode, 'Phone Verification');

    const tokens = await this.generateUserTokens(result.user);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        phoneNumber: result.user.phoneNumber,
        role: result.user.role,
      },
      tokens,
      ...(env.NODE_ENV !== 'production' && { mockOtp: result.otpCode }),
    };
  }

  static async login(identifier, password, deviceInfo = null, ipAddress = null) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
      include: {
        artisanProfile: true,
        clientProfile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw ApiError.forbidden('Account is inactive or suspended');
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateUserTokens(user, deviceInfo, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isKycVerified: user.isKycVerified,
        artisanProfile: user.artisanProfile,
        clientProfile: user.clientProfile,
        wallet: user.wallet,
      },
      tokens,
    };
  }

  static async refresh(rawRefreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const hashedToken = hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashedToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token is invalid or revoked');
    }

    // Invalidate old token (Rotation)
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new pair
    const tokens = await this.generateUserTokens(storedToken.user);

    return tokens;
  }

  static async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;
    const hashedToken = hashToken(rawRefreshToken);
    await prisma.refreshToken.deleteMany({
      where: { tokenHash: hashedToken },
    });
  }

  static async verifyOtp(identifier, otp, purpose) {
    const hashedOtp = hashToken(otp);

    const record = await prisma.otpVerification.findFirst({
      where: {
        identifier,
        otpHash: hashedOtp,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw ApiError.badRequest('Invalid or expired OTP code');
    }

    await prisma.$transaction(async (tx) => {
      await tx.otpVerification.update({
        where: { id: record.id },
        data: { isUsed: true },
      });

      if (purpose === 'PHONE_VERIFICATION') {
        await tx.user.updateMany({
          where: { phoneNumber: identifier },
          data: { isPhoneVerified: true },
        });
      }
    });

    return { verified: true };
  }

  /**
   * Password Management
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw ApiError.badRequest('Current password does not match');
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all existing refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Password updated successfully' };
  }

  static async forgotPassword(identifier) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
    });

    if (!user) {
      // Return generic message to prevent email/phone enumeration
      return { message: 'If the account exists, a password reset code has been dispatched' };
    }

    const otpCode = generateOtp();
    const hashedOtp = hashToken(otpCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.otpVerification.create({
      data: {
        identifier,
        otpHash: hashedOtp,
        purpose: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    // Dispatch OTP via appropriate channel
    if (identifier.includes('@')) {
      await EmailService.sendOtpEmail(identifier, otpCode, 'Password Reset');
    } else {
      await SmsService.sendOtp(identifier, otpCode, 'Password Reset');
    }

    return {
      message: 'Password reset instructions dispatched',
      ...(env.NODE_ENV !== 'production' && { mockOtp: otpCode }),
    };
  }

  static async resetPassword(identifier, otp, newPassword) {
    const hashedOtp = hashToken(otp);
    const record = await prisma.otpVerification.findFirst({
      where: {
        identifier,
        otpHash: hashedOtp,
        purpose: 'PASSWORD_RESET',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw ApiError.badRequest('Invalid or expired password reset OTP code');
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
    });

    if (!user) throw ApiError.notFound('User not found');

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.otpVerification.update({
        where: { id: record.id },
        data: { isUsed: true },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      await tx.refreshToken.deleteMany({
        where: { userId: user.id },
      });
    });

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Session Management
   */
  static async getActiveSessions(userId) {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async revokeSession(userId, sessionId) {
    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw ApiError.notFound('Session not found');
    }

    return prisma.refreshToken.delete({
      where: { id: sessionId },
    });
  }

  static async revokeAllOtherSessions(userId, currentRefreshToken = null) {
    let currentTokenHash = null;
    if (currentRefreshToken) {
      currentTokenHash = hashToken(currentRefreshToken);
    }

    return prisma.refreshToken.deleteMany({
      where: {
        userId,
        ...(currentTokenHash ? { tokenHash: { not: currentTokenHash } } : {}),
      },
    });
  }

  /**
   * Avatar Management
   */
  static async updateAvatar(userId, avatarUrl) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, email: true, avatarUrl: true },
    });
  }

  static async deleteAvatar(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: { id: true, email: true, avatarUrl: true },
    });
  }

  static async generateUserTokens(user, deviceInfo = null, ipAddress = null) {
    const payload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = generateAccessToken(payload);
    const rawRefreshToken = generateRefreshToken(payload);

    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    };
  }
}

export default AuthService;
