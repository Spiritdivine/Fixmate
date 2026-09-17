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
    <div className="space-y-8 pb-16 font-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/client/artisans"
              className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Saved Artisans</span>
            <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/20">
              {list.length}
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Quickly access your bookmarked artisans, invite them to projects, or initiate direct messages.
          </p>
        </div>

        <Link
          to="/client/artisans"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-900/10 transition-all self-start sm:self-auto"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Browse More Artisans</span>
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 bg-white rounded-[24px] border border-slate-200/80 animate-pulse h-52 shadow-sm" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-200 rounded-[24px] bg-white">
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No saved artisans yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When you find top-tier plumbers, electricians, or technicians you like, click the bookmark icon to save them for future jobs.
          </p>
          <Link
            to="/client/artisans"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Explore Artisan Directory</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((item) => {
            const artisan = item.artisanProfile;
            const displayName =
              artisan?.businessName || artisan?.user?.email?.split('@')[0] || 'Artisan';

            return (
              <div
                key={item.id}
                className="p-6 bg-white rounded-[24px] border border-slate-200/80 hover:border-emerald-600/40 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar
                        src={artisan?.user?.avatarUrl}
                        name={displayName}
                        size="md"
                        isOnline={artisan?.isAvailable}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {displayName}
                          </h3>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
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
                      className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mt-3.5 leading-relaxed font-normal">
                    {artisan?.tagline || artisan?.bio || 'Professional artisan services.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{Number(artisan?.ratingAvg || 0).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">
                        ({artisan?.reviewCount || 0} reviews)
                      </span>
                    </div>

                    <div className="font-extrabold text-slate-900">
                      {artisan?.hourlyRate ? `${formatCurrency(artisan.hourlyRate)}/hr` : 'Custom Quote'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      to={`/client/artisans/${artisan?.id}`}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to={`/client/artisans/${artisan?.id}?action=invite`}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Invite</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
