import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, Contract } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const ContractDetailPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [contract, setContract] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContract = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<ApiResponse<any>>(`/admin/contracts/${contractId}`);
      if (res.data.success) {
        setContract(res.data.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contractId) fetchContract();
  }, [contractId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-purple-400">Loading Contract & Escrow Facts...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <p className="text-slate-400 text-sm">Contract record not found.</p>
        <Link to="/admin/contracts">
          <Button size="sm" variant="outline">
            ← Return to Contracts Oversight
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/contracts"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contracts Oversight</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Hero Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white font-mono">#{contract.contractCode}</h2>
            <Badge variant={contract.status === 'ACTIVE' || contract.status === 'COMPLETED' ? 'success' : 'warning'}>
              {contract.status}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-slate-300 mt-1">{contract.job?.title || 'Contract'}</p>
          <p className="text-xs text-slate-400 mt-0.5">Established on {formatDate(contract.createdAt)}</p>
        </div>

        {/* Financial Badges */}
        <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Contract</span>
            <p className="text-base font-black text-white">{formatCurrency(contract.totalAmount)}</p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Escrow Funded</span>
            <p className="text-base font-black text-emerald-400">{formatCurrency(contract.escrowFundedAmount)}</p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Platform Fee</span>
            <p className="text-base font-black text-purple-400">{formatCurrency(contract.platformFeeAmount)}</p>
          </div>
        </div>
      </div>

      {/* Grid: Parties & Monad Web3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parties Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Contract Counterparties</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-400">Client</span>
              <p className="font-bold text-white">{contract.client?.email}</p>
              <p className="text-slate-400">
                {contract.client?.clientProfile?.firstName} {contract.client?.clientProfile?.lastName}
              </p>
              <p className="text-slate-500 font-mono text-[10px]">{contract.client?.phoneNumber}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-400">Artisan</span>
              <p className="font-bold text-white">{contract.artisan?.email}</p>
              <p className="text-slate-400">
                {contract.artisan?.artisanProfile?.businessName || 'Independent Artisan'}
              </p>
              <p className="text-slate-500 font-mono text-[10px]">{contract.artisan?.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Monad Web3 Blockchain Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Monad Blockchain Escrow State</span>
            </h3>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-400 font-mono">
              Chain 10143
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">On-Chain Escrow ID:</span>
              <span className="font-mono text-purple-300 font-bold">
                {contract.onChainEscrowId ? `#${contract.onChainEscrowId}` : 'Off-Chain In-App'}
              </span>
            </div>

            {contract.fundingTxHash && (
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[10px]">Funding Tx Hash:</span>
                <p className="font-mono text-slate-200 truncate">{contract.fundingTxHash}</p>
              </div>
            )}

            {contract.releaseTxHash && (
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-slate-400 text-[10px]">Release Tx Hash:</span>
                <p className="font-mono text-emerald-400 truncate">{contract.releaseTxHash}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Milestone Schedule */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Milestone Deliverable Progress</h3>
        <div className="space-y-3">
          {contract.milestones?.map((m: any) => (
            <div
              key={m.id}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-[10px]">
                    {m.stepOrder}
                  </span>
                  <p className="font-bold text-white">{m.title}</p>
                  <Badge variant={m.status === 'RELEASED' || m.status === 'APPROVED' ? 'success' : 'default'} size="sm">
                    {m.status}
                  </Badge>
                </div>
                {m.submissionNotes && (
                  <p className="text-slate-400 mt-1.5 pl-7 text-[11px]">{m.submissionNotes}</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-white text-sm">{formatCurrency(m.amount)}</p>
                {m.dueDate && (
                  <p className="text-[10px] text-slate-400 font-mono">Due: {formatDate(m.dueDate)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Transactions Log */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Receipt className="w-4 h-4 text-purple-400" />
          <span>Linked Financial Transactions</span>
        </h3>
        {(!contract.transactions || contract.transactions.length === 0) ? (
          <p className="text-xs text-slate-500 py-4 text-center">No transactions recorded for this contract.</p>
        ) : (
          <div className="space-y-2">
            {contract.transactions.map((tx: any) => (
              <div key={tx.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{tx.description}</p>
                  <p className="text-slate-400 font-mono text-[10px]">Ref: {tx.reference} • {formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-400">{formatCurrency(tx.amount)}</p>
                  <Badge variant={tx.status === 'SUCCESS' ? 'success' : 'default'} size="sm">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
