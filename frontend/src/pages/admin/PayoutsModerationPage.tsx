import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, PayoutRequest, PaginationMeta, PayoutStatus } from '../../types';
import { useAdminStore } from '../../stores/adminStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';

export const PayoutsModerationPage: React.FC = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Moderation Modal State
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<PayoutStatus>('COMPLETED');
  const [gatewayCode, setGatewayCode] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { fetchDashboardMetrics } = useAdminStore();

  const fetchPayouts = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 15 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get<ApiResponse<{ payouts: any[]; meta: PaginationMeta }>>('/admin/payouts', {
        params,
      });

      if (res.data.success) {
        setPayouts(res.data.data.payouts);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts(1);
  }, [statusFilter]);

  const openModerationModal = (payout: any) => {
    setSelectedPayout(payout);
    setTargetStatus('COMPLETED');
    setGatewayCode(payout.gatewayTransferCode || '');
    setFailureReason('');
    setModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;
    if (targetStatus === 'REJECTED' && !failureReason.trim()) {
      setError('Please provide a failure reason for rejecting the payout.');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      const res = await apiClient.patch<ApiResponse<any>>(`/admin/payouts/${selectedPayout.id}/status`, {
        status: targetStatus,
        gatewayTransferCode: gatewayCode.trim() || undefined,
        failureReason: targetStatus === 'REJECTED' ? failureReason.trim() : undefined,
      });

      if (res.data.success) {
        setPayouts((prev) =>
          prev.map((p) =>
            p.id === selectedPayout.id
              ? {
                  ...p,
                  status: targetStatus,
                  gatewayTransferCode: gatewayCode,
                  failureReason,
                }
              : p
          )
        );
        fetchDashboardMetrics();
        setModalOpen(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-400" />
            <span>Artisan Bank Payouts Moderation</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Process bank transfer withdrawals, reconcile Paystack recipient transfers, and handle payout refunds.
          </p>
        </div>
        <Badge variant="purple" size="md">
          Payout Requests: {meta.total}
        </Badge>
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
            { key: 'PENDING', label: 'Pending Processing' },
            { key: 'PROCESSING', label: 'In-Flight Processing' },
            { key: 'COMPLETED', label: 'Completed Settlements' },
            { key: 'REJECTED', label: 'Rejected Payouts' },
            { key: 'ALL', label: 'All Requests' },
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
            placeholder="Search reference, transfer code, or artisan email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPayouts(1)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
          />
        </div>
      </div>

      {/* Payouts Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Payout Ref</th>
                <th className="py-3.5 px-4">Artisan</th>
                <th className="py-3.5 px-4">Bank Account</th>
                <th className="py-3.5 px-4">Amount (Net)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading payout requests...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No payout requests matching current filter.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white font-mono text-[11px]">{p.reference}</p>
                      {p.gatewayTransferCode && (
                        <p className="text-[10px] text-purple-400 font-mono truncate max-w-xs">
                          {p.gatewayTransferCode}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-200">{p.user?.email}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.user?.phoneNumber}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white">{p.bankAccount?.bankName}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {p.bankAccount?.accountNumber} ({p.bankAccount?.accountName})
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-purple-300 text-sm">{formatCurrency(p.amount)}</p>
                      {Number(p.fee) > 0 && (
                        <p className="text-[10px] text-slate-400">Fee: {formatCurrency(p.fee)}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          p.status === 'COMPLETED'
                            ? 'success'
                            : p.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {p.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {formatDate(p.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openModerationModal(p)}
                        className="font-bold text-xs"
                      >
                        Update State
                      </Button>
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
            <strong className="text-white">{meta.totalPages || 1}</strong> ({meta.total} payouts)
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchPayouts(meta.page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchPayouts(meta.page + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Moderation Modal */}
      {selectedPayout && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Moderate Artisan Bank Payout"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-bold text-white">{selectedPayout.user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bank Destination:</span>
                <span className="text-slate-200">
                  {selectedPayout.bankAccount?.bankName} - {selectedPayout.bankAccount?.accountNumber}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Transfer Amount:</span>
                <span className="font-bold text-purple-400 text-sm">
                  {formatCurrency(selectedPayout.amount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Update Status To</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
              >
                <option value="PROCESSING">PROCESSING (Transfer Initiated)</option>
                <option value="COMPLETED">COMPLETED (Funds Successfully Settled)</option>
                <option value="REJECTED">REJECTED (Refund Funds Back to Artisan Wallet)</option>
              </select>
            </div>

            <Input
              label="Gateway Transfer Code / Bank Reference (Optional)"
              placeholder="e.g. TRF_xxxxxx or Bank Session ID"
              value={gatewayCode}
              onChange={(e) => setGatewayCode(e.target.value)}
            />

            {targetStatus === 'REJECTED' && (
              <Textarea
                label="Rejection Failure Reason (Required)"
                placeholder="e.g. Invalid account number, bank name mismatch, KYC compliance hold..."
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                required
                rows={2}
              />
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isUpdating} className="bg-purple-600 text-white font-bold">
                Save & Update State
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
