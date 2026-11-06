import prisma from '../config/db.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { getIO } from '../sockets/socket.server.js';

export class ChatController {
  static async getConversations(req, res, next) {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: { some: { userId: req.user.id } },
        },
        include: {
          job: { select: { id: true, title: true } },
          contract: { select: { id: true, contractCode: true, status: true } },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  avatarUrl: true,
                  artisanProfile: { select: { businessName: true } },
                  clientProfile: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      if (conversations.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], 'Conversations fetched'));
      }

      // Single SQL batch query to compute unread counts for all conversations at once (Eliminating N+1 queries)
      const convIds = conversations.map((c) => c.id);
      const unreadCountsRaw = await prisma.$queryRaw`
        SELECT m.conversation_id, COUNT(m.id)::int AS unread_count
        FROM messages m
        INNER JOIN conversation_participants cp 
          ON cp.conversation_id = m.conversation_id 
          AND cp.user_id = ${req.user.id}::uuid
        WHERE m.conversation_id = ANY(${convIds}::uuid[])
          AND m.sender_id != ${req.user.id}::uuid
          AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
        GROUP BY m.conversation_id
      `;

      const unreadCountMap = new Map(
        unreadCountsRaw.map((row) => [row.conversation_id, Number(row.unread_count)])
      );

      const enriched = conversations.map((conv) => ({
        ...conv,
        unreadCount: unreadCountMap.get(conv.id) || 0,
      }));

      res.status(200).json(new ApiResponse(200, enriched, 'Conversations fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;

      const isParticipant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId: req.user.id,
          },
        },
      });

      if (!isParticipant) throw ApiError.forbidden('Unauthorized access to conversation');

      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      // Update last read
      await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: req.user.id } },
        data: { lastReadAt: new Date() },
      });

      await prisma.message.updateMany({
        where: { conversationId, senderId: { not: req.user.id }, isRead: false },
        data: { isRead: true },
      });

      try {
        const io = getIO();
        io.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          readerId: req.user.id,
          readAt: new Date(),
        });
      } catch {}

      res.status(200).json(new ApiResponse(200, messages, 'Messages fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { body, messageType = 'TEXT', attachmentUrl, metadata } = req.body;

      const isParticipant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId: req.user.id,
          },
        },
      });

      if (!isParticipant) throw ApiError.forbidden('Unauthorized to send message in this conversation');

      const message = await prisma.$transaction(async (tx) => {
        const msg = await tx.message.create({
          data: {
            conversationId,
            senderId: req.user.id,
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

        return msg;
      });

      // Real-time broadcast to room
      try {
        const io = getIO();
        io.to(`conversation:${conversationId}`).emit('new_message', message);
      } catch {}

      res.status(201).json(new ApiResponse(201, message, 'Message sent'));
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.conversationParticipant.updateMany({
        where: { conversationId: id, userId: req.user.id },
        data: { lastReadAt: new Date() },
      });

      await prisma.message.updateMany({
        where: { conversationId: id, senderId: { not: req.user.id }, isRead: false },
        data: { isRead: true },
      });

      try {
        const io = getIO();
        io.to(`conversation:${id}`).emit('messages_read', {
          conversationId: id,
          readerId: req.user.id,
          readAt: new Date(),
        });
      } catch {}

      res.status(200).json(new ApiResponse(200, null, 'Conversation marked as read'));
    } catch (error) {
      next(error);
    }
  }

  static async editMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const { body } = req.body;

      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message) throw ApiError.notFound('Message not found');
      if (message.senderId !== req.user.id) throw ApiError.forbidden('Unauthorized: not message sender');

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { body },
      });

      res.status(200).json(new ApiResponse(200, updated, 'Message edited successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message) throw ApiError.notFound('Message not found');
      if (message.senderId !== req.user.id) throw ApiError.forbidden('Unauthorized: not message sender');

      await prisma.message.delete({ where: { id: messageId } });
      res.status(200).json(new ApiResponse(200, null, 'Message deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async toggleMute(req, res, next) {
    try {
      const { id } = req.params;
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: id, userId: req.user.id } },
      });

      if (!participant) throw ApiError.notFound('Conversation participant record not found');

      const updated = await prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { isMuted: !participant.isMuted },
      });

      res.status(200).json(new ApiResponse(200, updated, `Conversation ${updated.isMuted ? 'muted' : 'unmuted'}`));
    } catch (error) {
      next(error);
    }
  }

  static async leaveConversation(req, res, next) {
    try {
      const { id } = req.params;
      await prisma.conversationParticipant.deleteMany({
        where: { conversationId: id, userId: req.user.id },
      });

      res.status(200).json(new ApiResponse(200, null, 'Left conversation successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getOrCreateArtisanConversation(req, res, next) {
    try {
      const { artisanId } = req.params;
      const currentUserId = req.user.id;

      let artisanUserId = null;
      const profile = await prisma.artisanProfile.findFirst({
        where: {
          OR: [
            { id: artisanId },
            { userId: artisanId },
          ],
        },
        select: { userId: true },
      });

      if (profile) {
        artisanUserId = profile.userId;
      } else {
        const user = await prisma.user.findUnique({
          where: { id: artisanId },
          select: { id: true, role: true },
        });
        if (user) artisanUserId = user.id;
      }

      if (!artisanUserId) {
        throw ApiError.notFound('Artisan account not found');
      }

      const { contextJobId, jobId } = req.body || {};
      const refJobId = contextJobId || jobId;

      let conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: currentUserId } } },
            { participants: { some: { userId: artisanUserId } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  avatarUrl: true,
                  artisanProfile: { select: { businessName: true } },
                  clientProfile: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId: currentUserId },
                { userId: artisanUserId },
              ],
            },
          },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    avatarUrl: true,
                    artisanProfile: { select: { businessName: true } },
                    clientProfile: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
            messages: {
              take: 1,
            },
          },
        });
      }

      // If routed from a job post, attach a non-duplicating context tag
      if (refJobId) {
        try {
          const job = await prisma.job.findUnique({
            where: { id: refJobId },
            select: { id: true, title: true },
          });

          if (job) {
            const lastMsg = conversation.messages?.[0];
            const contextNotice = `Regarding Job Request: "${job.title}"`;
            const alreadyTagged = lastMsg && lastMsg.body && lastMsg.body.includes(job.title);

            if (!alreadyTagged) {
              const systemMsg = await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  senderId: currentUserId,
                  messageType: 'SYSTEM_ALERT',
                  body: contextNotice,
                  metadata: {
                    jobId: job.id,
                    jobTitle: job.title,
                    type: 'JOB_CONTEXT_HEADER',
                  },
                },
                include: {
                  sender: { select: { id: true, email: true, avatarUrl: true } },
                },
              });

              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() },
              });

              try {
                const io = getIO();
                io.to(`conversation:${conversation.id}`).emit('new_message', systemMsg);
              } catch {}
            }
          }
        } catch (jobErr) {
          console.warn('[ChatController] Context job lookup warning:', jobErr.message);
        }
      }

      res.status(200).json(new ApiResponse(200, conversation, 'Artisan conversation retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export default ChatController;
