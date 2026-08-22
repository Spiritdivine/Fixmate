import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  Star,
  CheckCircle2,
  Bookmark,
  Briefcase,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Send,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { ArtisanProfile, JobCategory, ApiResponse, PaginationMeta } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

export const FindArtisansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [savedArtisanIds, setSavedArtisanIds] = useState<Set<string>>(new Set());

  // 1. Fetch Categories for Filter Dropdown
  const { data: categories = [] } = useQuery<JobCategory[]>({
    queryKey: ['job-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<JobCategory[] | { categories: JobCategory[] }>>('/jobs/categories');
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.categories) || [];
    },
  });

  // 2. Fetch Artisans Directory
  const { data: artisansData = [], isLoading } = useQuery<ArtisanProfile[]>({
    queryKey: ['find-artisans', searchTerm, selectedCategory, selectedState, minRating, onlyAvailable],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedState) params.append('state', selectedState);
      if (minRating) params.append('minRating', minRating);
      if (onlyAvailable) params.append('isAvailable', 'true');

      const { data } = await apiClient.get<ApiResponse<ArtisanProfile[] | { artisans: ArtisanProfile[]; meta?: PaginationMeta }>>(
        `/profiles/artisans?${params.toString()}`
      );
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.artisans) || [];
    },
  });

  // 3. Fetch Saved Artisans to highlight bookmarks
  useQuery<Set<string>>({
    queryKey: ['saved-artisans-ids'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<ApiResponse<any[] | { savedArtisans: { artisanProfileId: string }[] }>>(
          '/profiles/saved-artisans'
        );
        const list = (Array.isArray(data.data) ? data.data : (data.data as any)?.savedArtisans) || [];
        const ids = new Set<string>(list.map((s: any) => String(s.artisanProfileId || s.id)));
        setSavedArtisanIds(ids);
        return ids;
      } catch {
        return new Set<string>();
      }
    },
  });

  // 4. Toggle Save/Bookmark Mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ artisanId, isSaved }: { artisanId: string; isSaved: boolean }) => {
      if (isSaved) {
        await apiClient.delete(`/profiles/artisans/${artisanId}/save`);
      } else {
        await apiClient.post(`/profiles/artisans/${artisanId}/save`);
      }
      return { artisanId, isSaved };
    },
    onSuccess: ({ artisanId, isSaved }) => {
      setSavedArtisanIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(artisanId);
        else next.add(artisanId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['saved-artisans-ids'] });
    },
  });

  const artisans = artisansData || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Find Verified Artisans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse electricians, plumbers, carpenters, mechanics, and technicians with verified credentials.
          </p>
        </div>
        <Link
          to="/client/saved-artisans"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors self-start md:self-auto"
        >
          <Bookmark className="w-4 h-4 text-sky-500 fill-sky-500/20" />
          <span>Saved Artisans ({savedArtisanIds.size})</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 sm:p-5 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by skill, name, or specialty..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* State / Region */}
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            >
              <option value="">All States</option>
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja (FCT)</option>
              <option value="Rivers">Rivers (Port Harcourt)</option>
              <option value="Oyo">Oyo (Ibadan)</option>
              <option value="Ogun">Ogun</option>
              <option value="Enugu">Enugu</option>
              <option value="Anambra">Anambra</option>
              <option value="Kano">Kano</option>
              <option value="Kaduna">Kaduna</option>
              <option value="Edo">Edo</option>
              <option value="Delta">Delta</option>
            </select>
          </div>

          {/* Minimum Rating */}
          <div className="relative">
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            >
              <option value="">Any Rating</option>
              <option value="4.5">★ 4.5 &amp; Above</option>
              <option value="4.0">★ 4.0 &amp; Above</option>
              <option value="3.5">★ 3.5 &amp; Above</option>
            </select>
          </div>
        </div>

        {/* Availability Toggle & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
            />
            <span>Show Only Available Artisans</span>
          </label>

          {(searchTerm || selectedCategory || selectedState || minRating || !onlyAvailable) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedState('');
                setMinRating('');
                setOnlyAvailable(true);
              }}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Artisans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="p-6 border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </Card>
          ))}
        </div>
      ) : artisans.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <Search className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No artisans match your criteria
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your search terms, changing the location filter, or lowering the rating requirement.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artisans.map((artisan) => {
            const isSaved = savedArtisanIds.has(artisan.id);
            const displayName =
              artisan.businessName || artisan.user?.email?.split('@')[0] || 'Artisan';

            return (
              <Card
                key={artisan.id}
                className="p-5 flex flex-col justify-between hover:border-sky-500/40 hover:shadow-lg transition-all border-slate-200 dark:border-slate-800 group"
              >
                <div>
                  {/* Top Row: Avatar, Name, Bookmark */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={artisan.user?.avatarUrl}
                        name={displayName}
                        size="md"
                        isOnline={artisan.isAvailable}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-sky-600 transition-colors">
                            {displayName}
                          </h3>
                          <span title="Verified Artisan">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>
                            {artisan.lgaCity}, {artisan.state}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => bookmarkMutation.mutate({ artisanId: artisan.id, isSaved })}
                      disabled={bookmarkMutation.isPending}
                      className={`p-2 rounded-xl transition-colors shrink-0 ${
                        isSaved
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'
                          : 'bg-slate-100 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:hover:text-slate-200'
                      }`}
                      title={isSaved ? 'Remove from Saved' : 'Save Artisan'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
                    </button>
                  </div>

                  {/* Tagline / Bio preview */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {artisan.tagline || artisan.bio || 'Experienced artisan providing premium craft and repair services.'}
                  </p>

                  {/* Skills tags */}
                  {artisan.skills && artisan.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {artisan.skills.slice(0, 3).map((s) => (
                        <span
                          key={s.skill.id}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                        >
                          {s.skill.name}
                        </span>
                      ))}
                      {artisan.skills.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-semibold">
                          +{artisan.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Rating, Rate, Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{Number(artisan.ratingAvg || 0).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">
                        ({artisan.reviewCount || 0} reviews)
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {artisan.hourlyRate ? `${formatCurrency(artisan.hourlyRate)}/hr` : 'Custom Quote'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/client/artisans/${artisan.id}`}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to={`/client/artisans/${artisan.id}?action=invite`}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm shadow-sky-600/20 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Hire / Invite</span>
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
