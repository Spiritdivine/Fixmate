import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, Contract, PaginationMeta, ContractStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const ContractsOversightPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 15 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get<ApiResponse<{ contracts: Contract[]; meta: PaginationMeta }>>('/admin/contracts', {
        params,
      });

      if (res.data.success) {
        setContracts(res.data.data.contracts);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts(1);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-purple-400" />
            <span>Contracts & Escrow Oversight</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor active work agreements, milestone release progression, and Monad smart contract escrows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Total Contracts: {meta.total}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'ALL', label: 'All Contracts' },
            { key: 'ACTIVE', label: 'In Progress (Active)' },
            { key: 'PENDING_FUNDING', label: 'Pending Funding' },
            { key: 'COMPLETED', label: 'Completed & Released' },
            { key: 'DISPUTED', label: 'Disputed' },
            { key: 'REFUNDED', label: 'Refunded / Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                statusFilter === tab.key
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search contract code, job title, client email, or artisan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchContracts(1)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
          />
        </div>
      </div>

      {/* Contracts Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Contract Code</th>
                <th className="py-3.5 px-4">Job Title</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Artisan</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading contracts...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No contracts matching current filter.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white font-mono">#{c.contractCode}</span>
                      {c.onChainEscrowId && (
                        <p className="text-[10px] text-purple-400 font-mono flex items-center gap-1 mt-0.5">
                          <Layers className="w-3 h-3" />
                          <span>Monad #{c.onChainEscrowId}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <p className="font-bold text-slate-200 truncate">{c.job?.title || 'Contract'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatDate(c.createdAt)}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{c.client?.email}</p>
                      <p className="text-[11px] text-slate-400">
                        {c.client?.clientProfile?.firstName} {c.client?.clientProfile?.lastName}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-purple-300">
                        {c.artisan?.artisanProfile?.businessName || c.artisan?.email}
                      </p>
                      <p className="text-[11px] text-slate-400">{c.artisan?.email}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white text-sm">{formatCurrency(c.totalAmount)}</p>
                      <p className="text-[10px] text-emerald-400">
                        {formatCurrency(c.escrowFundedAmount)} funded
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          c.status === 'ACTIVE'
                            ? 'success'
                            : c.status === 'COMPLETED'
                            ? 'success'
                            : c.status === 'DISPUTED'
                            ? 'danger'
                            : 'default'
                        }
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/admin/contracts/${c.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-bold text-xs"
                          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="py-3.5 px-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{meta.page}</strong> of{' '}
            <strong className="text-white">{meta.totalPages || 1}</strong> ({meta.total} contracts)
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchContracts(meta.page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchContracts(meta.page + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
