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
import { trackEvent } from '../../lib/posthog';

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
      trackEvent('contract_created', {
        contract_id: contract?.id,
        proposal_id: proposalId,
        funding_source: fundingSource,
        contract_value: totalFunding,
        milestone_count: proposal?.milestones?.length || 0,
      });
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
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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
  const totalFunding = bidAmount;
  const availableBalance = Number(wallet?.availableBalance || 0);
  const artisanName =
    proposal.artisan?.artisanProfile?.businessName || proposal.artisan?.email?.split('@')[0] || 'Artisan';

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16 font-dashboard">
      {/* Back Link */}
      <div className="space-y-3">
        <Link
          to={`/client/proposals/${proposalId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Proposal</span>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Establish Escrow Contract
          </h1>
          <p className="text-sm text-slate-500">
            Hiring <span className="font-bold text-slate-800">{artisanName}</span> for &quot;{proposal.job?.title}&quot;.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Escrow Terms & Breakdown Card */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Milestone summary */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Milestone Schedule Breakdown
          </h2>
          <div className="space-y-2">
            {proposal.milestones && proposal.milestones.length > 0 ? (
              proposal.milestones.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800">
                    Step {idx + 1}: {m.title}
                  </span>
                  <span className="font-bold text-emerald-800">
                    {formatCurrency(m.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  Full Project Completion
                </span>
                <span className="font-bold text-emerald-800">
                  {formatCurrency(bidAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Contract Total (Artisan Bid):</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(bidAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Platform Escrow Protection Fee (5%):</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(platformFee)}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-900">Total Contract Value:</span>
            <span className="font-extrabold text-emerald-800 text-base">
              {formatCurrency(totalFunding)}
            </span>
          </div>
        </div>

        {/* Initial Escrow Funding Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Escrow Funding Preference
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setFundingSource('WALLET')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                fundingSource === 'WALLET'
                  ? 'border-emerald-700 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-700/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-emerald-800 font-bold text-xs">
                <WalletIcon className="w-4 h-4" />
                <span>Artifix Wallet</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Available: {formatCurrency(availableBalance)}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFundingSource('MONAD_WEB3')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                fundingSource === 'MONAD_WEB3'
                  ? 'border-purple-600 bg-purple-50/50 text-purple-950 ring-2 ring-purple-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-purple-700 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Monad Web3 Escrow</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                On-chain smart contract on Monad
              </p>
            </button>
          </div>
        </div>

        {/* Security Guarantee */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-500/20 text-emerald-900 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">100% Escrow Protection Guaranteed</p>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Funds are safely locked in escrow and will only be released when you inspect submitted photos and approve each milestone.
            </p>
          </div>
        </div>

        {/* Final Acceptance Action */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/client/proposals/${proposalId}`)}
            className="px-6 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={acceptMutation.isPending}
            onClick={() => acceptMutation.mutate()}
            className="px-7 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-900/10 transition-all disabled:opacity-50"
          >
            {acceptMutation.isPending ? 'Creating Contract...' : 'Confirm & Create Contract'}
          </button>
        </div>
      </div>
    </div>
  );
};
