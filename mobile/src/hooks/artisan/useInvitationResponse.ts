import { useMutation, useQueryClient } from '@tanstack/react-query';
import { JobService } from '../../services/job.service';
import { JobInvitationRecord } from '../../types/api-contracts';
import { triggerHaptic, updateItemInList, removeItemFromList } from '../../lib/optimistic-helpers';

interface InvitationResponseContext {
  previousInvitations: JobInvitationRecord[] | undefined;
}

export function useInvitationResponse() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { invitationId: string; status: 'ACCEPTED' | 'DECLINED' },
    InvitationResponseContext
  >({
    mutationFn: async ({ invitationId, status }) => {
      await JobService.respondInvitation(invitationId, status);
    },
    onMutate: async ({ invitationId, status }) => {
      // 1. Sensory feedback
      await triggerHaptic(status === 'ACCEPTED' ? 'success' : 'light');

      // 2. Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ['artisan-invitations'] });

      // 3. Snapshot
      const previousInvitations = queryClient.getQueryData<JobInvitationRecord[]>(['artisan-invitations']);

      // 4. Optimistically update invitations list cache
      queryClient.setQueryData<JobInvitationRecord[]>(['artisan-invitations'], (old) => {
        if (status === 'DECLINED') {
          // Immediately remove declined invitation from feed
          return removeItemFromList(old, (inv) => inv.id === invitationId);
        } else {
          // Mark as accepted immediately
          return updateItemInList(
            old,
            (inv) => inv.id === invitationId,
            (inv) => ({ ...inv, status: 'ACCEPTED' })
          );
        }
      });

      return { previousInvitations };
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previousInvitations) {
        queryClient.setQueryData(['artisan-invitations'], context.previousInvitations);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['artisan-invitations'] });
    },
  });
}
