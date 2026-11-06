import crypto from 'crypto';
import { env } from '../config/env.js';
import prisma, { PRISMA_TX_OPTIONS } from '../config/db.js';
import { redisCache } from '../config/redis.js';
import { hashPassword, comparePassword } from '../utils/hash.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateOtp,
  generateSecureToken,
} from '../utils/token.util.js';
import { ApiError } from '../utils/api-error.js';
import { SmsService } from './sms.service.js';
import { EmailService } from './email.service.js';
import { PrivyService } from './privy.service.js';
import { ReferralService } from './referral.service.js';
import { SocialAuthService } from './social-auth.service.js';
import { OtpService, normalizePhoneNumber } from './otp.service.js';
import { generateReferralCode } from '../utils/code-generator.js';
import { ethers } from 'ethers';

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

    // Pre-generate phone and email verification credentials
    const phoneOtpCode = generateOtp();
    const hashedPhoneOtp = hashToken(phoneOtpCode);

    const emailOtpCode = generateOtp();
    const hashedEmailOtp = hashToken(emailOtpCode);

    const emailToken = generateSecureToken(32);
    const hashedEmailToken = hashToken(emailToken);

    const phoneExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    const emailExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Resolve embedded EVM wallet address from direct input or Privy auth token
    let resolvedWalletAddress = data.walletAddress ? data.walletAddress.trim() : null;
    if (!resolvedWalletAddress && data.privyAuthToken) {
      try {
        const claims = await PrivyService.verifyAuthToken(data.privyAuthToken);
        if (claims && claims.userId) {
          resolvedWalletAddress = await PrivyService.getEmbeddedWalletAddress(claims.userId);
        }
      } catch (privyErr) {
        console.warn('[AuthService.register] Privy token verification deferred:', privyErr.message);
      }
    }

    if (resolvedWalletAddress) {
      const existingWalletUser = await prisma.user.findFirst({
        where: { walletAddress: { equals: resolvedWalletAddress, mode: 'insensitive' } },
      });
      if (existingWalletUser) {
        resolvedWalletAddress = null; // Prevent duplicate collision, fallback to fresh Privy embedded wallet
      }
    }

    // Automatically provision a non-custodial EVM embedded wallet via Privy Server API if not yet present
    if (!resolvedWalletAddress) {
      if (PrivyService.isConfigured()) {
        try {
          const serverWallet = await PrivyService.createServerWallet();
          if (serverWallet?.address) {
            resolvedWalletAddress = serverWallet.address;
            console.log(`[AuthService.register] Automatically provisioned Privy wallet for ${data.email}: ${resolvedWalletAddress}`);
          }
        } catch (privyCreateErr) {
          console.warn('[AuthService.register] Automatic Privy wallet creation deferred:', privyCreateErr.message);
        }
      }

      // Safe EVM fallback if Privy API is temporarily throttled or unavailable
      if (!resolvedWalletAddress) {
        try {
          const randomWallet = ethers.Wallet.createRandom();
          resolvedWalletAddress = randomWallet.address;
          console.log(`[AuthService.register] Provisioned fallback EVM wallet for ${data.email}: ${resolvedWalletAddress}`);
        } catch (fallbackErr) {
          console.warn('[AuthService.register] Fallback wallet generation failed:', fallbackErr.message);
        }
      }
    }

    // Atomic creation of User + Profile + Wallet + OTPs in a resilient transaction
    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email: data.email.toLowerCase().trim(),
            phoneNumber: data.phoneNumber.trim(),
            passwordHash,
            role: data.role,
            isEmailVerified: false,
            isPhoneVerified: false,
            walletAddress: resolvedWalletAddress,
            referralCode: generateReferralCode('FIX'),
            wallet: {
              create: {
                currency: 'NGN',
                availableBalance: 0.0,
                escrowLockedBalance: 0.0,
              },
            },
            pointWallet: {
              create: {
                availablePoints: 0,
                lockedPoints: 0,
                lifetimeEarned: 0,
                lifetimeBurned: 0,
                tier: 'BRONZE',
              },
            },
            ...(data.role === 'ARTISAN'
              ? {
                  artisanProfile: {
                    create: {
                      firstName: data.firstName?.trim() || null,
                      lastName: data.lastName?.trim() || null,
                      businessName: data.businessName?.trim() || 'New Artisan Service',
                      state: data.state?.trim() || 'Lagos',
                      lgaCity: data.lgaCity?.trim() || 'Ikeja',
                    },
                  },
                }
              : {
                  clientProfile: {
                    create: {
                      firstName: data.firstName?.trim() || '',
                      lastName: data.lastName?.trim() || '',
                      state: data.state?.trim() || 'Lagos',
                      city: (data.lgaCity || data.city)?.trim() || 'Ikeja',
                    },
                  },
                }),
          },
        });

        // Store Phone & Email Verification OTPs in a single batch
        await tx.otpVerification.createMany({
          data: [
            {
              identifier: user.phoneNumber,
              otpHash: hashedPhoneOtp,
              purpose: 'PHONE_VERIFICATION',
              expiresAt: phoneExpiry,
            },
            {
              identifier: user.email,
              otpHash: hashedEmailOtp,
              purpose: 'EMAIL_VERIFICATION',
              expiresAt: emailExpiry,
            },
            {
              identifier: user.email,
              otpHash: hashedEmailToken,
              purpose: 'EMAIL_VERIFICATION',
              expiresAt: emailExpiry,
            },
          ],
        });

        return { user, phoneOtpCode, emailOtpCode, emailToken };
      },
      PRISMA_TX_OPTIONS
    );

    // Dispatch verification credentials asynchronously without blocking registration
    try {
      await SmsService.sendOtp(result.user.phoneNumber, result.phoneOtpCode, 'Phone Verification');
    } catch (err) {
      console.warn(`[AuthService] SMS dispatch warning: ${err.message}`);
    }

    try {
      const clientUrl = (env.CLIENT_URL && !env.CLIENT_URL.includes('*'))
        ? env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '')
        : (process.env.CLIENT_URL || 'https://artifixhq.xyz');
      const verificationUrl = `${clientUrl}/verify-email?email=${encodeURIComponent(result.user.email)}&token=${result.emailToken}`;
      await EmailService.sendVerificationEmail(
        result.user.email,
        result.emailOtpCode,
        verificationUrl,
        data.firstName || data.businessName || 'Valued Member'
      );
    } catch (err) {
      console.warn(`[AuthService] Email dispatch warning: ${err.message}`);
    }

    // Process referral attribution if code was supplied
    if (data.referralCode) {
      try {
        await ReferralService.registerReferralAttribution({
          refereeId: result.user.id,
          referralCode: data.referralCode,
          clientIp: data.clientIp || null,
          deviceData: data.deviceData || null,
        });
      } catch (refErr) {
        console.warn(`[AuthService] Referral attribution warning: ${refErr.message}`);
      }
    }

    const tokens = await this.generateUserTokens(result.user);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        phoneNumber: result.user.phoneNumber,
        role: result.user.role,
        isEmailVerified: false,
        isPhoneVerified: false,
        walletAddress: result.user.walletAddress,
      },
      tokens,
      ...(env.NODE_ENV !== 'production' && {
        mockPhoneOtp: result.phoneOtpCode,
        mockEmailOtp: result.emailOtpCode,
      }),
    };
  }

  static async login(identifier, password, deviceInfo = null, ipAddress = null) {
    const isEmail = identifier.includes('@');
    const cleanIdentifier = isEmail
      ? identifier.toLowerCase().trim()
      : normalizePhoneNumber(identifier);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanIdentifier }, { phoneNumber: cleanIdentifier }],
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
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isKycVerified: user.isKycVerified,
        walletAddress: user.walletAddress,
        hasTransactionPin: Boolean(user.transactionPinHash),
        artisanProfile: user.artisanProfile,
        clientProfile: user.clientProfile,
        wallet: user.wallet,
      },
      tokens,
    };
  }

  static async refresh(rawRefreshToken, deviceInfo = null, ipAddress = null) {
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

    if (!storedToken) {
      throw ApiError.unauthorized('Refresh token was not recognized');
    }

    // Token Reuse Detection (RTR): If a rotated/revoked token is used, suspect theft
    if (storedToken.isRevoked) {
      console.warn(`🚨 [SECURITY ALERT] Refresh token reuse detected for user ${storedToken.userId}! Family: ${storedToken.familyId}`);

      // Invalidate all tokens in the lineage family
      if (storedToken.familyId) {
        await prisma.refreshToken.updateMany({
          where: { familyId: storedToken.familyId },
          data: { isRevoked: true },
        });
      }

      // Evict all active sessions in Redis
      await redisCache.delByPattern(`session:${storedToken.userId}:*`);

      throw ApiError.unauthorized(
        'Token reuse detected. All active sessions in this family have been terminated for security.'
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token has expired');
    }

    // Invalidate old token (Rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new pair within the same token family
    const tokens = await this.generateUserTokens(
      storedToken.user,
      deviceInfo || storedToken.deviceInfo,
      ipAddress || storedToken.ipAddress,
      storedToken.familyId
    );

    return tokens;
  }

  static async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;
    try {
      const hashedToken = hashToken(rawRefreshToken);
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashedToken },
      });

      if (storedToken) {
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        if (storedToken.userId) {
          await redisCache.delByPattern(`session:${storedToken.userId}:*`);
        }
      }
    } catch (err) {
      console.warn('[AuthService.logout] Session cleanup error:', err.message);
    }
  }

  static async verifyOtp(identifier, otp, purpose) {
    const cleanIdentifier =
      purpose === 'EMAIL_VERIFICATION' ? identifier.toLowerCase().trim() : identifier.trim();
    const hashedOtp = hashToken(otp);

    const record = await prisma.otpVerification.findFirst({
      where: {
        identifier: cleanIdentifier,
        otpHash: hashedOtp,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw ApiError.badRequest('Invalid or expired OTP code');
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.otpVerification.update({
          where: { id: record.id },
          data: { isUsed: true },
        });

        if (purpose === 'PHONE_VERIFICATION') {
          await tx.user.updateMany({
            where: { phoneNumber: cleanIdentifier },
            data: { isPhoneVerified: true },
          });
        } else if (purpose === 'EMAIL_VERIFICATION') {
          await tx.user.updateMany({
            where: { email: cleanIdentifier },
            data: { isEmailVerified: true },
          });
        }
      },
      PRISMA_TX_OPTIONS
    );

    const updatedUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanIdentifier }, { phoneNumber: cleanIdentifier }],
      },
      include: {
        artisanProfile: true,
        clientProfile: true,
        wallet: true,
      },
    });

    let tokens = null;
    if (updatedUser) {
      tokens = await this.generateUserTokens(updatedUser);
    }

    return {
      verified: true,
      purpose,
      user: updatedUser
        ? {
            id: updatedUser.id,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            role: updatedUser.role,
            isEmailVerified: updatedUser.isEmailVerified,
            isPhoneVerified: updatedUser.isPhoneVerified,
            walletAddress: updatedUser.walletAddress,
            referralCode: updatedUser.referralCode,
            clientProfile: updatedUser.clientProfile,
            artisanProfile: updatedUser.artisanProfile,
          }
        : null,
      tokens,
      accessToken: tokens?.accessToken,
      refreshToken: tokens?.refreshToken,
    };
  }

  /**
   * Verify Email using One-Click Magic Link Token
   */
  static async verifyEmailToken(email, rawToken) {
    const cleanEmail = email.toLowerCase().trim();
    const hashedToken = hashToken(rawToken);

    const record = await prisma.otpVerification.findFirst({
      where: {
        identifier: cleanEmail,
        otpHash: hashedToken,
        purpose: 'EMAIL_VERIFICATION',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw ApiError.badRequest('Invalid or expired verification link');
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.otpVerification.update({
          where: { id: record.id },
          data: { isUsed: true },
        });

        await tx.user.updateMany({
          where: { email: cleanEmail },
          data: { isEmailVerified: true },
        });
      },
      PRISMA_TX_OPTIONS
    );

    return { verified: true, email: cleanEmail };
  }

  /**
   * Resend OTP or Verification Credentials with Rate Limiting (60s Cooldown)
   */
  static async resendOtp(identifier, purpose) {
    const cleanIdentifier = identifier.trim();

    // 1. Verify that user exists
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { phoneNumber: cleanIdentifier },
        ],
      },
      include: { clientProfile: true, artisanProfile: true },
    });

    if (!user) {
      // Avoid enumeration
      return { message: 'If the account exists, a new verification code has been dispatched' };
    }

    // 2. Prevent resending if already verified
    if (purpose === 'EMAIL_VERIFICATION' && user.isEmailVerified) {
      throw ApiError.badRequest('This email address is already verified');
    }
    if (purpose === 'PHONE_VERIFICATION' && user.isPhoneVerified) {
      throw ApiError.badRequest('This phone number is already verified');
    }

    // 3. Enforce 60-second cooldown rate limiting
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        identifier: cleanIdentifier,
        purpose,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const elapsedMs = Date.now() - new Date(recentOtp.createdAt).getTime();
      const cooldownMs = 60 * 1000;
      if (elapsedMs < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
        throw ApiError.tooManyRequests(`Please wait ${remainingSec} seconds before requesting a new code`);
      }
    }

    // 4. Invalidate prior unused OTPs for this identifier & purpose
    await prisma.otpVerification.updateMany({
      where: {
        identifier: cleanIdentifier,
        purpose,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // 5. Generate fresh OTP credentials
    const otpCode = generateOtp();
    const hashedOtp = hashToken(otpCode);
    const expiresAt = new Date(Date.now() + (purpose === 'EMAIL_VERIFICATION' ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000));

    await prisma.otpVerification.create({
      data: {
        identifier: cleanIdentifier,
        otpHash: hashedOtp,
        purpose,
        expiresAt,
      },
    });

    // 6. Dispatch via appropriate channel
    const firstName = user.clientProfile?.firstName || user.artisanProfile?.businessName || 'Valued Member';

    if (purpose === 'EMAIL_VERIFICATION') {
      const magicToken = generateSecureToken(32);
      const hashedMagicToken = hashToken(magicToken);

      await prisma.otpVerification.create({
        data: {
          identifier: cleanIdentifier,
          otpHash: hashedMagicToken,
          purpose: 'EMAIL_VERIFICATION',
          expiresAt,
        },
      });

      const clientUrl = (env.CLIENT_URL && !env.CLIENT_URL.includes('*'))
        ? env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '')
        : (process.env.CLIENT_URL || 'https://artifixhq.xyz');
      const verificationUrl = `${clientUrl}/verify-email?email=${encodeURIComponent(cleanIdentifier)}&token=${magicToken}`;
      await EmailService.sendVerificationEmail(cleanIdentifier, otpCode, verificationUrl, firstName);
    } else if (purpose === 'PHONE_VERIFICATION') {
      await SmsService.sendOtp(cleanIdentifier, otpCode, 'Phone Verification');
    } else if (purpose === 'PASSWORD_RESET') {
      if (cleanIdentifier.includes('@')) {
        await EmailService.sendOtpEmail(cleanIdentifier, otpCode, 'Password Reset');
      } else {
        await SmsService.sendOtp(cleanIdentifier, otpCode, 'Password Reset');
      }
    }

    return {
      message: 'A fresh verification code has been dispatched',
      ...(env.NODE_ENV !== 'production' && { mockOtp: otpCode }),
    };
  }

  /**
   * Send Email Verification for currently logged-in user
   */
  static async sendEmailVerification(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw ApiError.notFound('User not found');
    if (user.isEmailVerified) throw ApiError.badRequest('Email is already verified');

    return this.resendOtp(user.email, 'EMAIL_VERIFICATION');
  }

  /**
   * Self-Service Account Deactivation / Soft Delete
   */
  static async deleteAccount(userId, password, reason = null) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.badRequest('Incorrect password');
    }

    // Safety check: ensure no active locked escrow balance
    if (user.wallet && Number(user.wallet.escrowLockedBalance) > 0) {
      throw ApiError.badRequest(
        'Cannot deactivate account with locked escrow funds. Please resolve all open contracts first.'
      );
    }

    // Update status to DEACTIVATED and soft delete
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: 'DEACTIVATED',
          deletedAt: new Date(),
        },
      });

      // Revoke all refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId },
      });
    });

    return { message: 'Account deactivated successfully' };
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

    // Evict all active Redis sessions
    try {
      await redisCache.delByPattern(`session:${userId}:*`);
    } catch {
      // Redis optional eviction
    }

    return { message: 'Password updated successfully' };
  }

  static async forgotPassword(identifier) {
    const isEmail = identifier.includes('@');
    const cleanIdentifier = isEmail
      ? identifier.toLowerCase().trim()
      : normalizePhoneNumber(identifier);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanIdentifier }, { phoneNumber: cleanIdentifier }],
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
        identifier: cleanIdentifier,
        otpHash: hashedOtp,
        purpose: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    // Dispatch OTP via appropriate channel
    if (isEmail) {
      await EmailService.sendOtpEmail(cleanIdentifier, otpCode, 'Password Reset');
    } else {
      await SmsService.sendOtp(cleanIdentifier, otpCode, 'Password Reset');
    }

    return {
      message: 'Password reset instructions dispatched',
      ...(env.NODE_ENV !== 'production' && { mockOtp: otpCode }),
    };
  }

  static async resetPassword(identifier, otp, newPassword) {
    const isEmail = identifier.includes('@');
    const cleanIdentifier = isEmail
      ? identifier.toLowerCase().trim()
      : normalizePhoneNumber(identifier);

    const hashedOtp = hashToken(otp);
    const record = await prisma.otpVerification.findFirst({
      where: {
        identifier: cleanIdentifier,
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
        OR: [{ email: cleanIdentifier }, { phoneNumber: cleanIdentifier }],
      },
    });

    if (!user) throw ApiError.notFound('User not found');

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(
      async (tx) => {
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
      },
      PRISMA_TX_OPTIONS
    );

    // Evict all active Redis sessions
    try {
      await redisCache.delByPattern(`session:${user.id}:*`);
    } catch {
      // Redis optional eviction
    }

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

  static async generateUserTokens(user, deviceInfo = null, ipAddress = null, familyId = null) {
    const sessionId = crypto.randomUUID();
    const tokenFamilyId = familyId || crypto.randomUUID();

    const payload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      sessionId,
      familyId: tokenFamilyId,
    };
    const accessToken = generateAccessToken(payload);
    const rawRefreshToken = generateRefreshToken(payload);

    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId: tokenFamilyId,
        deviceInfo,
        ipAddress,
        expiresAt,
      },
    });

    // Cache active session in Redis for instant revocation & role sync
    const sessionTtl = 7 * 24 * 60 * 60; // 7 days
    await redisCache.set(
      `session:${user.id}:${sessionId}`,
      JSON.stringify({ userId: user.id, role: user.role, active: true }),
      sessionTtl
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      sessionId,
    };
  }

  /**
   * Seamless multi-role switching (CLIENT <-> ARTISAN)
   */
  static async switchRole(userId, targetRole) {
    if (!['CLIENT', 'ARTISAN'].includes(targetRole)) {
      throw ApiError.badRequest('Role must be CLIENT or ARTISAN');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true, artisanProfile: true, wallet: true },
    });

    if (!user) throw ApiError.notFound('User not found');

    // If switching to ARTISAN, ensure artisan profile exists or provision default profile
    if (targetRole === 'ARTISAN' && !user.artisanProfile) {
      await prisma.artisanProfile.create({
        data: {
          userId: user.id,
          state: 'Lagos',
          lgaCity: 'Ikeja',
          yearsOfExperience: 1,
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: targetRole },
      include: { clientProfile: true, artisanProfile: true, wallet: true },
    });

    // Evict old session caches so next request instantly reflects new role
    await redisCache.delByPattern(`session:${userId}:*`);

    const tokens = await this.generateUserTokens(updatedUser);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        isEmailVerified: updatedUser.isEmailVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
        isKycVerified: updatedUser.isKycVerified,
        artisanProfile: updatedUser.artisanProfile,
        clientProfile: updatedUser.clientProfile,
        wallet: updatedUser.wallet,
      },
      tokens,
    };
  }

  /**
   * Set 4-digit transaction/escrow security PIN
   */
  static async setTransactionPin(userId, pin) {
    if (!pin || !/^\d{4}$/.test(String(pin))) {
      throw ApiError.badRequest('Security PIN must be exactly 4 digits');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    if (user.transactionPinHash) {
      throw ApiError.badRequest('A security PIN is already configured on this account. Please use the change PIN workflow.');
    }

    const pinHash = await hashPassword(String(pin));
    await prisma.user.update({
      where: { id: userId },
      data: { transactionPinHash: pinHash },
    });

    return { success: true, message: '4-digit transaction PIN set successfully' };
  }

  /**
   * Change 4-digit transaction/escrow security PIN
   */
  static async changeTransactionPin(userId, currentPin, newPin) {
    if (!newPin || !/^\d{4}$/.test(String(newPin))) {
      throw ApiError.badRequest('New PIN must be exactly 4 digits');
    }

    const lockoutKey = `pin_lockout:${userId}`;
    const isLocked = await redisCache.get(lockoutKey);
    if (isLocked) {
      throw ApiError.forbidden('Too many failed PIN attempts. Your transaction PIN is locked for 15 minutes.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    if (user.transactionPinHash) {
      if (!currentPin) {
        throw ApiError.badRequest('Current PIN is required to set a new PIN');
      }
      const isMatch = await comparePassword(String(currentPin), user.transactionPinHash);
      if (!isMatch) {
        const attemptsKey = `pin_attempts:${userId}`;
        const attemptsStr = await redisCache.get(attemptsKey);
        const currentAttempts = (Number(attemptsStr) || 0) + 1;
        if (currentAttempts >= 5) {
          await redisCache.set(lockoutKey, 'LOCKED', 900);
          await redisCache.del(attemptsKey);
          throw ApiError.forbidden('Too many failed attempts. Transaction PIN locked for 15 minutes.');
        } else {
          await redisCache.set(attemptsKey, currentAttempts, 900);
          const remaining = 5 - currentAttempts;
          throw ApiError.badRequest(`Current PIN is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        }
      }
    }

    await redisCache.del(`pin_attempts:${userId}`);
    const pinHash = await hashPassword(String(newPin));
    await prisma.user.update({
      where: { id: userId },
      data: { transactionPinHash: pinHash },
    });

    return { success: true, message: 'Security PIN changed successfully' };
  }

  /**
   * Verify 4-digit transaction PIN and issue single-use Step-Up authorization ticket
   */
  static async verifyTransactionPin(userId, pin) {
    if (!pin) throw ApiError.badRequest('PIN is required');

    // 1. Check if user is temporarily locked out
    const lockoutKey = `pin_lockout:${userId}`;
    const isLocked = await redisCache.get(lockoutKey);
    if (isLocked) {
      throw ApiError.forbidden('Too many failed PIN attempts. Your transaction PIN is locked for 15 minutes for your security.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    if (!user.transactionPinHash) {
      throw ApiError.badRequest('No transaction PIN configured. Please set a 4-digit PIN in settings.');
    }

    const isMatch = await comparePassword(String(pin), user.transactionPinHash);
    const attemptsKey = `pin_attempts:${userId}`;

    if (!isMatch) {
      const attemptsStr = await redisCache.get(attemptsKey);
      const currentAttempts = (Number(attemptsStr) || 0) + 1;

      if (currentAttempts >= 5) {
        await redisCache.set(lockoutKey, 'LOCKED', 900); // 15-minute lockout
        await redisCache.del(attemptsKey);
        throw ApiError.forbidden('Too many failed attempts. Transaction PIN locked for 15 minutes.');
      } else {
        await redisCache.set(attemptsKey, currentAttempts, 900);
        const remaining = 5 - currentAttempts;
        throw ApiError.badRequest(`Incorrect 4-digit security PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before temporary lockout.`);
      }
    }

    // PIN matched: clear failure counter
    await redisCache.del(attemptsKey);

    // Issue single-use 5-minute step-up ticket in Redis
    const ticket = crypto.randomBytes(24).toString('hex');
    await redisCache.set(`stepup:${userId}:TRANSACTION_PIN:${ticket}`, 'VALID', 300);

    return { verified: true, stepUpTicket: ticket };
  }

  /**
   * Native Social Login (Google / Apple) with automated embedded EVM wallet provisioning
   */
  static async socialLogin(provider, idToken, requestedRole = 'CLIENT', deviceInfo = null, ipAddress = null) {
    let socialIdentity;
    if (provider === 'GOOGLE') {
      socialIdentity = await SocialAuthService.verifyGoogleToken(idToken);
    } else if (provider === 'APPLE') {
      socialIdentity = await SocialAuthService.verifyAppleToken(idToken);
    } else {
      throw ApiError.badRequest(`Unsupported social provider: ${provider}`);
    }

    const role = ['CLIENT', 'ARTISAN'].includes(requestedRole) ? requestedRole : 'CLIENT';

    // 1. Check if user exists by social provider and social ID
    let user = await prisma.user.findFirst({
      where: {
        socialProvider: provider,
        socialId: socialIdentity.providerId,
      },
      include: {
        artisanProfile: true,
        clientProfile: true,
        wallet: true,
      },
    });

    // 2. Fallback to matching by verified email
    if (!user && socialIdentity.email) {
      user = await prisma.user.findUnique({
        where: { email: socialIdentity.email },
        include: {
          artisanProfile: true,
          clientProfile: true,
          wallet: true,
        },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            socialProvider: provider,
            socialId: socialIdentity.providerId,
            isEmailVerified: true,
            avatarUrl: user.avatarUrl || socialIdentity.avatarUrl,
          },
          include: {
            artisanProfile: true,
            clientProfile: true,
            wallet: true,
          },
        });
      }
    }

    let isNewUser = false;
    // 3. Register user if not existing
    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(randomPassword);

      // Embedded wallet resolution via Privy
      let walletAddress = null;
      if (PrivyService.isConfigured()) {
        try {
          const serverWallet = await PrivyService.createServerWallet();
          walletAddress = serverWallet?.address || null;
        } catch {
          // ignore
        }
      }
      if (!walletAddress) {
        try {
          walletAddress = ethers.Wallet.createRandom().address;
        } catch {}
      }

      const email = socialIdentity.email || `${socialIdentity.providerId}@${provider.toLowerCase()}.artifix`;

      // Retry up to 3 times to guarantee phone collision resistance
      let createdUser = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const dummyPhone = `+234${Math.floor(7000000000 + Math.random() * 2999999999)}`;
        try {
          createdUser = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                email,
                phoneNumber: dummyPhone,
                passwordHash,
                role,
                isEmailVerified: true,
                isPhoneVerified: false,
                socialProvider: provider,
                socialId: socialIdentity.providerId,
                avatarUrl: socialIdentity.avatarUrl,
                walletAddress,
                referralCode: generateReferralCode('FIX'),
                wallet: {
                  create: {
                    currency: 'NGN',
                    availableBalance: 0.0,
                    escrowLockedBalance: 0.0,
                  },
                },
                pointWallet: {
                  create: {
                    availablePoints: 0,
                    lockedPoints: 0,
                    lifetimeEarned: 0,
                    lifetimeBurned: 0,
                    tier: 'BRONZE',
                  },
                },
                ...(role === 'ARTISAN'
                  ? {
                      artisanProfile: {
                        create: {
                          firstName: socialIdentity.firstName || null,
                          lastName: socialIdentity.lastName || null,
                          businessName: `${socialIdentity.firstName || 'Artisan'}'s Services`,
                          state: 'Lagos',
                          lgaCity: 'Ikeja',
                        },
                      },
                    }
                  : {
                      clientProfile: {
                        create: {
                          firstName: socialIdentity.firstName || '',
                          lastName: socialIdentity.lastName || '',
                          state: 'Lagos',
                          city: 'Ikeja',
                        },
                      },
                    }),
              },
            });

            return tx.user.findUnique({
              where: { id: newUser.id },
              include: { artisanProfile: true, clientProfile: true, wallet: true },
            });
          }, PRISMA_TX_OPTIONS);
          break;
        } catch (err) {
          if (err.code === 'P2002' && err.meta?.target?.includes('phone') && attempt < 2) {
            continue;
          }
          throw err;
        }
      }
      user = createdUser;
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw ApiError.forbidden('Account is inactive or suspended');
    }

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
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isKycVerified: user.isKycVerified,
        avatarUrl: user.avatarUrl,
        walletAddress: user.walletAddress,
        artisanProfile: user.artisanProfile,
        clientProfile: user.clientProfile,
        wallet: user.wallet,
      },
      tokens,
      isNewUser,
    };
  }
}

export default AuthService;
