import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(new ApiResponse(201, result, 'Registration successful'));
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const email = req.body.email || req.body.identifier;
      const { password } = req.body;
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection?.remoteAddress;

      const result = await AuthService.login(email, password, deviceInfo, ipAddress);
      res.status(200).json(new ApiResponse(200, result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refresh(refreshToken);
      res.status(200).json(new ApiResponse(200, tokens, 'Token refreshed successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req, res, next) {
    try {
      const { identifier, otp, purpose } = req.body;
      const result = await AuthService.verifyOtp(identifier, otp, purpose);
      res.status(200).json(new ApiResponse(200, result, 'OTP verified successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      res.status(200).json(new ApiResponse(200, req.user, 'Current user profile fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(req.user.id, oldPassword, newPassword);
      res.status(200).json(new ApiResponse(200, result, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { identifier } = req.body;
      const result = await AuthService.forgotPassword(identifier);
      res.status(200).json(new ApiResponse(200, result, 'Password reset instructions sent'));
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { identifier, otp, newPassword } = req.body;
      const result = await AuthService.resetPassword(identifier, otp, newPassword);
      res.status(200).json(new ApiResponse(200, result, 'Password reset successful'));
    } catch (error) {
      next(error);
    }
  }

  static async getSessions(req, res, next) {
    try {
      const result = await AuthService.getActiveSessions(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Active login sessions fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async revokeSession(req, res, next) {
    try {
      await AuthService.revokeSession(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Session revoked successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async revokeOtherSessions(req, res, next) {
    try {
      const currentRefreshToken = req.body.refreshToken || null;
      await AuthService.revokeAllOtherSessions(req.user.id, currentRefreshToken);
      res.status(200).json(new ApiResponse(200, null, 'All other sessions revoked'));
    } catch (error) {
      next(error);
    }
  }

  static async updateAvatar(req, res, next) {
    try {
      const result = await AuthService.updateAvatar(req.user.id, req.body.avatarUrl);
      res.status(200).json(new ApiResponse(200, result, 'Avatar updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteAvatar(req, res, next) {
    try {
      const result = await AuthService.deleteAvatar(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Avatar removed successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
