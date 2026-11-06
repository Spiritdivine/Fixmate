import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '../../services/profile.service';
import { PortfolioItem } from '../../types/api-contracts';
import { triggerHaptic, generateTempId, prependOptimisticItem, updateItemInList, removeItemFromList, OptimisticEntity } from '../../lib/optimistic-helpers';

interface PortfolioContext {
  previousPortfolio: PortfolioItem[] | undefined;
}

export function usePortfolioMutation(artisanId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['artisan-portfolio', artisanId || 'current'];

  const addProjectMutation = useMutation<PortfolioItem, Error, Omit<PortfolioItem, 'id'>, PortfolioContext>({
    mutationFn: async (item) => {
      return await ProfileService.addPortfolio(item);
    },
    onMutate: async (newItem) => {
      await triggerHaptic('success');
      await queryClient.cancelQueries({ queryKey });

      const previousPortfolio = queryClient.getQueryData<PortfolioItem[]>(queryKey);

      const optimisticItem: OptimisticEntity<PortfolioItem> = {
        ...newItem,
        id: generateTempId('portfolio'),
        _syncStatus: 'pending',
        _isOptimistic: true,
      };

      queryClient.setQueryData<PortfolioItem[]>(queryKey, (old) =>
        prependOptimisticItem(old, optimisticItem)
      );

      return { previousPortfolio };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(queryKey, context.previousPortfolio);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateProjectMutation = useMutation<PortfolioItem, Error, { id: string; data: Partial<PortfolioItem> }, PortfolioContext>({
    mutationFn: async ({ id, data }) => {
      return await ProfileService.updatePortfolio(id, data);
    },
    onMutate: async ({ id, data }) => {
      await triggerHaptic('light');
      await queryClient.cancelQueries({ queryKey });

      const previousPortfolio = queryClient.getQueryData<PortfolioItem[]>(queryKey);

      queryClient.setQueryData<PortfolioItem[]>(queryKey, (old) =>
        updateItemInList(
          old,
          (item) => item.id === id,
          (item) => ({ ...item, ...data, _syncStatus: 'pending' })
        )
      );

      return { previousPortfolio };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(queryKey, context.previousPortfolio);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteProjectMutation = useMutation<void, Error, string, PortfolioContext>({
    mutationFn: async (id: string) => {
      await ProfileService.deletePortfolio(id);
    },
    onMutate: async (id: string) => {
      await triggerHaptic('light');
      await queryClient.cancelQueries({ queryKey });

      const previousPortfolio = queryClient.getQueryData<PortfolioItem[]>(queryKey);

      queryClient.setQueryData<PortfolioItem[]>(queryKey, (old) =>
        removeItemFromList(old, (item) => item.id === id)
      );

      return { previousPortfolio };
    },
    onError: (_err, _id, context) => {
      if (context?.previousPortfolio) {
        queryClient.setQueryData(queryKey, context.previousPortfolio);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    addProject: addProjectMutation.mutateAsync,
    isAdding: addProjectMutation.isPending,
    updateProject: updateProjectMutation.mutateAsync,
    isUpdating: updateProjectMutation.isPending,
    deleteProject: deleteProjectMutation.mutate,
    isDeleting: deleteProjectMutation.isPending,
  };
}
