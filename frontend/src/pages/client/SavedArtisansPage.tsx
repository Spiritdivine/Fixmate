import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  MapPin,
  Star,
  CheckCircle2,
  Trash2,
  Eye,
  Send,
  Search,
  ChevronLeft,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { ArtisanProfile, ApiResponse } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';

export const SavedArtisansPage: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Fetch Saved Artisans
  const { data: savedArtisans = [], isLoading } = useQuery<{ id: string; artisanProfile: ArtisanProfile }[]>({
    queryKey: ['client-saved-artisans'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<any[] | { savedArtisans: { id: string; artisanProfile: ArtisanProfile }[] }>>(
        '/profiles/saved-artisans'
      );
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.savedArtisans) || [];
    },
  });

  // 2. Remove Bookmark Mutation
  const removeBookmarkMutation = useMutation({
    mutationFn: async (artisanProfileId: string) => {
      await apiClient.delete(`/profiles/artisans/${artisanProfileId}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-saved-artisans'] });
      queryClient.invalidateQueries({ queryKey: ['saved-artisans-ids'] });
    },
  });

  const list = savedArtisans || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/client/artisans"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Artisan Directory</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-sky-500 fill-sky-500/20" />
            <span>Saved Artisans ({list.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly access your bookmarked artisans, invite them to projects, or initiate direct messages.
          </p>
        </div>

        <Link
          to="/client/artisans"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Browse More Artisans</span>
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-6 border-slate-200 dark:border-slate-800 animate-pulse h-48" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <Bookmark className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No saved artisans yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When you find top-tier plumbers, electricians, or technicians you like, click the bookmark icon to save them for future jobs.
          </p>
          <Link
            to="/client/artisans"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Explore Artisan Directory</span>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((item) => {
            const artisan = item.artisanProfile;
            const displayName =
              artisan?.businessName || artisan?.user?.email?.split('@')[0] || 'Artisan';

            return (
              <Card
                key={item.id}
                className="p-5 flex flex-col justify-between hover:border-sky-500/40 transition-all border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={artisan?.user?.avatarUrl}
                        name={displayName}
                        size="md"
                        isOnline={artisan?.isAvailable}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {displayName}
                          </h3>
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>
                            {artisan?.lgaCity}, {artisan?.state}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeBookmarkMutation.mutate(artisan.id)}
                      disabled={removeBookmarkMutation.isPending}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-3 leading-relaxed">
                    {artisan?.tagline || artisan?.bio || 'Professional artisan services.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{Number(artisan?.ratingAvg || 0).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">
                        ({artisan?.reviewCount || 0} reviews)
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {artisan?.hourlyRate ? `${formatCurrency(artisan.hourlyRate)}/hr` : 'Custom Quote'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/client/artisans/${artisan?.id}`}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </Link>
                    <Link
                      to={`/client/artisans/${artisan?.id}?action=invite`}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Invite</span>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
