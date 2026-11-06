import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from '../utils/token.util.js';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import redis from '../config/redis.js';

let ioInstance = null;

export const initSocketServer = (httpServer) => {
  const allowedOrigins = env.CLIENT_URL
    ? env.CLIENT_URL.split(',').map((url) => url.trim())
    : ['*'];

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, origin);
        }
        return callback(null, origin);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Attach Redis adapter if Redis client is configured
  if (redis) {
    try {
      const pubClient = redis.duplicate();
      const subClient = redis.duplicate();

      pubClient.on('error', (err) => {
        if (env.NODE_ENV === 'development') {
          console.warn('[Socket Redis pubClient]', err.message);
        }
      });
      subClient.on('error', (err) => {
        if (env.NODE_ENV === 'development') {
          console.warn('[Socket Redis subClient]', err.message);
        }
      });

      io.adapter(createAdapter(pubClient, subClient));
      console.log('📡 Socket.IO Redis Adapter attached for multi-core cluster scaling');
    } catch (err) {
      console.warn('⚠️ Could not attach Socket.IO Redis adapter, running in local memory mode:', err.message);
    }
  }

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!rawToken) {
        return next(new Error('Authentication error: Token missing'));
      }

      const token =
        typeof rawToken === 'string' && rawToken.startsWith('Bearer ')
          ? rawToken.slice(7).trim()
          : String(rawToken).trim();

      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join personal user room for direct push notifications & alerts
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);

    // Join specific conversation room with participant authorization
    socket.on('join_conversation', async (data) => {
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (!conversationId) return;

      try {
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.user.id,
            },
          },
        });

        if (!participant) {
          socket.emit('error', { message: 'Unauthorized access to this conversation room' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join conversation room' });
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (data) => {
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Handle real-time chat message broadcast with participant authorization
    socket.on('send_message', async (data) => {
      const { conversationId, body, messageType = 'TEXT', attachmentUrl, metadata } = data;

      try {
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.user.id,
            },
          },
        });

        if (!participant) {
          socket.emit('error', { message: 'Unauthorized: You are not a participant in this conversation' });
          return;
        }

        const msg = await prisma.$transaction(async (tx) => {
          const created = await tx.message.create({
            data: {
              conversationId,
              senderId: socket.user.id,
              messageType,
              body,
              attachmentUrl,
              metadata: metadata || null,
            },
            include: {
              sender: { select: { id: true, email: true, avatarUrl: true } },
            },
          });

          await tx.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
          });

          return created;
        });

        // Broadcast to authorized participants in the conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', msg);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        conversationId,
      });
    });

    socket.on('typing_stop', (data) => {
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        userId: socket.user.id,
        conversationId,
      });
    });

    // Mark as read real-time sync
    socket.on('mark_as_read', async (data) => {
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (!conversationId) return;

      try {
        await prisma.conversationParticipant.updateMany({
          where: { conversationId, userId: socket.user.id },
          data: { lastReadAt: new Date() },
        });

        await prisma.message.updateMany({
          where: { conversationId, senderId: { not: socket.user.id }, isRead: false },
          data: { isRead: true },
        });

        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          readerId: socket.user.id,
          readAt: new Date(),
        });
      } catch (err) {
        // Silent fail for socket read-sync
      }
    });

    // =========================================================================
    // Real-Time Emergency SOS & Artisan En-Route GPS Dispatch Tracking
    // =========================================================================

    // Join dispatch room (Client or Assigned Artisan)
    socket.on('dispatch:join', async (data) => {
      const sessionId = typeof data === 'string' ? data : data?.sessionId;
      if (!sessionId) return;

      try {
        const session = await prisma.aiDiagnosticSession.findUnique({
          where: { id: sessionId },
          select: { userId: true, sosClaimedByArtisanId: true, isSosDispatched: true },
        });

        if (!session) {
          socket.emit('error', { message: 'Diagnostic session not found' });
          return;
        }

        const isOwner = session.userId === socket.user.id;
        const isAssignedArtisan = session.sosClaimedByArtisanId === socket.user.id;
        const isAdmin = socket.user.role === 'ADMIN' || socket.user.role === 'SUPPORT';

        if (!isOwner && !isAssignedArtisan && !isAdmin) {
          socket.emit('error', { message: 'Unauthorized: You are not assigned to this dispatch' });
          return;
        }

        socket.join(`dispatch:${sessionId}`);
        socket.emit('dispatch:joined', { sessionId, isSosDispatched: session.isSosDispatched });

        // If Redis has a cached recent coordinate, emit immediately
        if (redis) {
          try {
            const cachedLoc = await redis.get(`artisan:dispatch:loc:${sessionId}`);
            if (cachedLoc) {
              socket.emit('dispatch:location_broadcast', JSON.parse(cachedLoc));
            }
          } catch (e) {
            // Non-critical
          }
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Leave dispatch room
    socket.on('dispatch:leave', (data) => {
      const sessionId = typeof data === 'string' ? data : data?.sessionId;
      if (sessionId) {
        socket.leave(`dispatch:${sessionId}`);
      }
    });

    // Artisan streams live location updates
    socket.on('dispatch:location_update', async (data) => {
      const { sessionId, latitude, longitude, heading = 0, speed = 0, accuracy = 0 } = data;
      if (!sessionId || latitude === undefined || longitude === undefined) return;

      try {
        const session = await prisma.aiDiagnosticSession.findUnique({
          where: { id: sessionId },
          select: { sosClaimedByArtisanId: true },
        });

        if (!session || session.sosClaimedByArtisanId !== socket.user.id) {
          socket.emit('error', { message: 'Unauthorized: You are not the assigned artisan for this emergency dispatch' });
          return;
        }

        const payload = {
          sessionId,
          artisanId: socket.user.id,
          latitude: Number(latitude),
          longitude: Number(longitude),
          heading: Number(heading),
          speed: Number(speed),
          accuracy: Number(accuracy),
          timestamp: new Date().toISOString(),
        };

        // Cache in Redis for instant reconnection recovery (TTL: 60s)
        if (redis) {
          try {
            await redis.set(`artisan:dispatch:loc:${sessionId}`, JSON.stringify(payload), 'EX', 60);
          } catch (e) {
            // Non-critical
          }
        }

        // Broadcast to everyone in the dispatch room (client and listening admins)
        io.to(`dispatch:${sessionId}`).emit('dispatch:location_broadcast', payload);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }
  return ioInstance;
};
