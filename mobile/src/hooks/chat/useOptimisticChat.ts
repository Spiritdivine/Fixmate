import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService, SendMessagePayload } from '../../services/chat.service';
import { MessageRecord } from '../../types/api-contracts';
import { triggerHaptic, generateTempId, updateItemInList } from '../../lib/optimistic-helpers';

export interface OptimisticChatMessage extends MessageRecord {
  isOptimistic?: boolean;
  deliveryStatus?: 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  clientTempId?: string;
}

interface SendMessageContext {
  tempId: string;
  previousMessages: MessageRecord[] | undefined;
}

export function useOptimisticChat(conversationId: string, currentUserId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['chat-messages', conversationId];

  const sendMessageMutation = useMutation<
    MessageRecord,
    Error,
    SendMessagePayload,
    SendMessageContext
  >({
    mutationFn: async (payload) => {
      return await ChatService.sendMessage(conversationId, payload);
    },
    onMutate: async (payload) => {
      await triggerHaptic('light');
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<MessageRecord[]>(queryKey) || [];
      const tempId = generateTempId('msg');

      const optimisticMsg: OptimisticChatMessage = {
        id: tempId,
        clientTempId: tempId,
        conversationId,
        senderId: currentUserId || 'me',
        messageType: payload.messageType || 'TEXT',
        body: payload.body,
        attachmentUrl: payload.attachmentUrl,
        metadata: payload.metadata,
        isRead: false,
        isOptimistic: true,
        deliveryStatus: 'SENDING',
        createdAt: new Date().toISOString(),
      };

      // Invert list if needed, but in ChatThreadScreen messages are rendered in order
      queryClient.setQueryData<OptimisticChatMessage[]>(queryKey, (old = []) => [
        ...old,
        optimisticMsg,
      ]);

      return { tempId, previousMessages };
    },
    onSuccess: (serverRecord, _payload, context) => {
      if (!context?.tempId) return;

      // Reconcile: Replace tempId item with authoritative record
      queryClient.setQueryData<OptimisticChatMessage[]>(queryKey, (old = []) =>
        updateItemInList(
          old,
          (item) => item.id === context.tempId || item.clientTempId === context.tempId,
          () => ({
            ...serverRecord,
            clientTempId: context.tempId,
            deliveryStatus: 'SENT',
            isOptimistic: false,
          })
        )
      );

      // Invalidate conversation list so preview snippet updates
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: (_err, _payload, context) => {
      triggerHaptic('warning');
      if (!context?.tempId) return;

      // Mark message as FAILED rather than deleting it, allowing user to retry
      queryClient.setQueryData<OptimisticChatMessage[]>(queryKey, (old = []) =>
        updateItemInList(
          old,
          (item) => item.id === context.tempId || item.clientTempId === context.tempId,
          (item) => ({
            ...item,
            deliveryStatus: 'FAILED',
            isOptimistic: false,
          })
        )
      );
    },
  });

  return {
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
  };
}
