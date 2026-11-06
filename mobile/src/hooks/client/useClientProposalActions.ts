import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProposalService } from '../../services/proposal.service';
import { ProposalRecord } from '../../types/api-contracts';
import { triggerHaptic, updateItemInList } from '../../lib/optimistic-helpers';

interface ProposalActionPayload {
  jobId: string;
  proposalId: string;
}

interface ProposalActionContext {
  previousProposals: ProposalRecord[] | undefined;
}

export function useClientProposalActions() {
  const queryClient = useQueryClient();

  const shortlistMutation = useMutation<ProposalRecord, Error, ProposalActionPayload, ProposalActionContext>({
    mutationFn: async ({ proposalId }) => {
      return await ProposalService.updateStatus(proposalId, 'SHORTLISTED');
    },
    onMutate: async ({ jobId, proposalId }) => {
      await triggerHaptic('success');
      await queryClient.cancelQueries({ queryKey: ['job-proposals', jobId] });

      const previousProposals = queryClient.getQueryData<ProposalRecord[]>(['job-proposals', jobId]);

      queryClient.setQueryData<ProposalRecord[]>(['job-proposals', jobId], (old = []) =>
        updateItemInList(
          old,
          (p) => p.id === proposalId,
          (p) => ({ ...p, status: 'SHORTLISTED' })
        )
      );

      return { previousProposals };
    },
    onError: (_err, { jobId }, context) => {
      if (context?.previousProposals) {
        queryClient.setQueryData(['job-proposals', jobId], context.previousProposals);
      }
      triggerHaptic('warning');
    },
    onSettled: (_data, _err, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['job-proposals', jobId] });
    },
  });

  const rejectMutation = useMutation<ProposalRecord, Error, ProposalActionPayload, ProposalActionContext>({
    mutationFn: async ({ proposalId }) => {
      return await ProposalService.updateStatus(proposalId, 'REJECTED');
    },
    onMutate: async ({ jobId, proposalId }) => {
      await triggerHaptic('light');
      await queryClient.cancelQueries({ queryKey: ['job-proposals', jobId] });

      const previousProposals = queryClient.getQueryData<ProposalRecord[]>(['job-proposals', jobId]);

      queryClient.setQueryData<ProposalRecord[]>(['job-proposals', jobId], (old = []) =>
        updateItemInList(
          old,
          (p) => p.id === proposalId,
          (p) => ({ ...p, status: 'REJECTED' })
        )
      );

      return { previousProposals };
    },
    onError: (_err, { jobId }, context) => {
      if (context?.previousProposals) {
        queryClient.setQueryData(['job-proposals', jobId], context.previousProposals);
      }
      triggerHaptic('warning');
    },
    onSettled: (_data, _err, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['job-proposals', jobId] });
    },
  });

  return {
    shortlistProposal: shortlistMutation.mutate,
    isShortlisting: shortlistMutation.isPending,
    rejectProposal: rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,
  };
}
