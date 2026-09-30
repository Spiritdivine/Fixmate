import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  FileCheck,
  MessageSquare,
  ShieldCheck,
  Trash2,
  AlertCircle,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Percent,
  Layers,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { Proposal, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';

export const SubmittedProposalPage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBidAmount, setEditBidAmount] = useState('');
  const [editCoverLetter, setEditCoverLetter] = useState('');
  const [editModalError, setEditModalError] = useState<string | null>(null);

  // 1. Fetch Proposal Detail
  const { data: proposal, isLoading, error } = useQuery<Proposal>({
    queryKey: ['artisan-proposal-detail', proposalId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Proposal | { proposal: Proposal }>>(
        `/proposals/${proposalId}`
      );
      const res = (data.data as any)?.id ? (data.data as Proposal) : (data.data as any)?.proposal;
      return res;
    },
    enabled: !!proposalId,
  });

  // 2. Withdraw Mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/proposals/${proposalId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisan-proposal-detail', proposalId] });
      navigate('/artisan/proposals');
    },
  });

  // 3. Edit Proposal Mutation
  const editMutation = useMutation({
    mutationFn: async (payload: { bidAmount: number; coverLetter: string }) => {
      await apiClient.put(`/proposals/${proposalId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisan-proposal-detail', proposalId] });
      setIsEditModalOpen(false);
    },
    onError: (err) => {
      setEditModalError(getErrorMessage(err));
    },
  });

  // 4. Start Chat Mutation with Client
  const startChatMutation = useMutation({
    mutationFn: async () => {
      if (!proposal?.job?.client?.id) return;
      const { data } = await apiClient.post<ApiResponse<{ conversation: { id: string } }>>(
        '/chat/conversations',
        { recipientId: proposal.job.client.id, jobId: proposal.jobId }
      );
      return data.data.conversation;
    },
    onSuccess: (conversation) => {
      if (conversation?.id) {
        navigate(`/artisan/messages?conversationId=${conversation.id}`);
      } else {
        navigate('/artisan/messages');
      }
    },
  });

  const handleOpenEdit = () => {
    if (!proposal) return;
    setEditBidAmount(String(proposal.bidAmount));
    setEditCoverLetter(proposal.coverLetter);
    setEditModalError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBidAmount || !editCoverLetter.trim()) return;
    editMutation.mutate({
      bidAmount: parseFloat(editBidAmount),
      coverLetter: editCoverLetter.trim(),
    });
  };

  const handleWithdraw = () => {
    if (window.confirm('Are you sure you want to withdraw this proposal? This cannot be undone.')) {
      withdrawMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Proposal Not Found</h2>
        <p className="text-sm text-slate-500">
          This quotation may have been withdrawn or you do not have permission to view it.
        </p>
        <Link to="/artisan/proposals">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Proposals
          </Button>
        </Link>
      </div>
    );
  }

  const grossBid = Number(proposal.bidAmount) || 0;
  const platformFee = grossBid * 0.05; // 5% escrow fee
  const netEarnings = grossBid - platformFee;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/artisan/proposals" className="hover:text-slate-600 transition flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Proposals
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-600 font-semibold truncate max-w-xs">{proposal.job?.title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Submitted Proposal Review
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {proposal.status === 'PENDING' && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-3.5 h-3.5" />}
                onClick={handleOpenEdit}
              >
                Revise Quotation
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
              >
                Withdraw
              </Button>
            </>
          )}

          {proposal.status === 'ACCEPTED' && proposal.contract && (
            <Link to={`/artisan/contracts/${proposal.contract.id}`}>
              <Button size="sm" className="bg-[#123E2A] hover:bg-[#0e3222] text-white" leftIcon={<FileCheck className="w-4 h-4" />}>
                Open Funded Contract
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          proposal.status === 'ACCEPTED'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : proposal.status === 'SHORTLISTED'
            ? 'bg-blue-50 border-blue-200 text-blue-900'
            : proposal.status === 'REJECTED'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : proposal.status === 'WITHDRAWN'
            ? 'bg-slate-100 border-slate-200 text-slate-700'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <Badge status={proposal.status} className="text-xs px-3 py-1 font-bold">
            {proposal.status}
          </Badge>
          <div className="text-xs font-medium">
            {proposal.status === 'ACCEPTED' && 'Congratulations! The client accepted your bid and launched the contract in escrow.'}
            {proposal.status === 'SHORTLISTED' && 'You have been shortlisted by the client! Expect a message or contract offer.'}
            {proposal.status === 'PENDING' && 'Your bid is currently pending client review and comparison.'}
            {proposal.status === 'REJECTED' && 'The client selected another proposal for this particular job.'}
            {proposal.status === 'WITHDRAWN' && 'You withdrew this quotation from consideration.'}
          </div>
        </div>

        <span className="text-xs text-slate-500 shrink-0 hidden sm:inline">
          Submitted on {formatDate(proposal.createdAt)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quotation Breakdown & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Breakdown Card */}
          <Card className="p-6 space-y-6 bg-white border-slate-200 shadow-sm rounded-2xl">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Quotation &amp; Escrow Payout Breakdown</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Gross Bid Quotation
                </span>
                <span className="text-xl font-black text-slate-900">
                  {formatCurrency(grossBid)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Platform Escrow Fee (5%)
                </span>
                <span className="text-xl font-bold text-rose-600">
                  -{formatCurrency(platformFee)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Net Take-Home Earnings
                </span>
                <span className="text-xl font-black text-emerald-700">
                  {formatCurrency(netEarnings)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Estimated Duration: <strong>{proposal.estimatedDays || 7} Days</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by Monad Smart Escrow</span>
              </div>
            </div>
          </Card>

          {/* Cover Letter */}
          <Card className="p-6 space-y-3 bg-white border-slate-200 shadow-sm rounded-2xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-stone-500">
              Your Proposal Pitch &amp; Cover Letter
            </h3>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-sans">
              {proposal.coverLetter}
            </div>
          </Card>

          {/* Proposed Milestone Schedule */}
          {proposal.milestones && proposal.milestones.length > 0 && (
            <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-stone-500">
                  Proposed Milestone Schedule ({proposal.milestones.length})
                </h3>
                <span className="text-xs font-semibold text-emerald-600">
                  Total: {formatCurrency(grossBid)}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {proposal.milestones.map((m) => {
                  const mAmount = Number(m.amount) || 0;
                  const pct = grossBid > 0 ? Math.round((mAmount / grossBid) * 100) : 0;
                  return (
                    <div key={m.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          #{m.stepOrder}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{m.title}</h4>
                          <span className="text-[11px] text-slate-500">
                            Est. {m.estimatedDays || 3} days &bull; {pct}% of total contract
                          </span>
                        </div>
                      </div>

                      <span className="text-sm font-extrabold text-emerald-700 shrink-0">
                        {formatCurrency(mAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Job Brief & Client Info */}
        <div className="space-y-6">
          {/* Job Overview */}
          <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm rounded-2xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-stone-500">
              Target Job Specification
            </h3>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-slate-900">{proposal.job?.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed">
                {proposal.job?.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Category:</span>
                <span className="font-semibold text-slate-800">{proposal.job?.category?.name || 'General Trade'}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Client Budget:</span>
                <span className="font-semibold text-slate-800">
                  {proposal.job?.budgetMin && proposal.job?.budgetMax
                    ? `${formatCurrency(proposal.job.budgetMin)} - ${formatCurrency(proposal.job.budgetMax)}`
                    : proposal.job?.budgetMin
                    ? formatCurrency(proposal.job.budgetMin)
                    : 'Flexible'}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Location:</span>
                <span className="font-semibold text-slate-800">
                  {proposal.job?.lgaCity}, {proposal.job?.state}
                </span>
              </div>
            </div>

            <Link to={`/artisan/jobs/${proposal.jobId}`} className="block pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Inspect Original Job Post &rarr;
              </Button>
            </Link>
          </Card>

          {/* Client Details & Chat */}
          <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm rounded-2xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-stone-500">
              Client Profile
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#123E2A] text-white flex items-center justify-center font-bold text-base">
                {proposal.job?.client?.clientProfile?.firstName?.[0] || 'C'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {proposal.job?.client?.clientProfile?.firstName || 'Verified'}{' '}
                  {proposal.job?.client?.clientProfile?.lastName || 'Client'}
                </h4>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Identity &amp; Wallet Verified
                </span>
              </div>
            </div>

            <Button
              size="sm"
              className="w-full bg-[#123E2A] hover:bg-[#0e3222] text-white"
              leftIcon={<MessageSquare className="w-4 h-4" />}
              onClick={() => startChatMutation.mutate()}
              disabled={startChatMutation.isPending}
            >
              {startChatMutation.isPending ? 'Connecting...' : 'Message Client'}
            </Button>
          </Card>
        </div>
      </div>

      {/* Edit Quotation Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Revise Your Bid Quotation"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editModalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                {editModalError}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Total Bid Quotation (NGN)
              </label>
              <Input
                type="number"
                value={editBidAmount}
                onChange={(e) => setEditBidAmount(e.target.value)}
                required
                min={1000}
                placeholder="e.g. 75000"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Revised Cover Letter &amp; Timeline Pitch
              </label>
              <Textarea
                rows={5}
                value={editCoverLetter}
                onChange={(e) => setEditCoverLetter(e.target.value)}
                required
                placeholder="Explain any adjustments in your cost or schedule..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={editMutation.isPending} className="bg-[#123E2A] text-white">
                {editMutation.isPending ? 'Saving...' : 'Update Quotation'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
