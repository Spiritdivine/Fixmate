import { verifyAccessToken } from '../utils/token.util.js';
import { ApiError } from '../utils/api-error.js';
import prisma from '../config/db.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No authorization token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        artisanProfile: true,
        clientProfile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User not found or session expired');
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw ApiError.forbidden('Your account is inactive or suspended');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token has expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid access token'));
    }
    next(error);
  }
};

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Forbidden: Requires one of the following roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
};

export const requireVerified = (req, res, next) => {
  if (!req.user.isPhoneVerified && !req.user.isEmailVerified) {
    return next(ApiError.forbidden('Please verify your phone or email to proceed'));
  }
  next();
};
