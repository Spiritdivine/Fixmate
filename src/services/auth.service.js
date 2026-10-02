import { env } from '../config/env.js';
import prisma, { PRISMA_TX_OPTIONS } from '../config/db.js';
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
            wallet: {
              create: {
                currency: 'NGN',
                availableBalance: 0.0,
                escrowLockedBalance: 0.0,
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

        // Store Phone Verification OTP
        await tx.otpVerification.create({
          data: {
            identifier: user.phoneNumber,
            otpHash: hashedPhoneOtp,
            purpose: 'PHONE_VERIFICATION',
            expiresAt: phoneExpiry,
          },
        });

        // Store Email Verification OTP code
        await tx.otpVerification.create({
          data: {
            identifier: user.email,
            otpHash: hashedEmailOtp,
            purpose: 'EMAIL_VERIFICATION',
            expiresAt: emailExpiry,
          },
        });

        // Store Email Verification Magic Link Token
        await tx.otpVerification.create({
          data: {
            identifier: user.email,
            otpHash: hashedEmailToken,
            purpose: 'EMAIL_VERIFICATION',
            expiresAt: emailExpiry,
          },
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
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
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
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isKycVerified: user.isKycVerified,
        walletAddress: user.walletAddress,
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

    return { verified: true, purpose };
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

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
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
