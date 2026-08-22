import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  Send,
  Upload,
  FileText,
  Trash2,
  ArrowLeft,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatNgn, formatDateTime, formatDate } from '../../lib/formatters';
import { useAuthStore } from '../../stores/authStore';
import { Dispute, DisputeEvidence, DisputeMessage } from '../../types';

export const DisputeWorkspace: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const { user } = useAuthStore();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [evidences, setEvidences] = useState<DisputeEvidence[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const fetchDisputeDetails = async () => {
    if (!disputeId) return;
    try {
      setIsLoading(true);
      const [msgRes, contractsRes] = await Promise.all([
        apiClient.get(`/disputes/${disputeId}/messages`),
        apiClient.get('/contracts'),
      ]);

      setMessages(msgRes.data.data || []);
      const allContracts = contractsRes.data.data || [];
      for (const c of allContracts) {
        const found = (c.disputes || []).find((d: Dispute) => d.id === disputeId);
        if (found) {
          setDispute({ ...found, contract: c });
          setEvidences(found.evidences || []);
          break;
        }
      }
    } catch (err) {
      console.error('Failed to load dispute details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputeDetails();
  }, [disputeId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !disputeId) return;

    try {
      setIsSendingMessage(true);
      const { data } = await apiClient.post(`/disputes/${disputeId}/messages`, {
        body: messageInput.trim(),
      });
      setMessages((prev) => [...prev, data.data]);
      setMessageInput('');
    } catch (err) {
      alert(`Failed to send message: ${getErrorMessage(err)}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !disputeId) return;

    try {
      setIsUploadingEvidence(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'dispute-evidence');

      const uploadRes = await apiClient.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const fileUrl = uploadRes.data.data.url;

      const { data } = await apiClient.post(`/disputes/${disputeId}/evidence`, {
        title: evidenceTitle.trim() || file.name,
        fileUrl,
        mimeType: file.type,
      });

      setEvidences((prev) => [...prev, data.data]);
      setEvidenceTitle('');
    } catch (err) {
      alert(`Evidence upload failed: ${getErrorMessage(err)}`);
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    try {
      await apiClient.delete(`/disputes/evidence/${evidenceId}`);
      setEvidences((prev) => prev.filter((ev) => ev.id !== evidenceId));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleCancelDispute = async () => {
    if (!window.confirm('Are you sure you want to withdraw this dispute claim?')) return;
    if (!disputeId) return;

    try {
      await apiClient.patch(`/disputes/${disputeId}/cancel`);
      alert('Dispute withdrawn successfully.');
      navigate('/artisan/disputes');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/artisan/disputes')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dispute Center</span>
        </button>

        {dispute?.status !== 'RESOLVED' && dispute?.status !== 'CLOSED' && (
          <Button variant="secondary" size="sm" onClick={handleCancelDispute}>
            Withdraw Dispute Claim
          </Button>
        )}
      </div>

      {/* Main Dispute Header Card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge status={dispute?.status}>{dispute?.status}</Badge>
              <span className="text-xs font-mono font-bold text-slate-500">
                #{dispute?.disputeCode}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {dispute?.reason}
            </h1>
            <p className="text-xs text-slate-500">
              Contract #{dispute?.contract?.contractCode} • Disputed Amount:{' '}
              <strong className="text-rose-500 font-bold">
                {formatNgn(dispute?.disputedAmount)}
              </strong>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Initial Statement of Claim
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">
            {dispute?.explanation}
          </p>
        </div>

        {/* Resolution Ruling if settled */}
        {dispute?.resolution && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
              Official Admin Arbitration Ruling: {dispute.resolution}
            </span>
            {dispute.adminResolutionNotes && (
              <p className="text-slate-300">
                <strong>Arbitrator Notes:</strong> {dispute.adminResolutionNotes}
              </p>
            )}
            {dispute.onChainResolutionTxHash && (
              <a
                href={`https://testnet.monadexplorer.com/tx/${dispute.onChainResolutionTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline flex items-center gap-1"
              >
                Monad Resolution Tx: {dispute.onChainResolutionTxHash.slice(0, 12)}...{' '}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </Card>

      {/* Grid: 3-Way Arbitration Chat & Evidence Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 3-Way Chat Thread */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="flex flex-col h-[520px] p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                3-Way Arbitration Hearing Thread
              </h3>
              <p className="text-[11px] text-slate-400">
                Official communication log between Artisan, Client, and Fixmate Arbitrator
              </p>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-16">
                  No arbitration messages posted yet.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === user?.id;
                  const isAdmin = m.sender.role === 'ADMIN' || m.sender.role === 'SUPPORT';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                        <span className="font-bold">{m.sender.email}</span>
                        {isAdmin && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 font-bold">
                            ARBITRATOR
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                          isAdmin
                            ? 'bg-purple-950/40 border border-purple-800/60 text-purple-200'
                            : isMe
                            ? 'bg-sky-600 text-white rounded-br-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.body}</p>
                        <div className="text-[9px] text-right opacity-70">
                          {formatDateTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
            >
              <Input
                placeholder="Post statement to hearing thread..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="py-2 text-xs"
              />
              <Button type="submit" size="sm" isLoading={isSendingMessage} leftIcon={<Send className="w-4 h-4" />}>
                Send
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Col: Evidence Vault */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Evidence Vault ({evidences.length})</CardTitle>
                <CardDescription>Upload photos, work receipts, or chat screenshots.</CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3">
              <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <Input
                  placeholder="Evidence Title (e.g. Completed Piping Receipt)"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="text-xs"
                />
                <label className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingEvidence ? 'Uploading...' : 'Choose Proof File'}</span>
                  <input
                    type="file"
                    onChange={handleUploadEvidence}
                    disabled={isUploadingEvidence}
                    className="hidden"
                  />
                </label>
              </div>

              {evidences.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No evidence files uploaded yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {evidences.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <a
                        href={ev.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 min-w-0 hover:text-sky-500 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="text-xs font-semibold truncate">{ev.title}</span>
                      </a>
                      <button
                        onClick={() => handleDeleteEvidence(ev.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
