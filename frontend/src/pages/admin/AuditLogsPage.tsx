import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  User,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Code,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatDate } from '../../lib/formatters';
import { ApiResponse, AuditLog, PaginationMeta } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 25 };
      if (actionFilter.trim()) params.action = actionFilter.trim();
      if (entityFilter.trim()) params.entityType = entityFilter.trim();

      const res = await apiClient.get<ApiResponse<{ logs: AuditLog[]; meta: PaginationMeta }>>(
        '/admin/audit-logs',
        { params }
      );

      if (res.data.success) {
        setLogs(res.data.data.logs);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            <span>Immutable System Audit Trail</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Cryptographically logged administrator actions, user status changes, KYC reviews, and settlement arbitration records.
          </p>
        </div>
        <Badge variant="purple" size="md">
          Total Logged Actions: {meta.total}
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter action code (e.g. USER_STATUS, KYC, DISPUTE, SETTING)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          aria-label="Entity Type Filter"
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
        >
          <option value="">All Entity Types</option>
          <option value="User">User</option>
          <option value="KycVerification">KycVerification</option>
          <option value="Dispute">Dispute</option>
          <option value="PayoutRequest">PayoutRequest</option>
          <option value="SystemSetting">SystemSetting</option>
          <option value="Review">Review</option>
        </select>

        <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
          Search Logs
        </Button>
      </form>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Admin Actor</th>
                <th className="py-3.5 px-4">Action Code</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">State Transition (Diff)</th>
                <th className="py-3.5 px-4">Client IP / Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records matching specified filters.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {formatDate(l.createdAt)}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{l.actor?.email || 'System / Automated'}</p>
                      <span className="text-[10px] text-purple-400">{l.actor?.role || 'SYSTEM'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950 border border-slate-800 text-purple-300 font-mono">
                        {l.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      <strong className="text-white">{l.entityType}</strong>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs">{l.entityId}</p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono space-y-1 overflow-x-auto max-h-24 scrollbar-thin scrollbar-thumb-slate-800">
                        {l.oldState && (
                          <div className="text-rose-400">
                            <strong>- Old: </strong>
                            {JSON.stringify(l.oldState)}
                          </div>
                        )}
                        {l.newState && (
                          <div className="text-emerald-400">
                            <strong>+ New: </strong>
                            {JSON.stringify(l.newState)}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[10px] text-slate-500 font-mono">
                      <p>{l.ipAddress || '127.0.0.1'}</p>
                      <p className="truncate max-w-[120px]">{l.userAgent || 'API Gateway'}</p>
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
            <strong className="text-white">{meta.totalPages || 1}</strong> ({meta.total} audit logs)
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchAuditLogs(meta.page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchAuditLogs(meta.page + 1)}
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
