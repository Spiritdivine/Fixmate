import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Star,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileCheck,
  MessageSquare,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { Proposal, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

export const ProposalReviewPage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch Proposal Detail
  const { data: proposal, isLoading, error } = useQuery<Proposal>({
    queryKey: ['client-proposal-review', proposalId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Proposal | { proposal: Proposal }>>(
        `/proposals/${proposalId}`
      );
      return (data.data as any)?.id ? (data.data as Proposal) : (data.data as any)?.proposal;
    },
    enabled: !!proposalId,
  });

  // 2. Shortlist / Reject Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'SHORTLISTED' | 'REJECTED') => {
      await apiClient.patch(`/proposals/${proposalId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-proposal-review', proposalId] });
    },
  });

  // 3. Start Chat Mutation
  const startChatMutation = useMutation({
    mutationFn: async () => {
      if (!proposal?.artisanId) return;
      const { data } = await apiClient.post<ApiResponse<{ conversation: { id: string } }>>(
        '/chat/conversations',
        { recipientId: proposal.artisanId, jobId: proposal.jobId }
      );
      return data.data.conversation;
    },
    onSuccess: (conversation) => {
      if (conversation?.id) {
        navigate(`/client/messages?conversationId=${conversation.id}`);
      } else {
        navigate('/client/messages');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Proposal Not Found</h2>
        <p className="text-xs text-slate-500">
          {error ? getErrorMessage(error) : 'The requested proposal does not exist.'}
        </p>
        <Link
          to="/client/jobs"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to My Jobs</span>
        </Link>
      </div>
    );
  }

  const artisan = proposal.artisan;
  const artisanProfile = artisan?.artisanProfile;
  const artisanName = artisanProfile?.businessName || artisan?.email?.split('@')[0] || 'Artisan';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-dashboard">
      {/* Back Link */}
      <div className="space-y-3">
        <Link
          to={`/client/jobs/${proposal.jobId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Job &amp; All Proposals</span>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Proposal Evaluation
          </h1>
          <p className="text-sm text-slate-500">
            Review detailed terms, milestone timeline, and pricing submitted by this artisan.
          </p>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <Avatar
              src={artisan?.avatarUrl}
              name={artisanName}
              size="lg"
              isOnline={artisanProfile?.isAvailable}
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900">
                  {artisanName}
                </h2>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                  proposal.status === 'ACCEPTED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20'
                    : 'bg-blue-50 text-blue-800 border-blue-500/20'
                }`}>
                  {proposal.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-3">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {Number(artisanProfile?.ratingAvg || 0).toFixed(1)}
                </span>
                <span>•</span>
                <span>{artisanProfile?.lgaCity}, {artisanProfile?.state}</span>
                <span>•</span>
                <span>{artisanProfile?.yearsOfExperience || 0} yrs experience</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 bg-slate-50/80 px-5 py-3 rounded-2xl border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Total Proposed Bid
            </span>
            <p className="text-2xl font-black text-slate-900">
              {formatCurrency(proposal.bidAmount)}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Estimated Duration: {proposal.estimatedDays} Days
            </p>
          </div>
        </div>

        {/* Cover Letter */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Proposal Statement / Cover Letter
          </h3>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {proposal.coverLetter}
          </div>
        </div>

        {/* Milestones Breakdown */}
        {proposal.milestones && proposal.milestones.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Proposed Milestones ({proposal.milestones.length})
            </h3>
            <div className="space-y-2.5">
              {proposal.milestones.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wide">
                      Step {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {m.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-800 text-base">
                      {formatCurrency(m.amount)}
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium">{m.estimatedDays} days</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Bottom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateStatusMutation.mutate('SHORTLISTED')}
              disabled={updateStatusMutation.isPending || proposal.status === 'SHORTLISTED'}
              className="px-5 py-2.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-colors disabled:opacity-50"
            >
              Shortlist
            </button>
            <button
              onClick={() => updateStatusMutation.mutate('REJECTED')}
              disabled={updateStatusMutation.isPending || proposal.status === 'REJECTED'}
              className="px-5 py-2.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={() => startChatMutation.mutate()}
              disabled={startChatMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Discuss via Chat</span>
            </button>
          </div>

          {proposal.status !== 'ACCEPTED' && (
            <Link
              to={`/client/proposals/${proposal.id}/accept`}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/15 transition-all active:scale-95"
            >
              <FileCheck className="w-4 h-4" />
              <span>Accept &amp; Establish Escrow Contract</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
