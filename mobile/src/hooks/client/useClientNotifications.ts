import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/notification.service';
import { AppNotification } from '../../types/notification-contracts';
import { triggerHaptic, updateItemInList } from '../../lib/optimistic-helpers';

interface NotificationContext {
  previousNotifications: AppNotification[] | undefined;
}

export function useClientNotifications() {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation<void, Error, string, NotificationContext>({
    mutationFn: async (id: string) => {
      await NotificationService.markAsRead(id);
    },
    onMutate: async (id: string) => {
      await triggerHaptic('light');
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData<AppNotification[]>(['notifications']);

      queryClient.setQueryData<AppNotification[]>(['notifications'], (old) =>
        updateItemInList(
          old,
          (n) => n.id === id,
          (n) => ({ ...n, isRead: true })
        )
      );

      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation<void, Error, void, NotificationContext>({
    mutationFn: async () => {
      await NotificationService.markAllAsRead();
    },
    onMutate: async () => {
      await triggerHaptic('success');
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData<AppNotification[]>(['notifications']);

      queryClient.setQueryData<AppNotification[]>(['notifications'], (old = []) =>
        old.map((n) => ({ ...n, isRead: true }))
      );

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
}
