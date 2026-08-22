import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Send,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Gavel,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, Dispute, DisputeResolution } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';

export const DisputeWorkspacePage: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const { user } = useAuthStore();

  const [dispute, setDispute] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageBody, setNewMessageBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settlement Verdict Form State
  const [verdictModalOpen, setVerdictModalOpen] = useState(false);
  const [resolution, setResolution] = useState<DisputeResolution>('FULL_REFUND_CLIENT');
  const [clientRefundAmount, setClientRefundAmount] = useState<number>(0);
  const [artisanPayoutAmount, setArtisanPayoutAmount] = useState<number>(0);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [onChainTxHash, setOnChainTxHash] = useState('');
  const [isExecutingResolution, setIsExecutingResolution] = useState(false);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchDisputeData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [disputeRes, messagesRes] = await Promise.all([
        apiClient.get<ApiResponse<any>>(`/admin/disputes/${disputeId}`),
        apiClient.get<ApiResponse<any[]>>(`/disputes/${disputeId}/messages`),
      ]);

      if (disputeRes.data.success) {
        setDispute(disputeRes.data.data);
        const amount = Number(disputeRes.data.data.disputedAmount || 0);
        setClientRefundAmount(amount);
        setArtisanPayoutAmount(0);
      }
      if (messagesRes.data.success) {
        setMessages(messagesRes.data.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (disputeId) fetchDisputeData();
  }, [disputeId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageBody.trim()) return;

    try {
      setIsSendingMessage(true);
      const res = await apiClient.post<ApiResponse<any>>(`/disputes/${disputeId}/messages`, {
        body: newMessageBody.trim(),
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessageBody('');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleResolutionTypeChange = (type: DisputeResolution) => {
    setResolution(type);
    const total = Number(dispute?.disputedAmount || 0);
    if (type === 'FULL_REFUND_CLIENT') {
      setClientRefundAmount(total);
      setArtisanPayoutAmount(0);
    } else if (type === 'FULL_PAYOUT_ARTISAN') {
      setClientRefundAmount(0);
      setArtisanPayoutAmount(total);
    } else if (type === 'SPLIT_SETTLEMENT') {
      const half = Math.round(total / 2);
      setClientRefundAmount(half);
      setArtisanPayoutAmount(total - half);
    }
  };

  const handleExecuteResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setError('Please provide mandatory arbitration resolution notes.');
      return;
    }

    try {
      setIsExecutingResolution(true);
      setError(null);
      const res = await apiClient.patch<ApiResponse<any>>(`/disputes/${disputeId}/resolve`, {
        resolution,
        refundToClientAmount: clientRefundAmount,
        payoutToArtisanAmount: artisanPayoutAmount,
        adminResolutionNotes: resolutionNotes.trim(),
        onChainResolutionTxHash: onChainTxHash.trim() || undefined,
      });

      if (res.data.success) {
        setDispute(res.data.data);
        setVerdictModalOpen(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsExecutingResolution(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-purple-400">Opening Arbitration Courtroom...</p>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <p className="text-slate-400 text-sm">Dispute record could not be loaded.</p>
        <Link to="/admin/disputes">
          <Button size="sm" variant="outline">
            ← Return to Dispute Queue
          </Button>
        </Link>
      </div>
    );
  }

  const isResolved = dispute.status === 'RESOLVED';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/disputes"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-mono">{dispute.disputeCode}</h2>
              <Badge variant={isResolved ? 'success' : 'danger'}>{dispute.status}</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Contract #{dispute.contract?.contractCode} • Disputed Amount:{' '}
              <strong className="text-rose-400 font-bold">{formatCurrency(dispute.disputedAmount)}</strong>
            </p>
          </div>
        </div>

        {!isResolved && (
          <Button
            size="sm"
            onClick={() => setVerdictModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/30"
            leftIcon={<Gavel className="w-4 h-4" />}
          >
            Execute Arbitration Verdict
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* 3-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 1: Facts & Parties (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Dispute Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] text-purple-400">
              Dispute Statement
            </h3>
            <div>
              <span className="text-slate-400">Stated Reason:</span>
              <p className="font-bold text-slate-200 mt-0.5">{dispute.reason}</p>
            </div>
            <div>
              <span className="text-slate-400">Detailed Explanation:</span>
              <p className="text-slate-300 mt-0.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 leading-relaxed">
                {dispute.explanation}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Initiator: <strong className="text-white">{dispute.initiatedByUser?.role}</strong></span>
              <span>{formatDate(dispute.createdAt)}</span>
            </div>
          </div>

          {/* Parties Dossier */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] text-purple-400">
              Opposing Parties
            </h3>

            {/* Client */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-blue-400">Client</span>
              <p className="font-bold text-white">{dispute.contract?.client?.email}</p>
              <p className="text-slate-400 text-[11px]">
                {dispute.contract?.client?.clientProfile?.firstName} {dispute.contract?.client?.clientProfile?.lastName}
              </p>
            </div>

            {/* Artisan */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-400">Artisan</span>
              <p className="font-bold text-white">{dispute.contract?.artisan?.email}</p>
              <p className="text-slate-400 text-[11px]">
                {dispute.contract?.artisan?.artisanProfile?.businessName || 'Independent Artisan'}
              </p>
            </div>
          </div>

          {/* Blockchain & Milestone facts */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] text-purple-400">
              Escrow & On-Chain Facts
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Contract Total:</span>
              <span className="font-bold text-white">{formatCurrency(dispute.contract?.totalAmount || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Escrow Funded:</span>
              <span className="font-bold text-emerald-400">{formatCurrency(dispute.contract?.escrowFundedAmount || 0)}</span>
            </div>
            {dispute.contract?.onChainEscrowId && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-mono text-[11px]">
                <span className="text-slate-400">Monad Escrow ID:</span>
                <span className="text-purple-400 font-bold">#{dispute.contract.onChainEscrowId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Col 2: Evidence Dossier (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-purple-400">
                Evidence Dossier ({dispute.evidences?.length || 0})
              </h3>
            </div>

            {(!dispute.evidences || dispute.evidences.length === 0) ? (
              <p className="text-xs text-slate-500 py-8 text-center">No photographic evidence attached.</p>
            ) : (
              <div className="space-y-3">
                {dispute.evidences.map((ev: any) => (
                  <div key={ev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white truncate max-w-xs">{ev.title}</p>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-800 text-purple-300 rounded">
                        {ev.uploader?.role || 'UPLOADER'}
                      </span>
                    </div>

                    <div
                      onClick={() => setLightboxUrl(ev.fileUrl)}
                      className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer group max-h-40 flex items-center justify-center"
                    >
                      <img src={ev.fileUrl} alt={ev.title} className="w-full object-cover max-h-40 group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[11px] font-bold text-white bg-slate-900/90 px-2.5 py-1 rounded-md">
                          Zoom Evidence
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Col 3: Real-Time Chat & Discussion (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col h-full">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col flex-1 min-h-[480px]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-purple-400 mb-3">
              Tribunal Discussion Thread
            </h3>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-800">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-500 py-12 text-center">No discussion messages yet.</p>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.sender?.role === 'ADMIN' || m.sender?.role === 'SUPPORT';
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl text-xs space-y-1 ${
                        isAdmin
                          ? 'bg-purple-950/60 border border-purple-800/60 text-purple-200'
                          : 'bg-slate-950 border border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-white">
                          {m.sender?.email?.split('@')[0]} ({m.sender?.role})
                        </span>
                        <span className="font-mono">{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="leading-relaxed">{m.body}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Type official arbitration instruction..."
                value={newMessageBody}
                onChange={(e) => setNewMessageBody(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
              />
              <Button
                type="submit"
                size="sm"
                isLoading={isSendingMessage}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Resolution Verdict Modal */}
      <Modal
        isOpen={verdictModalOpen}
        onClose={() => setVerdictModalOpen(false)}
        title="Execute Official Arbitration Verdict"
      >
        <form onSubmit={handleExecuteResolution} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Select the formal binding judgment for Dispute <strong className="text-white font-mono">{dispute.disputeCode}</strong>. Disputed volume: <strong className="text-rose-400">{formatCurrency(dispute.disputedAmount)}</strong>.
          </p>

          {/* Verdict Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { type: 'FULL_REFUND_CLIENT', label: '100% Refund Client' },
              { type: 'FULL_PAYOUT_ARTISAN', label: '100% Payout Artisan' },
              { type: 'SPLIT_SETTLEMENT', label: 'Custom Split Split' },
            ].map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => handleResolutionTypeChange(opt.type as any)}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                  resolution === opt.type
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Split Inputs */}
          {resolution === 'SPLIT_SETTLEMENT' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <Input
                label="Client Refund (₦)"
                type="number"
                value={clientRefundAmount}
                onChange={(e) => setClientRefundAmount(Number(e.target.value))}
                required
              />
              <Input
                label="Artisan Payout (₦)"
                type="number"
                value={artisanPayoutAmount}
                onChange={(e) => setArtisanPayoutAmount(Number(e.target.value))}
                required
              />
            </div>
          )}

          <Textarea
            label="Mandatory Arbitration Resolution Notes"
            placeholder="Document legal or technical rationale for this verdict (dispatched to both client and artisan notifications)..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            required
            rows={3}
          />

          <Input
            label="Optional Monad On-Chain Resolution Tx Hash"
            placeholder="0x..."
            value={onChainTxHash}
            onChange={(e) => setOnChainTxHash(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setVerdictModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isExecutingResolution}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm & Execute Verdict
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={lightboxUrl} alt="Evidence Fullscreen" className="max-w-4xl max-h-[85vh] object-contain rounded-2xl border border-slate-800" />
        </div>
      )}
    </div>
  );
};
