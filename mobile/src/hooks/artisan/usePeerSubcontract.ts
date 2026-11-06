import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PeerService, JobSubcontract } from '../../services/peer.service';
import { triggerHaptic, generateTempId, prependOptimisticItem, OptimisticEntity } from '../../lib/optimistic-helpers';

interface CreateSubcontractPayload {
  contractId: string;
  subArtisanId: string;
  title: string;
  scope: string;
  agreedAmount: number;
}

interface PeerSubcontractContext {
  previousSubcontracts: { prime: JobSubcontract[]; assigned: JobSubcontract[] } | undefined;
}

export function usePeerSubcontract() {
  const queryClient = useQueryClient();

  return useMutation<JobSubcontract, Error, CreateSubcontractPayload, PeerSubcontractContext>({
    mutationFn: async (payload) => {
      return await PeerService.createSubcontract(payload);
    },
    onMutate: async (payload) => {
      await triggerHaptic('success');
      await queryClient.cancelQueries({ queryKey: ['peer-subcontracts'] });

      const previousSubcontracts = queryClient.getQueryData<{ prime: JobSubcontract[]; assigned: JobSubcontract[] }>(['peer-subcontracts']);

      const optimisticSubcontract: OptimisticEntity<JobSubcontract> = {
        id: generateTempId('subcontract'),
        contractId: payload.contractId,
        primeArtisanId: 'current-artisan',
        subArtisanId: payload.subArtisanId,
        title: payload.title,
        scope: payload.scope,
        agreedAmount: payload.agreedAmount,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _syncStatus: 'pending',
        _isOptimistic: true,
      };

      queryClient.setQueryData<{ prime: JobSubcontract[]; assigned: JobSubcontract[] }>(['peer-subcontracts'], (old) => ({
        prime: prependOptimisticItem(old?.prime, optimisticSubcontract),
        assigned: old?.assigned || [],
      }));

      return { previousSubcontracts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSubcontracts) {
        queryClient.setQueryData(['peer-subcontracts'], context.previousSubcontracts);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-subcontracts'] });
    },
  });
}
