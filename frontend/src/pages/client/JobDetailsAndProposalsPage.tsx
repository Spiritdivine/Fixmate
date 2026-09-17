import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Star,
  MessageSquare,
  FileCheck,
  ChevronLeft,
  Edit,
  FileText,
  Send,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { Job, Proposal, ProposalStatus, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

export const JobDetailsAndProposalsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'proposals' | 'details' | 'invitations'>('proposals');

  // 1. Fetch Job Details
  const { data: job, isLoading: loadingJob, error: jobError } = useQuery<Job>({
    queryKey: ['client-job-detail', jobId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Job | { job: Job }>>(`/jobs/${jobId}`);
      return (data.data as any)?.id ? (data.data as Job) : (data.data as any)?.job;
    },
    enabled: !!jobId,
  });

  // 2. Fetch Proposals for this Job
  const { data: proposals = [], isLoading: loadingProposals } = useQuery<Proposal[]>({
    queryKey: ['job-proposals', jobId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Proposal[] | { proposals: Proposal[] }>>(
        `/proposals/job/${jobId}`
      );
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.proposals) || [];
    },
    enabled: !!jobId,
  });

  // 3. Update Proposal Status Mutation (Shortlist / Reject)
  const updateProposalStatusMutation = useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: string; status: ProposalStatus }) => {
      await apiClient.patch(`/proposals/${proposalId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-proposals', jobId] });
    },
  });

  // 4. Start Chat with Artisan
  const startChatMutation = useMutation({
    mutationFn: async (artisanUserId: string) => {
      const { data } = await apiClient.post<ApiResponse<{ conversation: { id: string } }>>(
        '/chat/conversations',
        { recipientId: artisanUserId, jobId }
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

  if (loadingJob) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium tracking-wide">Loading job & proposals...</p>
        </div>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto font-dashboard">
        <h2 className="text-xl font-bold text-slate-900">Job Not Found</h2>
        <p className="text-xs text-slate-500">
          {jobError ? getErrorMessage(jobError) : 'The requested job posting could not be found.'}
        </p>
        <Link
          to="/client/jobs"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to My Jobs</span>
        </Link>
      </div>
    );
  }

  const proposalsList = proposals || [];
  const invitationsList = job.invitations || [];

  return (
    <div className="space-y-8 pb-16 font-dashboard">
      {/* Header & Back Navigation */}
      <div className="space-y-3">
        <Link
          to="/client/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to My Jobs</span>
        </Link>
      </div>

      {/* Job Summary Banner Card */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                job.status === 'OPEN' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-500/20' 
                  : job.status === 'IN_PROGRESS' 
                  ? 'bg-blue-50 text-blue-800 border border-blue-500/20' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Posted on {formatDate(job.createdAt)}
              </span>
              {job.category && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50/60 px-2.5 py-0.5 rounded-md">
                  {job.category.name}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-1">
              <span className="flex items-center gap-1.5 text-slate-600">
                <MapPin className="w-4 h-4 text-emerald-700" />
                {job.lgaCity}, {job.state}
              </span>
              <span>•</span>
              <span className="font-bold text-slate-900">
                Budget: {formatCurrency(job.budgetMin)} – {formatCurrency(job.budgetMax)} ({job.budgetType})
              </span>
              {job.deadlineDate && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Target Deadline: {formatDate(job.deadlineDate)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {job.status === 'OPEN' && (
              <Link
                to={`/client/jobs/${job.id}/edit`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Listing</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'proposals'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Received Proposals ({proposalsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'details'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          Job Specifications
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'invitations'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>Direct Invitations ({invitationsList.length})</span>
        </button>
      </div>

      {/* TAB 1: PROPOSALS */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {loadingProposals ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <Card key={n} className="p-6 border-slate-200 animate-pulse h-40" />
              ))}
            </div>
          ) : proposalsList.length === 0 ? (
            <div className="p-12 text-center border-dashed border-slate-200 bg-white rounded-[24px] border shadow-sm">
              <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No proposals received yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Your job is live in the Artifix marketplace. You can also proactively browse the directory and invite top-rated artisans.
              </p>
              <Link
                to="/client/artisans"
                className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-900/10 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Invite Verified Artisans</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {proposalsList.map((proposal) => {
                const artisanProfile = proposal.artisan?.artisanProfile;
                const artisanName =
                  artisanProfile?.businessName || proposal.artisan?.email?.split('@')[0] || 'Artisan';

                const statusBg =
                  proposal.status === 'ACCEPTED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20'
                    : proposal.status === 'SHORTLISTED'
                    ? 'bg-purple-50 text-purple-800 border-purple-500/20'
                    : proposal.status === 'REJECTED'
                    ? 'bg-rose-50 text-rose-800 border-rose-500/20'
                    : 'bg-blue-50 text-blue-800 border-blue-500/20';

                return (
                  <div
                    key={proposal.id}
                    className="p-6 sm:p-7 bg-white rounded-[24px] border border-slate-200/80 hover:border-emerald-600/40 shadow-sm hover:shadow-md transition-all space-y-5"
                  >
                    {/* Header: Artisan Info & Bid Amount */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar
                          src={proposal.artisan?.avatarUrl}
                          name={artisanName}
                          size="md"
                          isOnline={artisanProfile?.isAvailable}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <Link
                              to={`/client/artisans/${artisanProfile?.id || proposal.artisan?.id}`}
                              className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors truncate"
                            >
                              {artisanName}
                            </Link>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${statusBg}`}>
                              {proposal.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              {Number(artisanProfile?.ratingAvg || 0).toFixed(1)}
                            </span>
                            <span>•</span>
                            <span>{artisanProfile?.completedJobsCount || 0} jobs completed</span>
                            <span>•</span>
                            <span>{artisanProfile?.lgaCity}, {artisanProfile?.state}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Proposed Escrow Bid
                        </span>
                        <p className="text-lg font-extrabold text-slate-900">
                          {formatCurrency(proposal.bidAmount)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Estimated timeline: {proposal.estimatedDays} Days
                        </p>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs space-y-1.5">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Artisan Pitch:</span>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                        {proposal.coverLetter}
                      </p>
                    </div>

                    {/* Milestone Schedule Preview if applicable */}
                    {proposal.milestones && proposal.milestones.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Proposed Milestones ({proposal.milestones.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {proposal.milestones.map((m, idx) => (
                            <div
                              key={m.id || idx}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-slate-800 truncate">
                                Step {idx + 1}: {m.title}
                              </span>
                              <span className="font-bold text-emerald-800 ml-2">
                                {formatCurrency(m.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {proposal.status !== 'SHORTLISTED' && proposal.status !== 'ACCEPTED' && (
                          <button
                            onClick={() =>
                              updateProposalStatusMutation.mutate({
                                proposalId: proposal.id,
                                status: 'SHORTLISTED',
                              })
                            }
                            disabled={updateProposalStatusMutation.isPending}
                            className="px-4 py-2 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-colors"
                          >
                            Shortlist
                          </button>
                        )}

                        {proposal.status !== 'REJECTED' && proposal.status !== 'ACCEPTED' && (
                          <button
                            onClick={() =>
                              updateProposalStatusMutation.mutate({
                                proposalId: proposal.id,
                                status: 'REJECTED',
                              })
                            }
                            disabled={updateProposalStatusMutation.isPending}
                            className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
                          >
                            Decline
                          </button>
                        )}

                        <button
                          onClick={() => startChatMutation.mutate(proposal.artisanId)}
                          disabled={startChatMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span>Chat</span>
                        </button>
                      </div>

                      {/* Hire / Accept CTA */}
                      {proposal.status !== 'ACCEPTED' && job.status === 'OPEN' && (
                        <Link
                          to={`/client/proposals/${proposal.id}/accept`}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/15 transition-all active:scale-95"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Accept &amp; Establish Escrow</span>
                        </Link>
                      )}

                      {proposal.status === 'ACCEPTED' && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Contract Created</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DETAILS */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Project Description
            </h3>
            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>

          {job.expectedOutcome && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Expected Deliverable / Outcome
              </h4>
              <p className="text-sm text-slate-600">
                {job.expectedOutcome}
              </p>
            </div>
          )}

          {job.materialsProvidedBy && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Materials Responsibility
              </h4>
              <p className="text-sm text-slate-600">
                {job.materialsProvidedBy.replace('_', ' ')}
              </p>
            </div>
          )}

          {job.completionProofReq && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Proof of Completion Requirements
              </h4>
              <p className="text-sm text-slate-600">
                {job.completionProofReq}
              </p>
            </div>
          )}

          {/* Attachments */}
          {job.attachments && job.attachments.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Attached Files &amp; Plans ({job.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {job.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-600 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {att.fileName}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-700 font-bold shrink-0">Open &rarr;</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          {invitationsList.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-dashed border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No direct invitations sent
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You can invite specific artisans directly from their public profile page to bid on this job.
              </p>
              <Link
                to="/client/artisans"
                className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all"
              >
                <span>Browse Artisan Directory</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {invitationsList.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-4 sm:p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={inv.artisan?.avatarUrl}
                      name={inv.artisan?.artisanProfile?.businessName || inv.artisan?.email || 'Artisan'}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {inv.artisan?.artisanProfile?.businessName || inv.artisan?.email}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Sent {formatDate(inv.createdAt)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      inv.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20'
                        : inv.status === 'DECLINED'
                        ? 'bg-rose-50 text-rose-800 border-rose-500/20'
                        : 'bg-amber-50 text-amber-800 border-amber-500/20'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
