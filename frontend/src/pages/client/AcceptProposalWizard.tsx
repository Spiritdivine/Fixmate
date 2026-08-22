import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wallet as WalletIcon,
  CreditCard,
  Layers,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { Proposal, Wallet, ApiResponse, Contract } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const AcceptProposalWizard: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [fundingSource, setFundingSource] = useState<'WALLET' | 'PAYSTACK' | 'MONAD_WEB3'>('WALLET');

  // 1. Fetch Proposal
  const { data: proposal, isLoading: loadingProposal } = useQuery<Proposal>({
    queryKey: ['accept-proposal-detail', proposalId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Proposal | { proposal: Proposal }>>(
        `/proposals/${proposalId}`
      );
      return (data.data as any)?.id ? (data.data as Proposal) : (data.data as any)?.proposal;
    },
    enabled: !!proposalId,
  });

  // 2. Fetch Wallet
  const { data: wallet } = useQuery<Wallet>({
    queryKey: ['client-wallet'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Wallet | { wallet: Wallet }>>('/wallets/my-wallet');
      return (data.data as any)?.availableBalance !== undefined ? (data.data as Wallet) : (data.data as any)?.wallet;
    },
  });

  // 3. Accept Proposal Mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<Contract | { contract: Contract }>>(
        `/contracts/accept-proposal/${proposalId}`,
        {}
      );
      const createdContract = (data.data as any).id ? (data.data as Contract) : (data.data as any).contract;
      return createdContract;
    },
    onSuccess: (contract) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        if (contract?.id) {
          navigate(`/client/contracts/${contract.id}`);
        } else {
          navigate('/client/contracts');
        }
      }, 1500);
    },
    onError: (err) => {
      setErrorMessage(getErrorMessage(err));
    },
  });

  if (loadingProposal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Proposal Not Found</h2>
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

  const bidAmount = Number(proposal.bidAmount || 0);
  const platformFee = Math.round(bidAmount * 0.05);
  const totalFunding = bidAmount; // Artisan receives bidAmount minus fee or fee added
  const availableBalance = Number(wallet?.availableBalance || 0);
  const artisanName =
    proposal.artisan?.artisanProfile?.businessName || proposal.artisan?.email?.split('@')[0] || 'Artisan';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Back Link */}
      <div>
        <Link
          to={`/client/proposals/${proposalId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Proposal</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Establish Escrow Contract
        </h1>
        <p className="text-xs text-slate-500">
          You are hiring <span className="font-bold text-slate-700 dark:text-slate-300">{artisanName}</span> for &quot;{proposal.job?.title}&quot;.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Escrow Terms & Breakdown Card */}
      <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-6">
        {/* Milestone summary */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Milestone Schedule Breakdown
          </h2>
          <div className="space-y-2">
            {proposal.milestones && proposal.milestones.length > 0 ? (
              proposal.milestones.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Step {idx + 1}: {m.title}
                  </span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {formatCurrency(m.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Full Project Completion
                </span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {formatCurrency(bidAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Contract Total (Artisan Bid):</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(bidAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Platform Escrow Protection Fee (5%):</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(platformFee)}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-900 dark:text-slate-100">Total Contract Value:</span>
            <span className="font-extrabold text-sky-600 dark:text-sky-400 text-base">
              {formatCurrency(totalFunding)}
            </span>
          </div>
        </div>

        {/* Initial Escrow Funding Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Select Escrow Funding Preference
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFundingSource('WALLET')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                fundingSource === 'WALLET'
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 ring-1 ring-sky-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-sky-600 dark:text-sky-400 font-bold text-xs">
                <WalletIcon className="w-4 h-4" />
                <span>Fixmate Wallet</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Balance: {formatCurrency(availableBalance)}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFundingSource('MONAD_WEB3')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                fundingSource === 'MONAD_WEB3'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 ring-1 ring-purple-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-purple-600 dark:text-purple-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Monad Web3 Escrow</span>
              </div>
              <p className="text-[11px] text-slate-500">
                On-chain smart contract on Monad
              </p>
            </button>
          </div>
        </div>

        {/* Security Guarantee */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">100% Escrow Protection Guaranteed</p>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              Funds are safely held in escrow and will only be released when you inspect submitted photos and approve each milestone.
            </p>
          </div>
        </div>

        {/* Final Acceptance Action */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/client/proposals/${proposalId}`)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="md"
            disabled={acceptMutation.isPending}
            onClick={() => acceptMutation.mutate()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shadow-lg shadow-emerald-600/20"
          >
            {acceptMutation.isPending ? 'Creating Contract...' : 'Confirm & Create Contract'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
