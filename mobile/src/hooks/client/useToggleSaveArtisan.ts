import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '../../services/profile.service';
import { ArtisanProfileData } from '../../types/api-contracts';
import { triggerHaptic, removeItemFromList, prependOptimisticItem, OptimisticEntity } from '../../lib/optimistic-helpers';

interface ToggleSaveArtisanPayload {
  artisanId: string;
  artisan?: Partial<ArtisanProfileData>;
  isSaved: boolean;
}

interface ToggleSaveArtisanContext {
  previousSaved: ArtisanProfileData[] | undefined;
  previousSavedIds: string[] | undefined;
}

export function useToggleSaveArtisan() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ToggleSaveArtisanPayload, ToggleSaveArtisanContext>({
    mutationFn: async ({ artisanId, isSaved }) => {
      if (isSaved) {
        await ProfileService.saveArtisan(artisanId);
      } else {
        await ProfileService.unsaveArtisan(artisanId);
      }
    },
    onMutate: async ({ artisanId, artisan, isSaved }) => {
      await triggerHaptic('light');

      await queryClient.cancelQueries({ queryKey: ['saved-artisans'] });
      await queryClient.cancelQueries({ queryKey: ['saved-artisan-ids'] });

      const previousSaved = queryClient.getQueryData<ArtisanProfileData[]>(['saved-artisans']);
      const previousSavedIds = queryClient.getQueryData<string[]>(['saved-artisan-ids']) || [];

      // Optimistically update IDs list
      queryClient.setQueryData<string[]>(['saved-artisan-ids'], (old = []) => {
        if (isSaved) {
          return old.includes(artisanId) ? old : [...old, artisanId];
        } else {
          return old.filter((id) => id !== artisanId);
        }
      });

      // Optimistically update full records list
      queryClient.setQueryData<ArtisanProfileData[]>(['saved-artisans'], (old = []) => {
        if (isSaved) {
          const optimisticArtisan: OptimisticEntity<ArtisanProfileData> = {
            id: artisanId,
            userId: artisan?.userId || artisanId,
            businessName: artisan?.businessName || 'Verified Artisan',
            trade: artisan?.trade || 'Specialist',
            rating: artisan?.rating || 5.0,
            reviewCount: artisan?.reviewCount || 0,
            avatarUrl: artisan?.avatarUrl,
            hourlyRate: artisan?.hourlyRate || 5000,
            startingPrice: artisan?.startingPrice || 5000,
            yearsOfExperience: artisan?.yearsOfExperience || 3,
            completedJobsCount: artisan?.completedJobsCount || 1,
            isVerified: artisan?.isVerified ?? true,
            isAvailable: artisan?.isAvailable ?? true,
            skills: artisan?.skills || [],
            _isOptimistic: true,
            _syncStatus: 'pending',
          };
          return prependOptimisticItem(old, optimisticArtisan);
        } else {
          return removeItemFromList(old, (a) => a.id === artisanId || (a as any).artisanId === artisanId);
        }
      });

      return { previousSaved, previousSavedIds };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSaved) {
        queryClient.setQueryData(['saved-artisans'], context.previousSaved);
      }
      if (context?.previousSavedIds) {
        queryClient.setQueryData(['saved-artisan-ids'], context.previousSavedIds);
      }
      triggerHaptic('warning');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-artisans'] });
      queryClient.invalidateQueries({ queryKey: ['saved-artisan-ids'] });
    },
  });
}
