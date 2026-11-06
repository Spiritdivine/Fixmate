import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProposalService, SubmitProposalPayload } from '../../services/proposal.service';
import { ProposalRecord } from '../../types/api-contracts';
import { triggerHaptic, generateTempId, prependOptimisticItem, updateItemInList, OptimisticEntity } from '../../lib/optimistic-helpers';

interface ProposalContext {
  previousProposals: ProposalRecord[] | undefined;
}

export function useArtisanProposals() {
  const queryClient = useQueryClient();

  const submitProposalMutation = useMutation<ProposalRecord, Error, SubmitProposalPayload, ProposalContext>({
    mutationFn: async (payload) => {
      return await ProposalService.submit(payload);
    },
    onMutate: async (payload) => {
      await triggerHaptic('success');
      await queryClient.cancelQueries({ queryKey: ['my-proposals'] });

      const previousProposals = queryClient.getQueryData<ProposalRecord[]>(['my-proposals']);

      const optimisticProposal: OptimisticEntity<ProposalRecord> = {
        id: generateTempId('prop'),
        jobId: payload.jobId,
        artisanId: 'current-artisan',
        amount: Number(payload.bidAmount ?? payload.amount ?? 0),
        bidAmount: Number(payload.bidAmount ?? payload.amount ?? 0),
        durationDays: Number(payload.estimatedDays ?? payload.durationDays ?? 1),
        estimatedDays: Number(payload.estimatedDays ?? payload.durationDays ?? 1),
        coverLetter: payload.coverLetter,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        milestones: payload.milestones?.map((m, idx) => ({
          id: generateTempId('ms'),
          proposalId: 'optimistic',
          title: m.title,
          amount: Number(m.amount),
          stepOrder: m.stepOrder ?? idx + 1,
          status: 'PENDING',
        })),
        _syncStatus: 'pending',
        _isOptimistic: true,
      };

      queryClient.setQueryData<ProposalRecord[]>(['my-proposals'], (old) =>
        prependOptimisticItem(old, optimisticProposal)
      );

      return { previousProposals };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProposals) {
        queryClient.setQueryData(['my-proposals'], context.previousProposals);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
    },
  });

  const withdrawProposalMutation = useMutation<void, Error, string, ProposalContext>({
    mutationFn: async (proposalId: string) => {
      await ProposalService.withdraw(proposalId);
    },
    onMutate: async (proposalId: string) => {
      await triggerHaptic('light');
      await queryClient.cancelQueries({ queryKey: ['my-proposals'] });

      const previousProposals = queryClient.getQueryData<ProposalRecord[]>(['my-proposals']);

      queryClient.setQueryData<ProposalRecord[]>(['my-proposals'], (old) =>
        updateItemInList(
          old,
          (p) => p.id === proposalId,
          (p) => ({ ...p, status: 'REJECTED' })
        )
      );

      return { previousProposals };
    },
    onError: (_err, _id, context) => {
      if (context?.previousProposals) {
        queryClient.setQueryData(['my-proposals'], context.previousProposals);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
    },
  });

  return {
    submitProposal: submitProposalMutation.mutate,
    submitProposalAsync: submitProposalMutation.mutateAsync,
    submitProposalMutation,
    isSubmitting: submitProposalMutation.isPending,
    withdrawProposal: withdrawProposalMutation.mutate,
    withdrawProposalMutation,
    isWithdrawing: withdrawProposalMutation.isPending,
  };
}
