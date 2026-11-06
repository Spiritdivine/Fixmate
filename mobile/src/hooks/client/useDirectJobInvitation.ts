import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JobService } from '../../services/job.service';
import { triggerHaptic } from '../../lib/optimistic-helpers';

interface DirectInvitationPayload {
  jobId: string;
  artisanId: string;
  message?: string;
}

export function useDirectJobInvitation() {
  const queryClient = useQueryClient();

  const inviteMutation = useMutation<void, Error, DirectInvitationPayload>({
    mutationFn: async ({ jobId, artisanId, message }) => {
      await JobService.inviteArtisan(jobId, artisanId, message);
    },
    onMutate: async () => {
      await triggerHaptic('success');
    },
    onError: () => {
      triggerHaptic('warning');
    },
    onSettled: (_data, _err, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-details', jobId] });
      queryClient.invalidateQueries({ queryKey: ['client-open-jobs-for-invite'] });
    },
  });

  return {
    sendInvitation: inviteMutation.mutate,
    sendInvitationAsync: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
  };
}
