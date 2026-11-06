import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReviewService } from '../../services/review.service';
import { ReviewRecord, SubmitReviewPayload } from '../../types/review-contracts';
import { triggerHaptic, generateTempId, prependOptimisticItem, OptimisticEntity } from '../../lib/optimistic-helpers';

interface ReviewContext {
  previousMyReviews: ReviewRecord[] | undefined;
  previousArtisanReviews: ReviewRecord[] | undefined;
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation<ReviewRecord, Error, SubmitReviewPayload, ReviewContext>({
    mutationFn: async (payload) => {
      return await ReviewService.submitReview(payload);
    },
    onMutate: async (payload) => {
      await triggerHaptic('success');

      await queryClient.cancelQueries({ queryKey: ['reviews', 'my-reviews'] });
      await queryClient.cancelQueries({ queryKey: ['reviews', payload.artisanId] });

      const previousMyReviews = queryClient.getQueryData<ReviewRecord[]>(['reviews', 'my-reviews']);
      const previousArtisanReviews = queryClient.getQueryData<ReviewRecord[]>(['reviews', payload.artisanId]);

      const optimisticReview: OptimisticEntity<ReviewRecord> = {
        id: generateTempId('rev'),
        contractId: payload.contractId,
        clientName: 'You',
        rating: payload.rating,
        comment: payload.comment,
        tags: payload.tags || [],
        createdAt: new Date().toISOString(),
        _isOptimistic: true,
        _syncStatus: 'pending',
      };

      queryClient.setQueryData<ReviewRecord[]>(['reviews', 'my-reviews'], (old = []) =>
        prependOptimisticItem(old, optimisticReview)
      );

      queryClient.setQueryData<ReviewRecord[]>(['reviews', payload.artisanId], (old = []) =>
        prependOptimisticItem(old, optimisticReview)
      );

      return { previousMyReviews, previousArtisanReviews };
    },
    onError: (_err, vars, context) => {
      if (context?.previousMyReviews) {
        queryClient.setQueryData(['reviews', 'my-reviews'], context.previousMyReviews);
      }
      if (context?.previousArtisanReviews) {
        queryClient.setQueryData(['reviews', vars.artisanId], context.previousArtisanReviews);
      }
      triggerHaptic('warning');
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', vars.artisanId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}
