import React, { useEffect, useState } from 'react';
import {
  Layers,
  Search,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Zap,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, Contract } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const MonadEscrowExplorerPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual Sync Form State
  const [syncContractId, setSyncContractId] = useState('');
  const [syncTxHash, setSyncTxHash] = useState('');
  const [syncAction, setSyncAction] = useState('DEPOSIT');
  const [syncMilestoneId, setSyncMilestoneId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  const fetchOnChainContracts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<ApiResponse<{ contracts: Contract[] }>>('/admin/contracts', {
        params: { limit: 50 },
      });
      if (res.data.success) {
        setContracts(res.data.data.contracts.filter((c) => c.onChainEscrowId || c.fundingTxHash));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnChainContracts();
  }, []);

  const handleManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncContractId.trim() || !syncTxHash.trim()) return;

    try {
      setIsSyncing(true);
      setError(null);
      setSyncSuccessMessage(null);

      const res = await apiClient.post<ApiResponse<any>>(`/escrow/sync-onchain/${syncContractId.trim()}`, {
        txHash: syncTxHash.trim(),
        action: syncAction,
        milestoneId: syncMilestoneId.trim() || undefined,
      });

      if (res.data.success) {
        setSyncSuccessMessage('On-chain event successfully verified and synchronized with database state.');
        setSyncTxHash('');
        fetchOnChainContracts();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            <span>Monad Web3 Smart Contract Explorer</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time verification of EVM smart contract state on Monad Testnet (Chain ID 10143).
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchOnChainContracts}
          className="font-bold text-xs"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh State
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {syncSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncSuccessMessage}</span>
        </div>
      )}

      {/* Network & Contract Telemetry Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Target EVM Chain</span>
          <p className="text-lg font-black text-white">Monad Testnet</p>
          <span className="text-[11px] font-mono text-purple-400">Chain ID: 10143</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Smart Contract</span>
          <p className="text-lg font-black text-white font-mono">ArtisanEscrow.sol</p>
          <span className="text-[11px] text-slate-400 truncate block">Multi-Milestone Escrow</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">On-Chain Contracts</span>
          <p className="text-lg font-black text-purple-400">{contracts.length}</p>
          <span className="text-[11px] text-slate-400">Synced in database</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">RPC Protocol</span>
          <p className="text-lg font-black text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Connected</span>
          </p>
          <span className="text-[11px] text-slate-400">Live RPC Listener Active</span>
        </div>
      </div>

      {/* Manual Sync Tool & Verified On-Chain Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Manual Reconciliation Tool */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Manual On-Chain Reconciliation</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify an on-chain transaction hash directly against the RPC and reconcile local database state.
            </p>
          </div>

          <form onSubmit={handleManualSync} className="space-y-3 text-xs">
            <Input
              label="Contract ID (UUID)"
              placeholder="e.g. 550e8400-e29b-41d4-a716-..."
              value={syncContractId}
              onChange={(e) => setSyncContractId(e.target.value)}
              required
            />

            <div>
              <label className="block font-bold text-slate-300 mb-1">On-Chain Action</label>
              <select
                value={syncAction}
                onChange={(e) => setSyncAction(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
              >
                <option value="DEPOSIT">DEPOSIT (Fund Escrow on Monad)</option>
                <option value="RELEASE">RELEASE (Approve & Release Milestone)</option>
                <option value="REFUND">REFUND (Voluntary Milestone Refund)</option>
              </select>
            </div>

            <Input
              label="Transaction Hash (0x...)"
              placeholder="0x..."
              value={syncTxHash}
              onChange={(e) => setSyncTxHash(e.target.value)}
              required
            />

            <Input
              label="Milestone ID (Optional)"
              placeholder="UUID of milestone"
              value={syncMilestoneId}
              onChange={(e) => setSyncMilestoneId(e.target.value)}
            />

            <Button
              type="submit"
              size="sm"
              isLoading={isSyncing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              Verify & Synchronize
            </Button>
          </form>
        </div>

        {/* Right 2 Cols: On-Chain Escrows List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Monad On-Chain Escrow Records</span>
          </h3>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading on-chain records...
            </div>
          ) : contracts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
              No on-chain Monad escrow contracts found.
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">#{c.contractCode}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-400 font-mono">
                        Escrow #{c.onChainEscrowId || 'Syncing'}
                      </span>
                    </div>
                    <Badge variant={c.status === 'ACTIVE' || c.status === 'COMPLETED' ? 'success' : 'default'} size="sm">
                      {c.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-400">
                    <div>
                      <span>Total Amount: </span>
                      <strong className="text-white">{formatCurrency(c.totalAmount)}</strong>
                    </div>
                    <div>
                      <span>Crypto: </span>
                      <strong className="text-purple-300">{c.cryptoAmount || '0'} {c.cryptoCurrency}</strong>
                    </div>
                  </div>

                  {c.fundingTxHash && (
                    <div className="pt-2 border-t border-slate-800/80 font-mono text-[10px] truncate text-slate-400">
                      <span>Funding Hash: </span>
                      <span className="text-purple-300">{c.fundingTxHash}</span>
                    </div>
                  )}

                  {c.releaseTxHash && (
                    <div className="font-mono text-[10px] truncate text-slate-400">
                      <span>Release Hash: </span>
                      <span className="text-emerald-400">{c.releaseTxHash}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
