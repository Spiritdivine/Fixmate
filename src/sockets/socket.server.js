import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/token.util.js';
import prisma from '../config/db.js';
import { env } from '../config/env.js';

let ioInstance = null;

export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

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
    socket.on('join_conversation', async (conversationId) => {
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
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle real-time chat message broadcast with participant authorization
    socket.on('send_message', async (data) => {
      const { conversationId, body, messageType = 'TEXT', attachmentUrl } = data;

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
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        conversationId,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        userId: socket.user.id,
        conversationId,
      });
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
