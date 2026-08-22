import prisma from '../config/db.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';

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

      res.status(200).json(new ApiResponse(200, conversations, 'Conversations fetched'));
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

      res.status(200).json(new ApiResponse(200, messages, 'Messages fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { body, messageType = 'TEXT', attachmentUrl } = req.body;

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

      res.status(201).json(new ApiResponse(201, message, 'Message sent'));
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
}

export default ChatController;
