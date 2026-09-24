import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Search,
  
  Eye,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Contract, ApiResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

export const ClientContractsPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Contracts
  const { data: contractsData = [], isLoading } = useQuery<Contract[]>({
    queryKey: ['client-contracts-list', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === 'ALL' ? '/contracts' : `/contracts?status=${selectedStatus}`;
      const { data } = await apiClient.get<ApiResponse<Contract[] | { contracts: Contract[] }>>(url);
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.contracts) || [];
    },
  });

  const contracts = (contractsData || []).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.contractCode.toLowerCase().includes(q) ||
      c.job?.title?.toLowerCase().includes(q) ||
      c.artisan?.artisanProfile?.businessName?.toLowerCase().includes(q) ||
      c.artisan?.email?.toLowerCase().includes(q)
    );
  });

  const statusFilters = [
    { label: 'All Contracts', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending Funding', value: 'PENDING_FUNDING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Disputed', value: 'DISPUTED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-dashboard">
            Contracts & Escrow Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fund milestone escrows, inspect submitted work proofs, approve payouts, and leave feedback.
          </p>
        </div>
        <Link to="/client/jobs/post">
          <button className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm cursor-pointer">
            
            <span>Post a New Job</span>
          </button>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {statusFilters.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === tab.value
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 bg-white hover:bg-slate-50 shadow-xs border border-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contracts by code, job title, or artisan name..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white text-sm font-medium border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none shadow-xs text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Contracts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 bg-white rounded-[24px] border border-slate-100 animate-pulse h-40 shadow-xs" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[24px] border border-dashed border-slate-200 shadow-xs">
          <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            No contracts found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedStatus === 'ALL'
              ? 'When you accept an artisan’s proposal, an escrow contract will be generated here.'
              : `No contracts matching "${selectedStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const artisan = contract.artisan;
            const artisanProfile = artisan?.artisanProfile;
            const artisanName =
              artisanProfile?.businessName || artisan?.email?.split('@')[0] || 'Artisan';

            const completedMilestones =
              contract.milestones?.filter((m) => m.status === 'RELEASED' || m.status === 'APPROVED').length || 0;
            const totalMilestones = contract.milestones?.length || 1;
            const progressPct = Math.round((completedMilestones / totalMilestones) * 100);

            const hasSubmittedWork = contract.milestones?.some((m) => m.status === 'SUBMITTED');

            const statusVariant =
              contract.status === 'ACTIVE'
                ? 'emerald'
                : contract.status === 'PENDING_FUNDING'
                ? 'amber'
                : contract.status === 'COMPLETED'
                ? 'emerald'
                : contract.status === 'DISPUTED'
                ? 'rose'
                : 'muted';

            return (
              <div
                key={contract.id}
                className="p-6 rounded-[24px] bg-white border border-slate-100 hover:border-emerald-500/30 transition-all shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant as any}>
                        {contract.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">
                        {contract.contractCode}
                      </span>
                      {hasSubmittedWork && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          Work Submitted for Review
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/client/contracts/${contract.id}`}
                      className="text-base font-bold text-slate-900 hover:text-emerald-800 transition-colors block truncate"
                    >
                      {contract.job?.title || 'Contract Agreement'}
                    </Link>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={artisan?.avatarUrl}
                          name={artisanName}
                          size="xs"
                        />
                        <span className="font-semibold text-slate-700">
                          {artisanName}
                        </span>
                      </div>
                      <span>•</span>
                      <span>Created {formatDate(contract.createdAt)}</span>
                    </div>
                  </div>

                  {/* Financial Details & Workspace CTA */}
                  <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Total Amount
                      </span>
                      <p className="text-lg font-black text-slate-900">
                        {formatCurrency(contract.totalAmount)}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold">
                        Funded: {formatCurrency(contract.escrowFundedAmount)}
                      </p>
                    </div>

                    <Link
                      to={`/client/contracts/${contract.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open Workspace</span>
                    </Link>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Milestones: {completedMilestones} of {totalMilestones} Completed</span>
                    <span className="font-bold text-emerald-700">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
