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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Job Not Found</h2>
        <p className="text-xs text-slate-500">
          {jobError ? getErrorMessage(jobError) : 'The requested job posting could not be found.'}
        </p>
        <Link
          to="/client/jobs"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button */}
      <div>
        <Link
          to="/client/jobs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to My Jobs</span>
        </Link>
      </div>

      {/* Job Summary Header */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={job.status === 'OPEN' ? 'blue' : job.status === 'IN_PROGRESS' ? 'emerald' : 'slate'}>
                {job.status}
              </Badge>
              <span className="text-xs text-slate-400">
                Posted on {formatDate(job.createdAt)}
              </span>
              {job.category && (
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                  • {job.category.name}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {job.title}
            </h1>

            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {job.lgaCity}, {job.state}
              </span>
              <span>•</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Budget: {formatCurrency(job.budgetMin)} – {formatCurrency(job.budgetMax)} ({job.budgetType})
              </span>
              {job.deadlineDate && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Deadline: {formatDate(job.deadlineDate)}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {job.status === 'OPEN' && (
              <Link
                to={`/client/jobs/${job.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Job</span>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'proposals'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Received Proposals ({proposalsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'details'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Job Scope &amp; Specifications
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'invitations'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Invited Artisans ({invitationsList.length})</span>
        </button>
      </div>

      {/* TAB 1: PROPOSALS */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {loadingProposals ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <Card key={n} className="p-6 border-slate-200 dark:border-slate-800 animate-pulse h-40" />
              ))}
            </div>
          ) : proposalsList.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No proposals received yet
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Your job is live in the artisan marketplace. You can also proactively browse the directory and invite top-rated artisans.
              </p>
              <Link
                to="/client/artisans"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Invite Verified Artisans</span>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposalsList.map((proposal) => {
                const artisanProfile = proposal.artisan?.artisanProfile;
                const artisanName =
                  artisanProfile?.businessName || proposal.artisan?.email?.split('@')[0] || 'Artisan';

                const statusVariant =
                  proposal.status === 'ACCEPTED'
                    ? 'emerald'
                    : proposal.status === 'SHORTLISTED'
                    ? 'purple'
                    : proposal.status === 'REJECTED'
                    ? 'rose'
                    : 'blue';

                return (
                  <Card
                    key={proposal.id}
                    className="p-5 sm:p-6 border-slate-200 dark:border-slate-800 hover:border-sky-500/40 transition-all space-y-4"
                  >
                    {/* Header: Artisan Info & Bid Amount */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={proposal.artisan?.avatarUrl}
                          name={artisanName}
                          size="md"
                          isOnline={artisanProfile?.isAvailable}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/client/artisans/${artisanProfile?.id || proposal.artisan?.id}`}
                              className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-sky-600 transition-colors truncate"
                            >
                              {artisanName}
                            </Link>
                            <Badge variant={statusVariant as any}>{proposal.status}</Badge>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-amber-500" />
                              {Number(artisanProfile?.ratingAvg || 0).toFixed(1)}
                            </span>
                            <span>•</span>
                            <span>{artisanProfile?.completedJobsCount || 0} jobs completed</span>
                            <span>•</span>
                            <span>{artisanProfile?.lgaCity}, {artisanProfile?.state}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Proposed Bid
                        </span>
                        <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                          {formatCurrency(proposal.bidAmount)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Estimated timeline: {proposal.estimatedDays} Days
                        </p>
                      </div>
                    </div>

                    {/* Cover Letter */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Cover Letter:</span>
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                        {proposal.coverLetter}
                      </p>
                    </div>

                    {/* Milestone Schedule Preview if applicable */}
                    {proposal.milestones && proposal.milestones.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Proposed Milestones ({proposal.milestones.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {proposal.milestones.map((m, idx) => (
                            <div
                              key={m.id || idx}
                              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                Step {idx + 1}: {m.title}
                              </span>
                              <span className="font-bold text-sky-600 dark:text-sky-400 ml-2">
                                {formatCurrency(m.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold transition-colors"
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
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold transition-colors"
                          >
                            Decline
                          </button>
                        )}

                        <button
                          onClick={() => startChatMutation.mutate(proposal.artisanId)}
                          disabled={startChatMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      </div>

                      {/* Hire / Accept CTA */}
                      {proposal.status !== 'ACCEPTED' && job.status === 'OPEN' && (
                        <Link
                          to={`/client/proposals/${proposal.id}/accept`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Accept &amp; Establish Escrow</span>
                        </Link>
                      )}

                      {proposal.status === 'ACCEPTED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Contract Created</span>
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DETAILS */}
      {activeTab === 'details' && (
        <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Project Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>

          {job.expectedOutcome && (
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Expected Deliverable / Outcome
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {job.expectedOutcome}
              </p>
            </div>
          )}

          {job.materialsProvidedBy && (
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Materials Responsibility
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {job.materialsProvidedBy.replace('_', ' ')}
              </p>
            </div>
          )}

          {job.completionProofReq && (
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Proof of Completion Requirements
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {job.completionProofReq}
              </p>
            </div>
          )}

          {/* Attachments */}
          {job.attachments && job.attachments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Attached Files &amp; Plans ({job.attachments.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {job.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {att.fileName}
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-600 font-bold shrink-0">Open &rarr;</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          {invitationsList.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
              <Send className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No direct invitations sent
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You can invite specific artisans directly from their public profile page to bid on this job.
              </p>
              <Link
                to="/client/artisans"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
              >
                <span>Browse Artisan Directory</span>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {invitationsList.map((inv) => (
                <Card
                  key={inv.id}
                  className="p-4 border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={inv.artisan?.avatarUrl}
                      name={inv.artisan?.artisanProfile?.businessName || inv.artisan?.email || 'Artisan'}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {inv.artisan?.artisanProfile?.businessName || inv.artisan?.email}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Sent {formatDate(inv.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      inv.status === 'ACCEPTED'
                        ? 'emerald'
                        : inv.status === 'DECLINED'
                        ? 'rose'
                        : 'amber'
                    }
                  >
                    {inv.status}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
