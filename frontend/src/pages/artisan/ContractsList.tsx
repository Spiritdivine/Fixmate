import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../lib/api-client';
import { formatNgn, formatDate, shortenAddress } from '../../lib/formatters';
import { Contract } from '../../types';

export const ContractsList: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/contracts');
      setContracts(data.data || []);
    } catch (err) {
      console.error('Failed to fetch contracts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const filteredContracts = contracts.filter((c) => {
    if (activeTab === 'ALL') return true;
    return c.status === activeTab;
  });

  const tabs = [
    { label: `All (${contracts.length})`, value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending Funding', value: 'PENDING_FUNDING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Disputed', value: 'DISPUTED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Contracts & Escrow Agreements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Work agreements backed by Monad Blockchain smart contracts & in-app atomic escrow locks.
          </p>
        </div>
        <Link to="/artisan/jobs">
          <Button size="sm">Find More Work</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.value
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="w-8 h-8" />}
          title={`No ${activeTab.toLowerCase()} contracts`}
          description="Active and completed work agreements will show up here."
        />
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const fundedPercent =
              Number(contract.totalAmount) > 0
                ? Math.min(
                    100,
                    Math.round(
                      (Number(contract.escrowReleasedAmount) / Number(contract.totalAmount)) * 100
                    )
                  )
                : 0;

            return (
              <Card key={contract.id} hoverable className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge status={contract.status}>{contract.status}</Badge>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        #{contract.contractCode}
                      </span>
                      {contract.onChainEscrowId && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Monad Web3
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {contract.job?.title || 'Custom Escrow Agreement'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Client: {contract.client?.clientProfile?.firstName || 'Verified Client'} • Created on{' '}
                      {formatDate(contract.createdAt)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Contract Value
                    </span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatNgn(contract.totalAmount)}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      Released: {formatNgn(contract.escrowReleasedAmount)} ({fundedPercent}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${fundedPercent}%` }}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{contract.milestones?.length || 1} Milestones</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-semibold">
                      Funded: {formatNgn(contract.escrowFundedAmount)}
                    </span>
                  </div>

                  <Link to={`/artisan/contracts/${contract.id}`}>
                    <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Open Workspace
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
