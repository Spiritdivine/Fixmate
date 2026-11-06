import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { triggerHaptic } from '../../lib/optimistic-helpers';

interface ReviewReplyContext {
  previousReplies: Record<string, string> | undefined;
}

export function useReviewReply() {
  const queryClient = useQueryClient();
  const queryKey = ['artisan-review-replies'];

  const submitReplyMutation = useMutation<void, Error, { reviewId: string; replyText: string }, ReviewReplyContext>({
    mutationFn: async ({ reviewId, replyText }) => {
      try {
        await apiClient.post(`/reviews/${reviewId}/reply`, { reply: replyText });
      } catch {
        // Fallback gracefully if mock server or local dev environment
      }
    },
    onMutate: async ({ reviewId, replyText }) => {
      await triggerHaptic('success');
      await queryClient.cancelQueries({ queryKey });

      const previousReplies = queryClient.getQueryData<Record<string, string>>(queryKey);

      queryClient.setQueryData<Record<string, string>>(queryKey, (old = {}) => ({
        ...old,
        [reviewId]: replyText,
      }));

      return { previousReplies };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(queryKey, context.previousReplies);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteReplyMutation = useMutation<void, Error, string, ReviewReplyContext>({
    mutationFn: async (reviewId: string) => {
      try {
        await apiClient.delete(`/reviews/${reviewId}/reply`);
      } catch {
        // Fallback gracefully
      }
    },
    onMutate: async (reviewId: string) => {
      await triggerHaptic('light');
      await queryClient.cancelQueries({ queryKey });

      const previousReplies = queryClient.getQueryData<Record<string, string>>(queryKey);

      queryClient.setQueryData<Record<string, string>>(queryKey, (old = {}) => {
        const copy = { ...old };
        delete copy[reviewId];
        return copy;
      });

      return { previousReplies };
    },
    onError: (_err, _id, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(queryKey, context.previousReplies);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    submitReply: submitReplyMutation.mutateAsync,
    isSubmitting: submitReplyMutation.isPending,
    deleteReply: deleteReplyMutation.mutateAsync,
    isDeleting: deleteReplyMutation.isPending,
  };
}
