import { verifyAccessToken } from '../utils/token.util.js';
import prisma from '../config/db.js';

/**
 * Optional Authentication Middleware:
 * Inspects Authorization header. If a valid JWT is present, populates `req.user`.
 * If no token is provided or invalid, proceeds gracefully without blocking the request.
 * Used for tiered data exposure (e.g. unmasking physical address for contracted parties).
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      req.user = null;
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    req.user = user || null;
    next();
  } catch {
    // If token expired or malformed, continue as unauthenticated guest
    req.user = null;
    next();
  }
}
