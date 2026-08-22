import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  sendMessageSchema,
  editMessageSchema,
  conversationParamSchema,
} from '../validators/chat.validator.js';

const router = Router();

// Conversations
router.get('/conversations', authenticate, ChatController.getConversations);
router.patch('/conversations/:id/mute', authenticate, validate(conversationParamSchema), ChatController.toggleMute);
router.delete('/conversations/:id', authenticate, validate(conversationParamSchema), ChatController.leaveConversation);

// Messages
router.get('/conversations/:conversationId/messages', authenticate, ChatController.getMessages);
router.post('/conversations/:conversationId/messages', authenticate, validate(sendMessageSchema), ChatController.sendMessage);
router.put('/messages/:messageId', authenticate, validate(editMessageSchema), ChatController.editMessage);
router.patch('/messages/:messageId', authenticate, validate(editMessageSchema), ChatController.editMessage);
router.delete('/messages/:messageId', authenticate, ChatController.deleteMessage);

export default router;
