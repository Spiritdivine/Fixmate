import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService } from '../../services/notification.service';
import { AppNotification } from '../../types/notification-contracts';
import { triggerHaptic, updateItemInList } from '../../lib/optimistic-helpers';

interface MarkReadContext {
  previousNotifications: AppNotification[] | undefined;
}

export function useArtisanNotifications() {
  const queryClient = useQueryClient();

  const markSingleReadMutation = useMutation<void, Error, string, MarkReadContext>({
    mutationFn: async (notificationId: string) => {
      await NotificationService.markAsRead(notificationId);
    },
    onMutate: async (notificationId: string) => {
      await triggerHaptic('light');
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['artisan-notifications'] });

      const previousNotifications = queryClient.getQueryData<AppNotification[]>(['notifications']) ||
        queryClient.getQueryData<AppNotification[]>(['artisan-notifications']);

      const updater = (old: AppNotification[] | undefined) =>
        updateItemInList(
          old,
          (item) => item.id === notificationId,
          (item) => ({ ...item, isRead: true })
        );

      queryClient.setQueryData<AppNotification[]>(['notifications'], updater);
      queryClient.setQueryData<AppNotification[]>(['artisan-notifications'], updater);

      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
        queryClient.setQueryData(['artisan-notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['artisan-notifications'] });
    },
  });

  const markAllReadMutation = useMutation<void, Error, void, MarkReadContext>({
    mutationFn: async () => {
      await NotificationService.markAllAsRead();
    },
    onMutate: async () => {
      await triggerHaptic('medium');
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['artisan-notifications'] });

      const previousNotifications = queryClient.getQueryData<AppNotification[]>(['notifications']) ||
        queryClient.getQueryData<AppNotification[]>(['artisan-notifications']);

      const updater = (old: AppNotification[] | undefined) => {
        if (!old || !Array.isArray(old)) return [];
        return old.map((item) => ({ ...item, isRead: true }));
      };

      queryClient.setQueryData<AppNotification[]>(['notifications'], updater);
      queryClient.setQueryData<AppNotification[]>(['artisan-notifications'], updater);

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
        queryClient.setQueryData(['artisan-notifications'], context.previousNotifications);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['artisan-notifications'] });
    },
  });

  return {
    markAsRead: markSingleReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}
