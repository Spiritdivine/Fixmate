import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JobService, CreateJobPayload } from '../../services/job.service';
import { JobRecord } from '../../types/api-contracts';
import { triggerHaptic, removeItemFromList, updateItemInList } from '../../lib/optimistic-helpers';

interface DeleteJobContext {
  previousMyJobs: any[] | undefined;
  previousJobDetails: JobRecord | undefined;
}

interface UpdateJobContext {
  previousMyJobs: any[] | undefined;
  previousJobDetails: JobRecord | undefined;
}

export function useClientJobMutations() {
  const queryClient = useQueryClient();

  const deleteJobMutation = useMutation<void, Error, { jobId: string; reason?: string }, DeleteJobContext>({
    mutationFn: async ({ jobId, reason }) => {
      await JobService.delete(jobId, reason);
    },
    onMutate: async ({ jobId }) => {
      await triggerHaptic('light');

      await queryClient.cancelQueries({ queryKey: ['client-my-jobs'] });
      await queryClient.cancelQueries({ queryKey: ['job-details', jobId] });

      const previousMyJobs = queryClient.getQueryData<any[]>(['client-my-jobs']);
      const previousJobDetails = queryClient.getQueryData<JobRecord>(['job-details', jobId]);

      // Optimistically remove from client's job list
      queryClient.setQueryData<any[]>(['client-my-jobs'], (old = []) =>
        removeItemFromList(old, (j) => j.id === jobId)
      );

      return { previousMyJobs, previousJobDetails };
    },
    onError: (_err, { jobId }, context) => {
      if (context?.previousMyJobs) {
        queryClient.setQueryData(['client-my-jobs'], context.previousMyJobs);
      }
      if (context?.previousJobDetails) {
        queryClient.setQueryData(['job-details', jobId], context.previousJobDetails);
      }
      triggerHaptic('warning');
    },
    onSettled: (_data, _err, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-details', jobId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });
    },
  });

  const updateJobMutation = useMutation<
    JobRecord,
    Error,
    { jobId: string; payload: Partial<CreateJobPayload> },
    UpdateJobContext
  >({
    mutationFn: async ({ jobId, payload }) => {
      return await JobService.update(jobId, payload);
    },
    onMutate: async ({ jobId, payload }) => {
      await triggerHaptic('light');

      await queryClient.cancelQueries({ queryKey: ['client-my-jobs'] });
      await queryClient.cancelQueries({ queryKey: ['job-details', jobId] });

      const previousMyJobs = queryClient.getQueryData<any[]>(['client-my-jobs']);
      const previousJobDetails = queryClient.getQueryData<JobRecord>(['job-details', jobId]);

      queryClient.setQueryData<any[]>(['client-my-jobs'], (old = []) =>
        updateItemInList(
          old,
          (j) => j.id === jobId,
          (j) => ({
            ...j,
            ...(payload.title ? { title: payload.title } : {}),
            ...(payload.budgetMax ? { budget: Number(payload.budgetMax) } : {}),
          })
        )
      );

      queryClient.setQueryData<JobRecord | undefined>(['job-details', jobId], (old) => {
        if (!old) return old;
        return {
          ...old,
          ...(payload.title ? { title: payload.title } : {}),
          ...(payload.description ? { description: payload.description } : {}),
          ...(payload.budgetMax ? { budget: Number(payload.budgetMax) } : {}),
        };
      });

      return { previousMyJobs, previousJobDetails };
    },
    onError: (_err, { jobId }, context) => {
      if (context?.previousMyJobs) {
        queryClient.setQueryData(['client-my-jobs'], context.previousMyJobs);
      }
      if (context?.previousJobDetails) {
        queryClient.setQueryData(['job-details', jobId], context.previousJobDetails);
      }
      triggerHaptic('warning');
    },
    onSettled: (_data, _err, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-my-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-details', jobId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-jobs'] });
    },
  });

  return {
    deleteJob: deleteJobMutation.mutate,
    deleteJobAsync: deleteJobMutation.mutateAsync,
    isDeletingJob: deleteJobMutation.isPending,
    updateJob: updateJobMutation.mutate,
    updateJobAsync: updateJobMutation.mutateAsync,
    isUpdatingJob: updateJobMutation.isPending,
  };
}
