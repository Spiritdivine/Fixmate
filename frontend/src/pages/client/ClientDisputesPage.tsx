import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  Search,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Dispute, Contract, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const ClientDisputesPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  // Fetch Contracts to aggregate disputes
  const { data: contractsData = [], isLoading } = useQuery<Contract[]>({
    queryKey: ['client-contracts-disputes'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Contract[] | { contracts: Contract[] }>>('/contracts');
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.contracts) || [];
    },
  });

  const allDisputes: (Dispute & { contractInfo?: Contract })[] = [];
  (contractsData || []).forEach((c) => {
    c.disputes?.forEach((d) => {
      allDisputes.push({ ...d, contractInfo: c });
    });
  });

  const filtered = allDisputes.filter((d) => {
    if (selectedStatus === 'OPEN') return d.status === 'OPEN' || d.status === 'UNDER_REVIEW' || d.status === 'AWAITING_EVIDENCE';
    if (selectedStatus === 'RESOLVED') return d.status === 'RESOLVED' || d.status === 'CLOSED';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <span>Dispute Center &amp; Arbitration</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Submit evidence, message arbitrators, and resolve escrow disagreements fairly.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {[
          { label: 'All Disputes', value: 'ALL' },
          { label: 'Active & Under Review', value: 'OPEN' },
          { label: 'Resolved / Closed', value: 'RESOLVED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedStatus === tab.value
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <Card key={n} className="p-6 border-slate-200 dark:border-slate-800 animate-pulse h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No disputes found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedStatus === 'ALL'
              ? 'You have no open or resolved disputes. Escrow transactions are running smoothly.'
              : `No disputes found under status "${selectedStatus}".`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => (
            <Card
              key={d.id}
              className="p-5 sm:p-6 border-slate-200 dark:border-slate-800 hover:border-rose-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-rose-600">
                    Dispute #{d.disputeCode}
                  </span>
                  <Badge variant={d.status === 'RESOLVED' ? 'emerald' : 'rose'}>
                    {d.status.replace('_', ' ')}
                  </Badge>
                  {d.contractInfo && (
                    <span className="text-xs text-slate-400 font-mono">
                      Contract: {d.contractInfo.contractCode}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {d.reason}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {d.explanation}
                </p>

                <p className="text-[11px] text-slate-400">
                  Filed on {formatDate(d.createdAt)}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Disputed Value
                  </span>
                  <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {formatCurrency(d.disputedAmount)}
                  </p>
                </div>

                <Link
                  to={`/client/disputes/${d.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-rose-600 dark:hover:bg-rose-600 text-white dark:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Investigation Workspace</span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
