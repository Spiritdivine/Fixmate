import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Reply, Send, CheckCircle2, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Textarea } from '../../components/ui/Textarea';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthStore } from '../../stores/authStore';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatDate } from '../../lib/formatters';
import { Review } from '../../types';

export const ReviewsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const profile = user?.artisanProfile;

  const fetchReviews = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const { data } = await apiClient.get(`/reviews/artisan/${user.id}`);
      setReviews(data.data || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user?.id]);

  const handlePostReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      setIsSubmittingReply(true);
      const { data } = await apiClient.post(`/reviews/${reviewId}/reply`, {
        replyText: replyText.trim(),
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, artisanReply: replyText.trim() } : r))
      );
      setReplyingReviewId(null);
      setReplyText('');
    } catch (err) {
      alert(`Failed to reply: ${getErrorMessage(err)}`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Reputation & Client Reviews
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Public client ratings, quality feedback scores, and artisan reply engine.
        </p>
      </div>

      {/* Metrics Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Overall Rating
          </span>
          <div className="flex items-center gap-2 my-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {Number(profile?.ratingAvg || 5.0).toFixed(1)}
            </span>
            <div className="flex text-amber-500 text-sm">
              {'★'.repeat(Math.round(Number(profile?.ratingAvg || 5)))}
            </div>
          </div>
          <span className="text-xs text-slate-400">{profile?.reviewCount || 0} Total Reviews</span>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Quality of Work
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 my-2">5.0 / 5.0</div>
          <span className="text-xs text-emerald-500 font-semibold">Exemplary Finish</span>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Communication
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 my-2">4.9 / 5.0</div>
          <span className="text-xs text-sky-500 font-semibold">Responsive & Clear</span>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Punctuality
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 my-2">5.0 / 5.0</div>
          <span className="text-xs text-purple-500 font-semibold">On-Time Milestones</span>
        </Card>
      </div>

      {/* Reviews Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Client Feedback ({reviews.length})</CardTitle>
          <CardDescription>Verified reviews left by clients upon contract completion.</CardDescription>
        </CardHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={<Award className="w-8 h-8" />}
            title="No reviews yet"
            description="Complete your first contract and client ratings will appear here."
          />
        ) : (
          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80">
            {reviews.map((r) => {
              const reviewerName = r.reviewer?.clientProfile
                ? `${r.reviewer.clientProfile.firstName} ${r.reviewer.clientProfile.lastName}`
                : 'Verified Client';

              return (
                <div key={r.id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={r.reviewer?.avatarUrl} name={reviewerName} size="md" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {reviewerName}
                        </h4>
                        <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <span>{'★'.repeat(r.overallRating)}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        ({r.overallRating}.0)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-12">
                    "{r.comment || 'Great trade execution, completed all milestones as agreed.'}"
                  </p>

                  {/* Existing Artisan Public Reply */}
                  {r.artisanReply && (
                    <div className="ml-12 p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-500/20 space-y-1">
                      <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 block">
                        Your Public Response:
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{r.artisanReply}</p>
                    </div>
                  )}

                  {/* Reply Action / Inline Composer */}
                  <div className="pl-12 pt-1">
                    {replyingReviewId === r.id ? (
                      <div className="space-y-2">
                        <Textarea
                          rows={2}
                          placeholder="Write a professional thank you or reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setReplyingReviewId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            isLoading={isSubmittingReply}
                            onClick={() => handlePostReply(r.id)}
                            leftIcon={<Send className="w-3.5 h-3.5" />}
                          >
                            Post Public Reply
                          </Button>
                        </div>
                      </div>
                    ) : (
                      !r.artisanReply && (
                        <button
                          onClick={() => {
                            setReplyingReviewId(r.id);
                            setReplyText('');
                          }}
                          className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1.5"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply to Client</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
