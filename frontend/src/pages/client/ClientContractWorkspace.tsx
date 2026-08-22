import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  Wallet as WalletIcon,
  AlertTriangle,
  Star,
  Lock,
  Sparkles,
  Eye,
  RefreshCw,
  X,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import {
  Contract,
  Milestone,
  ApiResponse,
  Wallet,
} from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const ClientContractWorkspace: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'milestones' | 'transactions' | 'chat' | 'dispute' | 'review'>('milestones');

  // Modals state
  const [fundingMilestone, setFundingMilestone] = useState<Milestone | null>(null);
  const [inspectingMilestone, setInspectingMilestone] = useState<Milestone | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Dispute form state
  const [disputeReason, setDisputeReason] = useState('Poor workmanship or incomplete deliverables');
  const [disputeExplanation, setDisputeExplanation] = useState('');
  const [disputeMilestoneId, setDisputeMilestoneId] = useState('');

  // Review form state
  const [overallRating, setOverallRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Chat input
  const [chatMessage, setChatMessage] = useState('');

  // 1. Fetch Contract Details
  const { data: contract, isLoading, error } = useQuery<Contract>({
    queryKey: ['client-contract-workspace', contractId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Contract | { contract: Contract }>>(
        `/contracts/${contractId}`
      );
      return (data.data as any)?.id ? (data.data as Contract) : (data.data as any)?.contract;
    },
    enabled: !!contractId,
  });

  // 2. Fetch Client Wallet
  const { data: wallet } = useQuery<Wallet>({
    queryKey: ['client-wallet'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Wallet | { wallet: Wallet }>>('/wallets/my-wallet');
      return (data.data as any)?.availableBalance !== undefined ? (data.data as Wallet) : (data.data as any)?.wallet;
    },
  });

  // 3. Fund Milestone Mutation
  const fundMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await apiClient.post(`/escrow/fund-milestone/${milestoneId}`, {});
    },
    onSuccess: () => {
      setFundingMilestone(null);
      queryClient.invalidateQueries({ queryKey: ['client-contract-workspace', contractId] });
      queryClient.invalidateQueries({ queryKey: ['client-wallet'] });
      alert('Milestone funded into escrow successfully!');
    },
    onError: (err) => {
      alert(`Funding failed: ${getErrorMessage(err)}`);
    },
  });

  // 4. Approve & Release Funds Mutation
  const approveReleaseMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await apiClient.post(`/escrow/approve-release/${milestoneId}`, {});
    },
    onSuccess: () => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setInspectingMilestone(null);
      queryClient.invalidateQueries({ queryKey: ['client-contract-workspace', contractId] });
      queryClient.invalidateQueries({ queryKey: ['client-wallet'] });
    },
    onError: (err) => {
      alert(`Release failed: ${getErrorMessage(err)}`);
    },
  });

  // 5. Request Revision Mutation
  const requestRevisionMutation = useMutation({
    mutationFn: async ({ milestoneId, reason }: { milestoneId: string; reason: string }) => {
      await apiClient.patch(`/escrow/request-revision/${milestoneId}`, {
        revisionNotes: reason,
        reason,
      });
    },
    onSuccess: () => {
      setInspectingMilestone(null);
      setShowRevisionInput(false);
      setRevisionNotes('');
      queryClient.invalidateQueries({ queryKey: ['client-contract-workspace', contractId] });
      alert('Revision request sent to artisan.');
    },
    onError: (err) => {
      alert(`Revision request failed: ${getErrorMessage(err)}`);
    },
  });


  // 6. Raise Dispute Mutation
  const raiseDisputeMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/disputes', {
        contractId,
        milestoneId: disputeMilestoneId || undefined,
        reason: disputeReason,
        explanation: disputeExplanation,
      });
    },
    onSuccess: () => {
      setDisputeModalOpen(false);
      setDisputeExplanation('');
      queryClient.invalidateQueries({ queryKey: ['client-contract-workspace', contractId] });
      alert('Dispute opened. An administrative arbitrator will mediate.');
    },
    onError: (err) => {
      alert(`Dispute filing failed: ${getErrorMessage(err)}`);
    },
  });

  // 7. Submit Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/reviews', {
        contractId,
        overallRating,
        qualityRating,
        communicationRating,
        punctualityRating,
        comment: reviewComment,
      });
    },
    onSuccess: () => {
      setReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['client-contract-workspace', contractId] });
      alert('Thank you for rating your artisan!');
    },
    onError: (err) => {
      alert(`Review submission failed: ${getErrorMessage(err)}`);
    },
  });

  // 8. Sync On-Chain State Mutation
  const syncOnChainMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/escrow/sync-onchain/${contractId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contract-workspace', contractId] });
      alert('On-chain state synchronized successfully!');
    },
  });

  // 9. Send Chat Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!chatMessage.trim() || !contract?.artisanId) return;
      await apiClient.post('/chat/conversations', {
        recipientId: contract.artisanId,
        body: chatMessage,
      });
    },
    onSuccess: () => {
      setChatMessage('');
      queryClient.invalidateQueries({ queryKey: ['client-contract-workspace', contractId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Contract Not Found</h2>
        <p className="text-xs text-slate-500">
          {error ? getErrorMessage(error) : 'The requested contract workspace does not exist.'}
        </p>
        <Link
          to="/client/contracts"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Contracts</span>
        </Link>
      </div>
    );
  }

  const artisan = contract.artisan;
  const artisanProfile = artisan?.artisanProfile;
  const artisanName =
    artisanProfile?.businessName || artisan?.email?.split('@')[0] || 'Artisan';

  const milestones = contract.milestones || [];
  const transactions = contract.transactions || [];
  const disputes = contract.disputes || [];
  const reviews = contract.reviews || [];
  const hasClientReviewed = reviews.some((r) => r.reviewerId === contract.clientId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Link & Title */}
      <div>
        <Link
          to="/client/contracts"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Contracts Hub</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-mono font-bold">
                {contract.contractCode}
              </span>
              <Badge variant={contract.status === 'ACTIVE' ? 'emerald' : 'amber'}>
                {contract.status.replace('_', ' ')}
              </Badge>
              {contract.onChainEscrowId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Sparkles className="w-3 h-3" />
                  <span>Monad Escrow #{contract.onChainEscrowId}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {contract.job?.title || 'Contract Workspace'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => syncOnChainMutation.mutate()}
              disabled={syncOnChainMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              title="Synchronize on-chain Monad smart contract state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncOnChainMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Sync On-Chain</span>
            </button>

            {contract.status === 'COMPLETED' && !hasClientReviewed && (
              <button
                onClick={() => setReviewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Leave Review</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Financial Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500">Total Contract</span>
          <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(contract.totalAmount)}
          </p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500">Escrow Funded</span>
          <p className="text-lg font-black text-sky-600 dark:text-sky-400 mt-1">
            {formatCurrency(contract.escrowFundedAmount)}
          </p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500">Released to Artisan</span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(contract.escrowReleasedAmount)}
          </p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500">Refunded / Disputed</span>
          <p className="text-lg font-black text-slate-600 dark:text-slate-400 mt-1">
            {formatCurrency(contract.escrowRefundedAmount)}
          </p>
        </Card>
      </div>

      {/* Workspace Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'milestones'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Milestones ({milestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <WalletIcon className="w-3.5 h-3.5" />
          <span>Escrow Ledger ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dispute')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'dispute'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Disputes ({disputes.length})</span>
        </button>
      </div>

      {/* TAB 1: MILESTONES PROGRESSION */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {milestones.map((m, index) => {
              const isFunded = m.status === 'FUNDED' || m.status === 'IN_PROGRESS';
              const isSubmitted = m.status === 'SUBMITTED';
              const isReleased = m.status === 'APPROVED' || m.status === 'RELEASED';
              const isPendingFunding = m.status === 'PENDING_FUNDING';

              return (
                <Card
                  key={m.id}
                  className={`p-5 sm:p-6 border transition-all ${
                    isSubmitted
                      ? 'border-amber-500/60 bg-amber-50/10 dark:bg-amber-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Step {m.stepOrder || index + 1}
                        </span>
                        <Badge
                          variant={
                            isReleased
                              ? 'emerald'
                              : isSubmitted
                              ? 'amber'
                              : isFunded
                              ? 'blue'
                              : 'slate'
                          }
                        >
                          {m.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {m.title}
                      </h3>

                      {m.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {m.description}
                        </p>
                      )}

                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                        {m.fundedAt && <span>Funded on: {formatDate(m.fundedAt)}</span>}
                        {m.submittedAt && <span>Work submitted: {formatDate(m.submittedAt)}</span>}
                        {m.releasedAt && <span className="text-emerald-600 font-bold">Funds released: {formatDate(m.releasedAt)}</span>}
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Milestone Amount
                        </span>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(m.amount)}
                        </p>
                      </div>

                      {/* ACTION BUTTONS ACCORDING TO MILESTONE STATUS */}
                      {isPendingFunding && (
                        <button
                          onClick={() => setFundingMilestone(m)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all active:scale-95"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Fund Milestone</span>
                        </button>
                      )}

                      {isSubmitted && (
                        <button
                          onClick={() => setInspectingMilestone(m)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all active:scale-95 animate-pulse"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Submitted Work</span>
                        </button>
                      )}

                      {isFunded && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Artisan is working...</span>
                        </span>
                      )}

                      {isReleased && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed &amp; Released</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS / ESCROW LEDGER */}
      {activeTab === 'transactions' && (
        <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Escrow Audit Ledger &amp; Transactions
          </h3>
          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No financial transactions recorded for this contract yet.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {tx.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Ref: {tx.reference} • {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(tx.amount)}
                    </span>
                    <Badge variant={tx.status === 'SUCCESS' ? 'emerald' : 'amber'}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: DISPUTES */}
      {activeTab === 'dispute' && (
        <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Dispute Center &amp; Mediation
              </h3>
              <p className="text-xs text-slate-500">
                If the artisan fails to perform or violates deliverables, you can initiate formal arbitration.
              </p>
            </div>
            {disputes.length === 0 && contract.status !== 'COMPLETED' && (
              <button
                onClick={() => setDisputeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Open Dispute</span>
              </button>
            )}
          </div>

          {disputes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No active disputes on this contract.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All milestones are running smoothly under escrow protection.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((dsp) => (
                <div
                  key={dsp.id}
                  className="p-4 rounded-xl bg-rose-50/20 border border-rose-500/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-600 font-mono">
                      Dispute #{dsp.disputeCode}
                    </span>
                    <Badge variant="rose">{dsp.status}</Badge>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">
                    Reason: {dsp.reason}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {dsp.explanation}
                  </p>
                  <Link
                    to={`/client/disputes/${dsp.id}`}
                    className="inline-block text-xs font-bold text-sky-600 hover:underline pt-2"
                  >
                    Open Dispute Workspace &amp; Arbitration Chat &rarr;
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* FUND MILESTONE MODAL */}
      {fundingMilestone && (
        <Modal
          isOpen={!!fundingMilestone}
          onClose={() => setFundingMilestone(null)}
          title={`Fund Milestone: ${fundingMilestone.title}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              You are locking <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(fundingMilestone.amount)}</span> into smart escrow. The artisan will only receive these funds once you inspect the completed work and approve.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-slate-500">Your Available Wallet Balance:</span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">
                {formatCurrency(wallet?.availableBalance || 0)}
              </span>
            </div>

            {Number(wallet?.availableBalance || 0) < Number(fundingMilestone.amount) && (
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
                Your available balance is low. Please deposit funds via Paystack or use Monad Web3.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setFundingMilestone(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={fundMilestoneMutation.isPending}
                onClick={() => fundMilestoneMutation.mutate(fundingMilestone.id)}
              >
                {fundMilestoneMutation.isPending ? 'Funding...' : 'Confirm Escrow Lock'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* INSPECT SUBMITTED WORK MODAL */}
      {inspectingMilestone && (
        <Modal
          isOpen={!!inspectingMilestone}
          onClose={() => {
            setInspectingMilestone(null);
            setShowRevisionInput(false);
          }}
          title={`Work Inspection: ${inspectingMilestone.title}`}
        >
          <div className="space-y-5 text-xs">
            {/* Submission Notes */}
            <div className="space-y-1">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Artisan&apos;s Notes:</h4>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                {inspectingMilestone.submissionNotes || 'Work has been completed as specified.'}
              </p>
            </div>

            {/* Proof Photos */}
            {inspectingMilestone.submissionProofUrls && inspectingMilestone.submissionProofUrls.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">
                  Proof of Work Photos ({inspectingMilestone.submissionProofUrls.length}):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {inspectingMilestone.submissionProofUrls.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxImage(url)}
                      className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer group relative"
                    >
                      <img src={url} alt={`Proof ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        View
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revision Input Box */}
            {showRevisionInput && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Revision Instructions for Artisan:
                </label>
                <textarea
                  rows={3}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Explain exactly what needs rework or adjustment..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
                />
                <Button
                  size="sm"
                  disabled={!revisionNotes.trim() || requestRevisionMutation.isPending}
                  onClick={() =>
                    requestRevisionMutation.mutate({
                      milestoneId: inspectingMilestone.id,
                      reason: revisionNotes,
                    })
                  }
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Send Revision Request
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            {!showRevisionInput && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRevisionInput(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold hover:bg-amber-100"
                >
                  Request Revision
                </button>

                <Button
                  size="sm"
                  disabled={approveReleaseMutation.isPending}
                  onClick={() => approveReleaseMutation.mutate(inspectingMilestone.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {approveReleaseMutation.isPending ? 'Releasing...' : 'Approve & Release Funds'}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* RAISE DISPUTE MODAL */}
      {disputeModalOpen && (
        <Modal
          isOpen={disputeModalOpen}
          onClose={() => setDisputeModalOpen(false)}
          title="Open Dispute for Arbitration"
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Milestone (Optional)</label>
              <select
                value={disputeMilestoneId}
                onChange={(e) => setDisputeMilestoneId(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">Entire Contract / General Dispute</option>
                {milestones.map((m, idx) => (
                  <option key={m.id} value={m.id}>
                    Step {idx + 1}: {m.title} ({formatCurrency(m.amount)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Reason</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="Poor workmanship or incomplete deliverables">Poor workmanship or incomplete deliverables</option>
                <option value="Artisan abandoned job / unresponsive">Artisan abandoned job / unresponsive</option>
                <option value="Damage to property during work">Damage to property during work</option>
                <option value="Unreasonable schedule delay">Unreasonable schedule delay</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Explanation &amp; Evidence Summary</label>
              <textarea
                rows={4}
                value={disputeExplanation}
                onChange={(e) => setDisputeExplanation(e.target.value)}
                placeholder="Explain what transpired in detail..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setDisputeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!disputeExplanation.trim() || raiseDisputeMutation.isPending}
                onClick={() => raiseDisputeMutation.mutate()}
                className="bg-rose-600 hover:bg-rose-500 text-white"
              >
                Submit Dispute
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* LEAVE REVIEW MODAL */}
      {reviewModalOpen && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Rate & Review ${artisanName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">Overall Rating (1-5)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setOverallRating(star)}
                    className="p-1 text-amber-500 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-6 h-6 ${overallRating >= star ? 'fill-amber-500' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400">Quality</label>
                <select
                  value={qualityRating}
                  onChange={(e) => setQualityRating(Number(e.target.value))}
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
                  value={communicationRating}
                  onChange={(e) => setCommunicationRating(Number(e.target.value))}
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
                  value={punctualityRating}
                  onChange={(e) => setPunctualityRating(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>★ {n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Feedback / Testimonial</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience working with this artisan..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={submitReviewMutation.isPending}
                onClick={() => submitReviewMutation.mutate()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Submit Review
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white p-1 hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Proof Full View"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
