import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JobService } from '../../services/job.service';
import { JobRecord } from '../../types/api-contracts';
import { triggerHaptic, removeItemFromList, prependOptimisticItem } from '../../lib/optimistic-helpers';

interface ToggleSaveJobContext {
  previousSaved: JobRecord[] | undefined;
  previousSavedIds: string[] | undefined;
}

export function useToggleSaveJob() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { job: JobRecord; isSaved: boolean }, ToggleSaveJobContext>({
    mutationFn: async ({ job, isSaved }) => {
      if (isSaved) {
        await JobService.saveJob(job.id);
      } else {
        await JobService.unsaveJob(job.id);
      }
    },
    onMutate: async ({ job, isSaved }) => {
      // 1. Instant sensory confirmation (<16ms)
      await triggerHaptic('light');

      // 2. Cancel in-flight queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['artisan-saved-jobs'] });
      await queryClient.cancelQueries({ queryKey: ['saved-job-ids'] });

      // 3. Snapshot previous states for rollback
      const previousSaved = queryClient.getQueryData<JobRecord[]>(['artisan-saved-jobs']);
      const previousSavedIds = queryClient.getQueryData<string[]>(['saved-job-ids']);

      // 4. Optimistically update saved jobs list cache
      queryClient.setQueryData<JobRecord[]>(['artisan-saved-jobs'], (old) => {
        if (isSaved) {
          // Prepend to saved list
          return prependOptimisticItem(old, job);
        } else {
          // Remove from saved list
          return removeItemFromList(old, (item) => item.id === job.id);
        }
      });

      // 5. Optimistically update saved IDs set for fast O(1) checks in marketplace
      queryClient.setQueryData<string[]>(['saved-job-ids'], (old) => {
        const currentIds = old || [];
        if (isSaved) {
          return currentIds.includes(job.id) ? currentIds : [job.id, ...currentIds];
        } else {
          return currentIds.filter((id) => id !== job.id);
        }
      });

      return { previousSaved, previousSavedIds };
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previousSaved) {
        queryClient.setQueryData(['artisan-saved-jobs'], context.previousSaved);
      }
      if (context?.previousSavedIds) {
        queryClient.setQueryData(['saved-job-ids'], context.previousSavedIds);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      // Silently re-sync with server authoritative state
      queryClient.invalidateQueries({ queryKey: ['artisan-saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['saved-job-ids'] });
    },
  });
}
