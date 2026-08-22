import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  AlertTriangle,
  ShieldCheck,
  Send,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { Dispute, DisputeMessage, DisputeEvidence, ApiResponse } from '../../types';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

export const ClientDisputeWorkspace: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [messageBody, setMessageBody] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Dispute Messages
  const { data: messagesData = [], isLoading } = useQuery<DisputeMessage[]>({
    queryKey: ['dispute-messages', disputeId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DisputeMessage[] | { messages: DisputeMessage[] }>>(
        `/disputes/${disputeId}/messages`
      );
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.messages) || [];
    },
    enabled: !!disputeId,
    refetchInterval: 8000,
  });

  // 2. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!messageBody.trim()) return;
      const body = messageBody.trim();
      setMessageBody('');
      await apiClient.post(`/disputes/${disputeId}/messages`, { body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute-messages', disputeId] });
    },
  });

  // 3. Upload Evidence Mutation
  const uploadEvidenceMutation = useMutation({
    mutationFn: async () => {
      if (!evidenceFile || !evidenceTitle.trim()) {
        throw new Error('Please specify an evidence title and select a file.');
      }
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', evidenceFile);
      formData.append('folder', 'dispute-evidence');

      const { data: uploadRes } = await apiClient.post<ApiResponse<{ url: string; format: string }>>(
        '/upload/single',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      await apiClient.post(`/disputes/${disputeId}/evidence`, {
        title: evidenceTitle,
        fileUrl: uploadRes.data.url,
        mimeType: evidenceFile.type || 'image/jpeg',
      });
    },
    onSuccess: () => {
      setIsUploading(false);
      setEvidenceTitle('');
      setEvidenceFile(null);
      alert('Supplementary evidence uploaded.');
    },
    onError: (err) => {
      setIsUploading(false);
      setErrorMessage(getErrorMessage(err));
    },
  });

  // 4. Cancel Dispute Mutation
  const cancelDisputeMutation = useMutation({
    mutationFn: async () => {
      if (!confirm('Are you sure you want to cancel this dispute?')) return;
      await apiClient.patch(`/disputes/${disputeId}/cancel`);
    },
    onSuccess: () => {
      alert('Dispute has been cancelled.');
      queryClient.invalidateQueries({ queryKey: ['client-contracts-disputes'] });
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Back Link */}
      <div>
        <Link
          to="/client/disputes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dispute Center</span>
        </Link>
      </div>

      {/* Header Card */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-rose-600">
                Dispute Workspace #{disputeId?.slice(0, 8)}
              </span>
              <Badge variant="rose">UNDER ARBITRATION</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              3-Way Mediation Channel
            </h1>
            <p className="text-xs text-slate-500">
              All messages and uploaded proofs in this workspace are reviewed by Fixmate&apos;s administrative arbitrators.
            </p>
          </div>

          <button
            onClick={() => cancelDisputeMutation.mutate()}
            disabled={cancelDisputeMutation.isPending}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 self-start sm:self-auto"
          >
            Cancel Dispute
          </button>
        </div>
      </Card>

      {/* 3-Way Chat Thread */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Arbitration Communication Thread
        </h2>

        <div className="space-y-3 max-h-96 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          {isLoading ? (
            <p className="text-xs text-slate-400 text-center py-4">Loading messages...</p>
          ) : (messagesData || []).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No arbitration statements posted yet. Use the box below to describe the issue.
            </p>
          ) : (
            messagesData?.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const isAdmin = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPPORT';
              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl text-xs space-y-1 ${
                    isAdmin
                      ? 'bg-purple-500/10 border border-purple-500/30'
                      : isMe
                      ? 'bg-sky-50 dark:bg-sky-950/40 border border-sky-500/20'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{msg.sender?.email}</span>
                      {isAdmin && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-600 text-white">
                          ARBITRATOR
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {msg.body}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Type your official arbitration statement..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
          />
          <button
            onClick={() => sendMessageMutation.mutate()}
            disabled={!messageBody.trim() || sendMessageMutation.isPending}
            className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Supplementary Evidence Upload Card */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Upload Supplementary Evidence
        </h2>

        {errorMessage && (
          <p className="text-xs text-rose-600">{errorMessage}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={evidenceTitle}
            onChange={(e) => setEvidenceTitle(e.target.value)}
            placeholder="Evidence title (e.g. Broken pipe photo, Chat screenshot)"
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
          <input
            type="file"
            onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
            className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-300"
          />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!evidenceFile || !evidenceTitle.trim() || isUploading}
            onClick={() => uploadEvidenceMutation.mutate()}
            className="bg-rose-600 hover:bg-rose-500 text-white"
          >
            {isUploading ? 'Uploading...' : 'Submit Evidence File'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
