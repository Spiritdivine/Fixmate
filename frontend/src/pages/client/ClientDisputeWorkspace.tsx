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
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-dashboard">
      {/* Back Link */}
      <div className="space-y-3">
        <Link
          to="/client/disputes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dispute Center</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                Dispute Workspace #{disputeId?.slice(0, 8)}
              </span>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200">
                UNDER ARBITRATION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              3-Way Mediation Channel
            </h1>
            <p className="text-sm text-slate-500">
              All messages and uploaded proofs in this workspace are reviewed by Artifix&apos;s administrative arbitrators.
            </p>
          </div>

          <button
            onClick={() => cancelDisputeMutation.mutate()}
            disabled={cancelDisputeMutation.isPending}
            className="px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm self-start sm:self-auto"
          >
            Cancel Dispute
          </button>
        </div>
      </div>

      {/* 3-Way Chat Thread */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5">
        <h2 className="text-base font-bold text-slate-900">
          Arbitration Communication Thread
        </h2>

        <div className="space-y-3.5 max-h-96 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-100">
          {isLoading ? (
            <p className="text-xs text-slate-400 text-center py-6">Loading messages...</p>
          ) : (messagesData || []).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No arbitration statements posted yet. Use the box below to describe the issue.
            </p>
          ) : (
            messagesData?.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const isAdmin = msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPPORT';
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl text-xs space-y-1.5 ${
                    isAdmin
                      ? 'bg-purple-50 border border-purple-200 text-purple-900'
                      : isMe
                      ? 'bg-emerald-50 border border-emerald-500/20 text-emerald-950'
                      : 'bg-white border border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{msg.sender?.email}</span>
                      {isAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-600 text-white tracking-wider">
                          ARBITRATOR
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line font-normal">
                    {msg.body}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Type your official arbitration statement..."
            className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
          />
          <button
            onClick={() => sendMessageMutation.mutate()}
            disabled={!messageBody.trim() || sendMessageMutation.isPending}
            className="p-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Supplementary Evidence Upload Card */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5">
        <h2 className="text-base font-bold text-slate-900">
          Upload Supplementary Evidence
        </h2>

        {errorMessage && (
          <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <input
            type="text"
            value={evidenceTitle}
            onChange={(e) => setEvidenceTitle(e.target.value)}
            placeholder="Evidence title (e.g. Broken pipe photo, Chat screenshot)"
            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-700 outline-none transition-all"
          />
          <input
            type="file"
            onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
            className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            disabled={!evidenceFile || !evidenceTitle.trim() || isUploading}
            onClick={() => uploadEvidenceMutation.mutate()}
            className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Submit Evidence File'}
          </button>
        </div>
      </div>
    </div>
  );
};
