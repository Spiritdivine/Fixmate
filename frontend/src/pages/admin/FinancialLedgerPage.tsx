import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, Transaction, PaginationMeta, TransactionType } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const FinancialLedgerPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 20 };
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get<ApiResponse<{ transactions: any[]; meta: PaginationMeta }>>(
        '/admin/transactions',
        { params }
      );

      if (res.data.success) {
        setTransactions(res.data.data.transactions);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [typeFilter, statusFilter]);

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Reference', 'Date', 'Type', 'Amount', 'Fee', 'Net Amount', 'Status', 'User', 'Description'];
    const rows = transactions.map((t) => [
      t.reference,
      new Date(t.createdAt).toISOString(),
      t.type,
      t.amount,
      t.fee,
      t.netAmount,
      t.status,
      t.wallet?.user?.email || 'N/A',
      `"${t.description?.replace(/"/g, '""') || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fixmate_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-purple-400" />
            <span>Platform Financial Ledger</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable audit record of deposits, escrow locks, release settlements, platform commission, and payouts.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={exportToCSV}
          className="font-bold text-xs"
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export CSV Ledger
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'ALL', label: 'All Transactions' },
            { key: 'ESCROW_LOCK', label: 'Escrow Locks' },
            { key: 'ESCROW_RELEASE', label: 'Escrow Releases' },
            { key: 'ESCROW_REFUND', label: 'Escrow Refunds' },
            { key: 'WALLET_DEPOSIT', label: 'Wallet Deposits' },
            { key: 'PAYOUT_WITHDRAWAL', label: 'Payout Withdrawals' },
            { key: 'PLATFORM_FEE', label: 'Platform Fees' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                typeFilter === tab.key
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, gateway ID, description, or user email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTransactions(1)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Transaction Status Filter"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REVERSED">Reversed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Reference & Timestamp</th>
                <th className="py-3.5 px-4">Transaction Type</th>
                <th className="py-3.5 px-4">User Account</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Balance Delta</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Querying financial ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No transactions matching specified filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white font-mono text-[11px]">{tx.reference}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatDate(tx.createdAt)}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950 border border-slate-800 text-purple-300 font-mono">
                        {tx.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-200">{tx.wallet?.user?.email || 'N/A'}</p>
                      <span className="text-[10px] text-slate-400">{tx.wallet?.user?.role}</span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      {formatCurrency(tx.amount)}
                      {Number(tx.fee) > 0 && (
                        <span className="block text-[10px] text-purple-400 font-normal">
                          Fee: {formatCurrency(tx.fee)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] font-mono text-slate-400">
                      <span>{formatCurrency(tx.balanceBefore)}</span> →{' '}
                      <strong className="text-slate-200">{formatCurrency(tx.balanceAfter)}</strong>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={tx.status === 'SUCCESS' ? 'success' : tx.status === 'FAILED' ? 'danger' : 'warning'} size="sm">
                        {tx.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-400 text-[11px]">
                      {tx.description}
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
            <strong className="text-white">{meta.totalPages || 1}</strong> ({meta.total} entries)
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchTransactions(meta.page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchTransactions(meta.page + 1)}
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
