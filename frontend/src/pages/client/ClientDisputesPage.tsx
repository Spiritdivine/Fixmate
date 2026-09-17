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
    <div className="space-y-8 pb-16 font-dashboard">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <AlertTriangle className="w-7 h-7 text-rose-600" />
          <span>Dispute Center &amp; Arbitration</span>
        </h1>
        <p className="text-sm text-slate-500">
          Submit evidence, message arbitrators, and resolve escrow disagreements fairly.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit">
        {[
          { label: 'All Disputes', value: 'ALL' },
          { label: 'Active & Under Review', value: 'OPEN' },
          { label: 'Resolved / Closed', value: 'RESOLVED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value as any)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedStatus === tab.value
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
            <div key={n} className="p-6 bg-white rounded-[24px] border border-slate-200/80 animate-pulse h-36 shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-200 rounded-[24px] bg-white">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 text-emerald-700">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            No disputes found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedStatus === 'ALL'
              ? 'You have no open or resolved disputes. Escrow transactions are running smoothly.'
              : `No disputes found under status "${selectedStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="p-6 bg-white rounded-[24px] border border-slate-200/80 hover:border-rose-400 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                    Dispute #{d.disputeCode}
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      d.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500/20'
                        : 'bg-rose-50 text-rose-800 border-rose-500/20'
                    }`}
                  >
                    {d.status.replace('_', ' ')}
                  </span>
                  {d.contractInfo && (
                    <span className="text-xs text-slate-400 font-mono font-medium">
                      Contract: {d.contractInfo.contractCode}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {d.reason}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {d.explanation}
                </p>

                <p className="text-[11px] text-slate-400 font-medium">
                  Filed on {formatDate(d.createdAt)}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right bg-rose-50/50 px-4 py-2 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Disputed Value
                  </span>
                  <p className="text-base font-black text-rose-700">
                    {formatCurrency(d.disputedAmount)}
                  </p>
                </div>

                <Link
                  to={`/client/disputes/${d.id}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Workspace</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
