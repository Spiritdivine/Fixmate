import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  Trash2,
  Edit,
  Sparkles,
  FileCheck,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Contract, Review, ApiResponse } from '../../types';
import { formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export const ClientReviewsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [commentText, setCommentText] = useState('');
  const [ratingVal, setRatingVal] = useState(5);
  const [qualityVal, setQualityVal] = useState(5);
  const [commVal, setCommVal] = useState(5);
  const [punctVal, setPunctVal] = useState(5);

  // 1. Fetch Completed Contracts to extract reviews given and pending reviews
  const { data: contractsData = [], isLoading } = useQuery<Contract[]>({
    queryKey: ['client-completed-contracts-reviews'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Contract[] | { contracts: Contract[] }>>('/contracts');
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.contracts) || [];
    },
  });

  const contracts = contractsData || [];
  const completedContracts = contracts.filter((c) => c.status === 'COMPLETED');

  const reviewsGiven: { review: Review; contract: Contract }[] = [];
  const pendingContracts: Contract[] = [];

  completedContracts.forEach((c) => {
    if (c.reviews && c.reviews.length > 0) {
      c.reviews.forEach((r) => {
        reviewsGiven.push({ review: r, contract: c });
      });
    } else {
      pendingContracts.push(c);
    }
  });

  // 2. Delete Review Mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!confirm('Are you sure you want to delete this review?')) return;
      await apiClient.delete(`/reviews/${reviewId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-completed-contracts-reviews'] });
    },
  });

  // 3. Update Review Mutation
  const updateReviewMutation = useMutation({
    mutationFn: async () => {
      if (!editingReview) return;
      await apiClient.patch(`/reviews/${editingReview.id}`, {
        overallRating: ratingVal,
        qualityRating: qualityVal,
        communicationRating: commVal,
        punctualityRating: punctVal,
        comment: commentText || undefined,
      });
    },
    onSuccess: () => {
      setEditingReview(null);
      queryClient.invalidateQueries({ queryKey: ['client-completed-contracts-reviews'] });
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>Reviews Given &amp; Artisan Feedback</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          View and manage ratings, testimonials, and feedback left for artisans on completed contracts.
        </p>
      </div>

      {/* Pending Reviews Reminder Banner */}
      {pendingContracts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold">
              Pending Reviews ({pendingContracts.length} Completed Projects)
            </h3>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              You have completed contracts awaiting feedback. Rating artisans helps build community trust.
            </p>
          </div>
          <Link
            to={`/client/contracts/${pendingContracts[0].id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0 transition-colors"
          >
            <span>Rate Now</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <Card key={n} className="p-6 border-slate-200 dark:border-slate-800 animate-pulse h-36" />
          ))}
        </div>
      ) : reviewsGiven.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <Star className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No reviews left yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Once you complete a contract with an artisan, you will be invited to leave a review and testimonial here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviewsGiven.map(({ review, contract }) => {
            const artisan = contract.artisan;
            const artisanName =
              artisan?.artisanProfile?.businessName || artisan?.email?.split('@')[0] || 'Artisan';

            return (
              <Card
                key={review.id}
                className="p-5 sm:p-6 border-slate-200 dark:border-slate-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={artisan?.avatarUrl}
                      name={artisanName}
                      size="md"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {artisanName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Project: {contract.job?.title || 'Contract Agreement'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span>{review.overallRating}.0</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingReview(review);
                          setCommentText(review.comment || '');
                          setRatingVal(review.overallRating);
                          setQualityVal(review.qualityRating || 5);
                          setCommVal(review.communicationRating || 5);
                          setPunctVal(review.punctualityRating || 5);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600"
                        title="Edit Review"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteReviewMutation.mutate(review.id)}
                        disabled={deleteReviewMutation.isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    &quot;{review.comment}&quot;
                  </p>
                )}

                {review.artisanReply && (
                  <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border-l-2 border-sky-500 text-xs space-y-1">
                    <p className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Artisan Reply:</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {review.artisanReply}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <Modal
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          title="Edit Review"
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">Overall Rating (1-5)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRatingVal(star)}
                    className="p-1 text-amber-500"
                  >
                    <Star className={`w-5 h-5 ${ratingVal >= star ? 'fill-amber-500' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400">Quality</label>
                <select
                  value={qualityVal}
                  onChange={(e) => setQualityVal(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>★ {n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400">Communication</label>
                <select
                  value={commVal}
                  onChange={(e) => setCommVal(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>★ {n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400">Punctuality</label>
                <select
                  value={punctVal}
                  onChange={(e) => setPunctVal(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>★ {n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Feedback</label>
              <textarea
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setEditingReview(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={updateReviewMutation.isPending}
                onClick={() => updateReviewMutation.mutate()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
