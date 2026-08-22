import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient } from '../../lib/api-client';
import { formatNgn, formatDate } from '../../lib/formatters';
import { Contract, Dispute } from '../../types';

export const DisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/contracts');
      const allContracts: Contract[] = data.data || [];
      const extractedDisputes: Dispute[] = allContracts.flatMap((c) =>
        (c.disputes || []).map((d) => ({ ...d, contract: c }))
      );
      setDisputes(extractedDisputes);
    } catch (err) {
      console.error('Failed to load disputes', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Escrow Dispute Arbitration Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage contract dispute claims, submit photographic proof, and participate in 3-way arbitration hearings.
          </p>
        </div>
        <Link to="/artisan/contracts">
          <Button variant="outline" size="sm">
            View All Contracts
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-8 h-8 text-emerald-500" />}
          title="No active disputes on your account"
          description="Your escrow contracts are running smoothly without any open arbitration claims."
        />
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <Card key={d.id} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge status={d.status}>{d.status.replace('_', ' ')}</Badge>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{d.disputeCode}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {d.reason}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Contract #{d.contract?.contractCode} • Filed on {formatDate(d.createdAt)}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Disputed Amount
                  </span>
                  <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                    {formatNgn(d.disputedAmount)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl">
                {d.explanation}
              </p>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400">
                  {d.resolution ? `Ruling: ${d.resolution}` : 'Arbitration Under Review'}
                </div>
                <Link to={`/artisan/disputes/${d.id}`}>
                  <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Open Arbitration Vault
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
