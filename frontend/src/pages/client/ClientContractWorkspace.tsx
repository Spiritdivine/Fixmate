import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Coins,
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
import { ContractLocationCard } from '../../components/contracts/ContractLocationCard';
import {
  hasWeb3Provider,
  connectWallet,
  getUsdcBalance,
  getUsdcAllowance,
  approveUsdc,
  mintTestUsdc,
  fundOnChainEscrow,
  releaseOnChainEscrow,
  raiseDisputeOnChain,
  ESCROW_CONTRACT_ADDRESS,
  STABLECOIN_ADDRESS,
  MONAD_EXPLORER_URL,
} from '../../lib/monad-web3';
import { useUnifiedWallet } from '../../lib/privy-provider';

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

  // Web3 Monad USDC State
  const { address: unifiedAddress, connect: connectUnified } = useUnifiedWallet();
  const [fundingRail, setFundingRail] = useState<'fiat' | 'usdc'>('fiat');
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [usdcAllowance, setUsdcAllowance] = useState<string>('0.00');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [isApprovingUsdc, setIsApprovingUsdc] = useState(false);
  const [isMintingUsdc, setIsMintingUsdc] = useState(false);
  const [isLockingUsdc, setIsLockingUsdc] = useState(false);
  const [isReleasingOnChain, setIsReleasingOnChain] = useState(false);

  useEffect(() => {
    if (unifiedAddress) {
      setConnectedWallet(unifiedAddress);
      refreshWalletState(unifiedAddress);
    }
  }, [unifiedAddress]);

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

  // Helper to refresh on-chain wallet balance & allowance
  const refreshWalletState = async (addr?: string) => {
    const addressToUse = addr || connectedWallet;
    if (!addressToUse) return;
    try {
      const [bal, allow] = await Promise.all([
        getUsdcBalance(addressToUse),
        getUsdcAllowance(addressToUse),
      ]);
      setUsdcBalance(bal);
      setUsdcAllowance(allow);
    } catch {
      // ignore
    }
  };

  const handleConnectWallet = async () => {
    try {
      setIsConnectingWallet(true);
      const { address } = await connectWallet();
      setConnectedWallet(address);
      await refreshWalletState(address);
    } catch (err: any) {
      alert(`Wallet connection failed: ${err.message}`);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleMintFaucet = async () => {
    try {
      setIsMintingUsdc(true);
      await mintTestUsdc(100);
      await refreshWalletState();
      alert('100 Test USDC minted to your wallet on Monad Testnet!');
    } catch (err: any) {
      alert(`Faucet mint failed: ${err.message}`);
    } finally {
      setIsMintingUsdc(false);
    }
  };

  const handleApproveUsdc = async (neededAmount: number) => {
    try {
      setIsApprovingUsdc(true);
      await approveUsdc(neededAmount);
      await refreshWalletState();
      alert('USDC spending approved for Escrow contract!');
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsApprovingUsdc(false);
    }
  };

  // 3. Fund Milestone Mutation (Supports Fiat or Web3)
  const fundMilestoneMutation = useMutation({
    mutationFn: async ({
      milestoneId,
      payload = {},
    }: {
      milestoneId: string;
      payload?: { fundingTxHash?: string; cryptoAmount?: number; cryptoCurrency?: string };
    }) => {
      await apiClient.post(`/escrow/fund-milestone/${milestoneId}`, payload);
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

  const handleLockUsdc = async (milestone: Milestone) => {
    if (!contract) return;
    const artisanAddr = contract.artisan?.walletAddress;
    if (!artisanAddr) {
      alert(
        'The artisan has not yet configured or connected their Web3 wallet. Please ask them to link a wallet on their profile, or switch to the In-App Wallet (₦) tab to fund with Naira Escrow.'
      );
      return;
    }
    const neededUsdc = Math.max(1, Math.round(Number(milestone.amount) / 1500));
    try {
      setIsLockingUsdc(true);
      const { txHash } = await fundOnChainEscrow(contract.contractCode, artisanAddr, neededUsdc);
      await fundMilestoneMutation.mutateAsync({
        milestoneId: milestone.id,
        payload: {
          fundingTxHash: txHash,
          cryptoAmount: neededUsdc,
          cryptoCurrency: 'USDC',
        },
      });
    } catch (err: any) {
      alert(`On-chain funding failed: ${err.message}`);
    } finally {
      setIsLockingUsdc(false);
    }
  };

  // 4. Approve & Release Funds Mutation
  const approveReleaseMutation = useMutation({
    mutationFn: async ({ milestoneId, releaseTxHash }: { milestoneId: string; releaseTxHash?: string }) => {
      await apiClient.post(`/escrow/approve-release/${milestoneId}`, { releaseTxHash });
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

  const handleApproveAndRelease = async (milestoneId: string) => {
    if (contract?.onChainEscrowId) {
      try {
        setIsReleasingOnChain(true);
        const txHash = await releaseOnChainEscrow(contract.onChainEscrowId);
        await approveReleaseMutation.mutateAsync({ milestoneId, releaseTxHash: txHash });
      } catch (err: any) {
        if (confirm(`On-chain release failed or was rejected (${err.message}). Proceed with off-chain platform approval?`)) {
          await approveReleaseMutation.mutateAsync({ milestoneId });
        }
      } finally {
        setIsReleasingOnChain(false);
      }
    } else {
      await approveReleaseMutation.mutateAsync({ milestoneId });
    }
  };

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
      let onChainDisputeTxHash: string | undefined;
      if (contract?.onChainEscrowId) {
        try {
          onChainDisputeTxHash = await raiseDisputeOnChain(contract.onChainEscrowId, disputeReason);
        } catch (onChainErr: any) {
          console.warn('On-chain dispute notice failed or cancelled:', onChainErr.message);
        }
      }

      await apiClient.post('/disputes', {
        contractId,
        milestoneId: disputeMilestoneId || undefined,
        reason: disputeReason,
        explanation: disputeExplanation,
        onChainDisputeTxHash,
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
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
    <div className="space-y-8 pb-16 font-dashboard">
      {/* Back Link & Title */}
      <div className="space-y-3">
        <Link
          to="/client/contracts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Contracts Hub</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2.5 py-0.5 rounded-md">
                {contract.contractCode}
              </span>
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                contract.status === 'ACTIVE' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20' 
                  : 'bg-amber-50 text-amber-800 border-amber-500/20'
              }`}>
                {contract.status.replace('_', ' ')}
              </span>
              {contract.onChainEscrowId && (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  <Sparkles className="w-3 h-3" />
                  <span>Monad Escrow #{contract.onChainEscrowId}</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {contract.job?.title || 'Contract Workspace'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Contracted Artisan: <span className="font-bold text-slate-800">{artisanName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => syncOnChainMutation.mutate()}
              disabled={syncOnChainMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
              title="Synchronize on-chain Monad smart contract state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncOnChainMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Sync On-Chain</span>
            </button>

            {contract.status === 'COMPLETED' && !hasClientReviewed && (
              <button
                onClick={() => setReviewModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
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
        <div className="p-5 bg-white rounded-[24px] border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Contract</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {formatCurrency(contract.totalAmount)}
          </p>
        </div>

        <div className="p-5 bg-white rounded-[24px] border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Escrow Funded</span>
          <p className="text-xl font-black text-emerald-800 mt-1">
            {formatCurrency(contract.escrowFundedAmount)}
          </p>
        </div>

        <div className="p-5 bg-white rounded-[24px] border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Released to Artisan</span>
          <p className="text-xl font-black text-emerald-700 mt-1">
            {formatCurrency(contract.escrowReleasedAmount)}
          </p>
        </div>

        <div className="p-5 bg-white rounded-[24px] border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Refunded / Disputed</span>
          <p className="text-xl font-black text-slate-600 mt-1">
            {formatCurrency(contract.escrowRefundedAmount)}
          </p>
        </div>
      </div>

      {/* Verified Workshop & Navigation Card */}
      <ContractLocationCard
        artisanName={artisanName}
        address={artisanProfile?.address}
        state={artisanProfile?.state}
        lgaCity={artisanProfile?.lgaCity}
        latitude={artisanProfile?.latitude}
        longitude={artisanProfile?.longitude}
        navigationSuite={(contract as any).navigationSuite}
        isLocationRevealed={
          (contract as any).isLocationRevealed ??
          (contract.status === 'ACTIVE' || contract.status === 'COMPLETED')
        }
      />

      {/* Workspace Tabs Header */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'milestones'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Milestones ({milestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <WalletIcon className="w-3.5 h-3.5" />
          <span>Escrow Ledger ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dispute')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'dispute'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Disputes ({disputes.length})</span>
        </button>
      </div>

      {/* TAB 1: MILESTONES PROGRESSION */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="space-y-3.5">
            {milestones.map((m, index) => {
              const isFunded = m.status === 'FUNDED' || m.status === 'IN_PROGRESS';
              const isSubmitted = m.status === 'SUBMITTED';
              const isReleased = m.status === 'APPROVED' || m.status === 'RELEASED';
              const isPendingFunding = m.status === 'PENDING_FUNDING';

              return (
                <div
                  key={m.id}
                  className={`p-6 bg-white rounded-[24px] border transition-all ${
                    isSubmitted
                      ? 'border-amber-400 bg-amber-50/20 shadow-md ring-1 ring-amber-400/30'
                      : 'border-slate-200/80 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          Step {m.stepOrder || index + 1}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isReleased
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20'
                              : isSubmitted
                              ? 'bg-amber-50 text-amber-800 border-amber-500/20'
                              : isFunded
                              ? 'bg-blue-50 text-blue-800 border-blue-500/20'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {m.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {m.title}
                      </h3>

                      {m.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {m.description}
                        </p>
                      )}

                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                        {m.fundedAt && <span>Funded on: {formatDate(m.fundedAt)}</span>}
                        {m.submittedAt && <span>Work submitted: {formatDate(m.submittedAt)}</span>}
                        {m.releasedAt && <span className="text-emerald-700 font-bold">Funds released: {formatDate(m.releasedAt)}</span>}
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Milestone Amount
                        </span>
                        <p className="text-xl font-black text-slate-900">
                          {formatCurrency(m.amount)}
                        </p>
                      </div>

                      {/* ACTION BUTTONS ACCORDING TO MILESTONE STATUS */}
                      {isPendingFunding && (
                        <button
                          onClick={() => setFundingMilestone(m)}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/15 transition-all active:scale-95"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Fund Milestone</span>
                        </button>
                      )}

                      {isSubmitted && (
                        <button
                          onClick={() => setInspectingMilestone(m)}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all active:scale-95 animate-pulse"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Submitted Work</span>
                        </button>
                      )}

                      {isFunded && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                          <Clock className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Artisan is working...</span>
                        </span>
                      )}

                      {isReleased && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Completed &amp; Released</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS / ESCROW LEDGER */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Escrow Audit Ledger &amp; Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Immutable log of all deposit locks, milestone payouts, and transaction receipts.
            </p>
          </div>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">
              No financial transactions recorded for this contract yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Ref: {tx.reference} • {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="font-black text-slate-900 text-sm block">
                      {formatCurrency(tx.amount)}
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        tx.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20'
                          : 'bg-amber-50 text-amber-800 border-amber-500/20'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DISPUTES */}
      {activeTab === 'dispute' && (
        <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Dispute Center &amp; Mediation
              </h3>
              <p className="text-xs text-slate-500">
                If the artisan fails to perform or violates deliverables, you can initiate formal arbitration.
              </p>
            </div>
            {disputes.length === 0 && contract.status !== 'COMPLETED' && (
              <button
                onClick={() => setDisputeModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all self-start sm:self-auto"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Open Dispute</span>
              </button>
            )}
          </div>

          {disputes.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-[24px] bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                No active disputes on this contract.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                All milestones are running smoothly under Artifix escrow protection.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((dsp) => (
                <div
                  key={dsp.id}
                  className="p-5 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700 font-mono text-sm">
                      Dispute #{dsp.disputeCode}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                      {dsp.status}
                    </span>
                  </div>
                  <p className="text-slate-900 font-bold text-sm">
                    Reason: {dsp.reason}
                  </p>
                  <p className="text-slate-600 leading-relaxed font-normal">
                    {dsp.explanation}
                  </p>
                  <Link
                    to={`/client/disputes/${dsp.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-700 pt-2 transition-colors"
                  >
                    <span>Open Dispute Workspace &amp; Arbitration Chat &rarr;</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FUND MILESTONE MODAL (DUAL RAIL: FIAT & MONAD WEB3 USDC) */}
      {fundingMilestone && (() => {
        const neededUsdc = Math.max(1, Math.round(Number(fundingMilestone.amount) / 1500));
        const hasEnoughAllowance = Number(usdcAllowance) >= neededUsdc;
        const hasEnoughUsdc = Number(usdcBalance) >= neededUsdc;

        return (
          <Modal
            isOpen={!!fundingMilestone}
            onClose={() => setFundingMilestone(null)}
            title={`Fund Escrow: ${fundingMilestone.title}`}
          >
            <div className="space-y-4 text-xs">
              {/* Rail Selector Tabs */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setFundingRail('fiat')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    fundingRail === 'fiat'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <WalletIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>In-App Wallet (₦)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFundingRail('usdc');
                    if (!connectedWallet && hasWeb3Provider()) {
                      handleConnectWallet();
                    }
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    fundingRail === 'usdc'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  <span>Monad Web3 ($USDC)</span>
                </button>
              </div>

              {/* RAIL A: FIAT WALLET */}
              {fundingRail === 'fiat' && (
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400">
                    Lock <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(fundingMilestone.amount)}</span> into platform escrow from your in-app balance.
                  </p>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500">Your Available Balance:</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(wallet?.availableBalance || 0)}
                    </span>
                  </div>

                  {Number(wallet?.availableBalance || 0) < Number(fundingMilestone.amount) && (
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>Low balance. Please top up your wallet or use Monad Web3 tab.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" size="sm" onClick={() => setFundingMilestone(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={fundMilestoneMutation.isPending || Number(wallet?.availableBalance || 0) < Number(fundingMilestone.amount)}
                      onClick={() => fundMilestoneMutation.mutate({ milestoneId: fundingMilestone.id })}
                    >
                      {fundMilestoneMutation.isPending ? 'Funding...' : 'Confirm Escrow Lock'}
                    </Button>
                  </div>
                </div>
              )}

              {/* RAIL B: MONAD WEB3 USDC STABLECOIN */}
              {fundingRail === 'usdc' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200">
                    <div className="flex items-center justify-between font-bold pb-1">
                      <span>Monad Smart Contract Escrow</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white">Chain ID 10143</span>
                    </div>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300">
                      Payment is settled in <strong>USD Coin (USDC)</strong> locked trustlessly on Monad EVM.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Escrow Required:</span>
                      <span className="font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                        ${neededUsdc}.00 USDC
                      </span>
                    </div>

                    {connectedWallet ? (
                      <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Connected Wallet:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Your USDC Balance:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {usdcBalance} USDC
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleConnectWallet}
                          disabled={isConnectingWallet}
                          className="w-full text-xs font-bold border-purple-500/50 text-purple-600 hover:bg-purple-50"
                        >
                          {isConnectingWallet ? 'Connecting...' : 'Connect MetaMask / Browser Wallet'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Faucet Helper Button */}
                  {connectedWallet && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
                      <span className="text-slate-500">Need test funds on Monad?</span>
                      <button
                        type="button"
                        onClick={handleMintFaucet}
                        disabled={isMintingUsdc}
                        className="font-bold text-purple-600 hover:text-purple-500 underline disabled:opacity-50"
                      >
                        {isMintingUsdc ? 'Minting 100 USDC...' : '🚰 Faucet: Get 100 Test USDC'}
                      </button>
                    </div>
                  )}

                  {/* Artisan Wallet Warning */}
                  {!contract.artisan?.walletAddress && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Artisan Has Not Linked a Web3 Wallet</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
                          The artisan has not yet configured their Monad EVM address. You can ask them to link a wallet in their profile, or switch to the <strong>In-App Wallet (₦)</strong> tab to fund with Naira Escrow.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Steps */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" size="sm" onClick={() => setFundingMilestone(null)}>
                      Cancel
                    </Button>

                    {!connectedWallet ? (
                      <Button size="sm" onClick={handleConnectWallet} disabled={isConnectingWallet}>
                        Connect Wallet
                      </Button>
                    ) : !contract.artisan?.walletAddress ? (
                      <Button size="sm" disabled className="bg-slate-300 text-slate-500 cursor-not-allowed">
                        Artisan Wallet Missing
                      </Button>
                    ) : !hasEnoughAllowance ? (
                      <Button
                        size="sm"
                        disabled={isApprovingUsdc}
                        onClick={() => handleApproveUsdc(neededUsdc)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                      >
                        {isApprovingUsdc ? 'Approving in Wallet...' : `1. Approve ${neededUsdc} USDC`}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isLockingUsdc || !hasEnoughUsdc}
                        onClick={() => handleLockUsdc(fundingMilestone)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
                      >
                        {isLockingUsdc
                          ? 'Signing Escrow Lock...'
                          : !hasEnoughUsdc
                          ? 'Insufficient USDC'
                          : `2. Deposit ${neededUsdc} USDC to Escrow`}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

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
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 leading-relaxed">
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
              <div className="space-y-2 pt-2 border-t border-slate-100 ">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Revision Instructions for Artisan:
                </label>
                <textarea
                  rows={3}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Explain exactly what needs rework or adjustment..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 text-slate-900 dark:text-slate-100"
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
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 ">
                <button
                  type="button"
                  onClick={() => setShowRevisionInput(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold hover:bg-amber-100"
                >
                  Request Revision
                </button>

                <Button
                  size="sm"
                  disabled={approveReleaseMutation.isPending || isReleasingOnChain}
                  onClick={() => handleApproveAndRelease(inspectingMilestone.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {approveReleaseMutation.isPending || isReleasingOnChain
                    ? 'Releasing...'
                    : contract?.onChainEscrowId
                    ? '⚡ Approve & Release On-Chain'
                    : 'Approve & Release Funds'}
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
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
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
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
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
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 ">
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
                  className="w-full p-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-900 dark:text-slate-100"
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
                  className="w-full p-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-900 dark:text-slate-100"
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
                  className="w-full p-1.5 rounded-lg border text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-900 dark:text-slate-100"
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
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 ">
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
              className="w-full h-auto max-h-[85vh] object-contain rounded-[24px]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
