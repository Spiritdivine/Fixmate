import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Scale,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, Dispute, PaginationMeta, DisputeStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const DisputeCenterPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 15 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get<ApiResponse<{ disputes: Dispute[]; meta: PaginationMeta }>>('/admin/disputes', {
        params,
      });

      if (res.data.success) {
        setDisputes(res.data.data.disputes);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes(1);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-rose-500" />
            <span>Escrow Dispute Arbitration Center</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Tribunal court for resolving milestone conflicts, evaluating photographic evidence, and releasing escrow settlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="danger" size="md">
            Active Disputes: {meta.total}
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
            { key: 'OPEN', label: 'Open Cases' },
            { key: 'UNDER_REVIEW', label: 'Under Review' },
            { key: 'AWAITING_EVIDENCE', label: 'Awaiting Evidence' },
            { key: 'RESOLVED', label: 'Resolved Settlements' },
            { key: 'ALL', label: 'All Disputes' },
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
            placeholder="Search dispute code (e.g. DSP-2026-...), reason, or contract code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDisputes(1)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
          />
        </div>
      </div>

      {/* Disputes Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Dispute Reference</th>
                <th className="py-3.5 px-4">Contract Code</th>
                <th className="py-3.5 px-4">Disputed Amount</th>
                <th className="py-3.5 px-4">Initiated By</th>
                <th className="py-3.5 px-4">Reason / Issue</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Arbitration Court</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching arbitration cases...
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No dispute cases in this queue.
                  </td>
                </tr>
              ) : (
                disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white font-mono">{d.disputeCode}</span>
                      <p className="text-[10px] text-slate-400 font-mono">{formatDate(d.createdAt)}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-purple-400 font-mono">#{d.contract?.contractCode}</span>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{d.contract?.job?.title || 'Contract'}</p>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-rose-400 text-sm">
                      {formatCurrency(d.disputedAmount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-200">{d.initiatedByUser?.email}</p>
                      <span className="text-[10px] text-purple-400">{d.initiatedByUser?.role}</span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">
                      {d.reason}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          d.status === 'OPEN'
                            ? 'danger'
                            : d.status === 'RESOLVED'
                            ? 'success'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {d.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/admin/disputes/${d.id}`}>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Enter Court
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3.5 px-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{meta.page}</strong> of{' '}
            <strong className="text-white">{meta.totalPages || 1}</strong> ({meta.total} disputes)
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchDisputes(meta.page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchDisputes(meta.page + 1)}
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
