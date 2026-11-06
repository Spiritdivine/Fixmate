import { apiClient } from '../lib/api-client';
import { ApiResponse, ConversationRecord, MessageRecord, MessageMetadata } from '../types/api-contracts';

export interface SendMessagePayload {
  body?: string;
  messageType?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'LOCATION' | 'SYSTEM_ALERT' | 'MILESTONE_PROMPT';
  attachmentUrl?: string;
  metadata?: MessageMetadata;
}

/**
 * ChatService (SRP):
 * Manages persistent conversation threads, message retrieval, and thread mutations.
 */
export class ChatService {
  static async getConversations(): Promise<ConversationRecord[]> {
    const response = await apiClient.get<ApiResponse<ConversationRecord[]>>('/chat/conversations');
    return response.data.data;
  }

  static async getMessages(conversationId: string, page = 1, limit = 50): Promise<MessageRecord[]> {
    const response = await apiClient.get<ApiResponse<MessageRecord[]>>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    );
    return response.data.data;
  }

  static async sendMessage(conversationId: string, payload: SendMessagePayload): Promise<MessageRecord> {
    const response = await apiClient.post<ApiResponse<MessageRecord>>(
      `/chat/conversations/${conversationId}/messages`,
      payload
    );
    return response.data.data;
  }

  static async markAsRead(conversationId: string): Promise<void> {
    await apiClient.patch(`/chat/conversations/${conversationId}/read`);
  }

  static async toggleMute(conversationId: string): Promise<void> {
    await apiClient.patch(`/chat/conversations/${conversationId}/mute`);
  }

  static async getOrCreateArtisanConversation(
    artisanId: string,
    contextJobId?: string
  ): Promise<ConversationRecord> {
    const response = await apiClient.post<ApiResponse<ConversationRecord>>(
      `/chat/conversations/artisan/${artisanId}`,
      { contextJobId }
    );
    return response.data.data;
  }

  static async editMessage(messageId: string, body: string): Promise<MessageRecord> {
    const response = await apiClient.patch<ApiResponse<MessageRecord>>(
      `/chat/messages/${messageId}`,
      { body }
    );
    return response.data.data;
  }

  static async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/chat/messages/${messageId}`);
  }

  static async leaveConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/chat/conversations/${conversationId}`);
  }
}

