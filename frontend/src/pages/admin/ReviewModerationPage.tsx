import React, { useEffect, useState } from 'react';
import {
  Star,
  Search,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatDate } from '../../lib/formatters';
import { ApiResponse, Review, PaginationMeta } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const ReviewModerationPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [visibilityFilter, setVisibilityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number | boolean> = { page, limit: 15 };
      if (visibilityFilter === 'PUBLIC') params.isPublic = true;
      if (visibilityFilter === 'HIDDEN') params.isPublic = false;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get<ApiResponse<{ reviews: any[]; meta: PaginationMeta }>>('/admin/reviews', {
        params,
      });

      if (res.data.success) {
        setReviews(res.data.data.reviews);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [visibilityFilter]);

  const toggleVisibility = async (reviewId: string, currentPublic: boolean) => {
    try {
      const res = await apiClient.patch<ApiResponse<any>>(`/admin/reviews/${reviewId}/visibility`, {
        isPublic: !currentPublic,
      });

      if (res.data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, isPublic: !currentPublic } : r))
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400" />
            <span>Review Moderation & Trust Safety</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Moderate client reviews, artisan feedback, and manage public visibility for community safety.
          </p>
        </div>
        <Badge variant="purple" size="md">
          Total Reviews: {meta.total}
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'ALL', label: 'All Reviews' },
            { key: 'PUBLIC', label: 'Publicly Visible' },
            { key: 'HIDDEN', label: 'Hidden / Moderated' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setVisibilityFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                visibilityFilter === tab.key
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search review comments, artisan response, or user emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReviews(1)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No reviews found matching current filters.
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="p-5 hover:bg-slate-800/30 transition-colors space-y-3 text-xs">
                {/* Top: Users & Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar src={r.reviewer?.avatarUrl} name={r.reviewer?.email || 'Client'} size="sm" />
                    <div>
                      <p className="font-bold text-white">
                        {r.reviewer?.clientProfile?.firstName} {r.reviewer?.clientProfile?.lastName} ({r.reviewer?.email})
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Reviewed Artisan:{' '}
                        <strong className="text-purple-300">
                          {r.reviewee?.artisanProfile?.businessName || r.reviewee?.email}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stars */}
                    <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-white text-xs">{r.overallRating} / 5</span>
                    </div>

                    <Badge variant={r.isPublic ? 'success' : 'default'} size="sm">
                      {r.isPublic ? 'Public' : 'Hidden'}
                    </Badge>

                    <Button
                      size="sm"
                      variant={r.isPublic ? 'danger' : 'outline'}
                      onClick={() => toggleVisibility(r.id, r.isPublic)}
                      className="font-bold text-xs"
                      leftIcon={r.isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    >
                      {r.isPublic ? 'Hide Review' : 'Make Public'}
                    </Button>
                  </div>
                </div>

                {/* Rating Breakdown Sub-badges */}
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                  {r.qualityRating && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      Quality: <strong className="text-white">{r.qualityRating}/5</strong>
                    </span>
                  )}
                  {r.communicationRating && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      Communication: <strong className="text-white">{r.communicationRating}/5</strong>
                    </span>
                  )}
                  {r.punctualityRating && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      Punctuality: <strong className="text-white">{r.punctualityRating}/5</strong>
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono">
                    {formatDate(r.createdAt)}
                  </span>
                </div>

                {/* Written Comment */}
                <p className="text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                  "{r.comment || 'No written comment provided.'}"
                </p>

                {/* Artisan Reply */}
                {r.artisanReply && (
                  <div className="pl-4 border-l-2 border-purple-500 py-1">
                    <p className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>Artisan Reply:</span>
                    </p>
                    <p className="text-slate-300 text-xs mt-0.5">"{r.artisanReply}"</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="py-3.5 px-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{meta.page}</strong> of{' '}
            <strong className="text-white">{meta.totalPages || 1}</strong> ({meta.total} reviews)
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchReviews(meta.page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchReviews(meta.page + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
