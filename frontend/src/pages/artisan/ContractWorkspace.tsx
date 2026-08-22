import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  DollarSign,
  Shield,
  RotateCcw,
  Camera,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Stepper } from '../../components/ui/Stepper';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatNgn, formatDate, formatDateTime, shortenAddress } from '../../lib/formatters';
import { Contract, Milestone, MilestoneStatus } from '../../types';

export const ContractWorkspace: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Submit Deliverable Modal State
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [beforeProofUrls, setBeforeProofUrls] = useState<string[]>([]);
  const [submissionProofUrls, setSubmissionProofUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Voluntary Refund Modal State
  const [refundMilestone, setRefundMilestone] = useState<Milestone | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // File Dispute Modal State
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Scope Disagreement');
  const [disputeExplanation, setDisputeExplanation] = useState('');
  const [isFilingDispute, setIsFilingDispute] = useState(false);

  const navigate = useNavigate();

  const fetchContract = async () => {
    if (!contractId) return;
    try {
      setIsLoading(true);
      const { data } = await apiClient.get(`/contracts/${contractId}`);
      setContract(data.data);
    } catch (err) {
      console.error('Failed to load contract', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('files', f));
      formData.append('folder', 'deliverables');

      const { data } = await apiClient.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const urls = data.data.map((res: { url: string }) => res.url);
      if (type === 'before') {
        setBeforeProofUrls((prev) => [...prev, ...urls]);
      } else {
        setSubmissionProofUrls((prev) => [...prev, ...urls]);
      }
    } catch (err) {
      alert(`Upload failed: ${getErrorMessage(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await apiClient.post(`/escrow/submit-work/${selectedMilestone.id}`, {
        submissionNotes,
        beforeProofUrls,
        submissionProofUrls,
      });

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setSelectedMilestone(null);
      setSubmissionNotes('');
      setBeforeProofUrls([]);
      setSubmissionProofUrls([]);
      await fetchContract();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoluntaryRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundMilestone) return;

    try {
      setIsRefunding(true);
      await apiClient.post(`/escrow/refund-milestone/${refundMilestone.id}`, {
        refundReason,
      });
      setRefundMilestone(null);
      setRefundReason('');
      await fetchContract();
    } catch (err) {
      alert(`Refund failed: ${getErrorMessage(err)}`);
    } finally {
      setIsRefunding(false);
    }
  };

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId) return;

    try {
      setIsFilingDispute(true);
      const { data } = await apiClient.post('/disputes', {
        contractId,
        reason: disputeReason,
        explanation: disputeExplanation,
      });
      setIsDisputeOpen(false);
      navigate(`/artisan/disputes/${data.data.id}`);
    } catch (err) {
      alert(`Dispute filing failed: ${getErrorMessage(err)}`);
    } finally {
      setIsFilingDispute(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-slate-500">Contract not found.</p>
        <Link to="/artisan/contracts">
          <Button size="sm">Back to Contracts</Button>
        </Link>
      </div>
    );
  }

  const milestones = contract.milestones || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/artisan/contracts')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contracts</span>
        </button>

        <div className="flex items-center gap-2">
          <Link to={`/artisan/messages`}>
            <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
              Chat with Client
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDisputeOpen(true)}
            leftIcon={<AlertTriangle className="w-4 h-4" />}
          >
            Escalate Dispute
          </Button>
        </div>
      </div>

      {/* Contract Main Summary Card */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge status={contract.status}>{contract.status}</Badge>
              <span className="text-xs font-mono font-bold text-slate-500">
                #{contract.contractCode}
              </span>
              {contract.onChainEscrowId && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Monad Escrow #{contract.onChainEscrowId}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {contract.job?.title || 'Contract Agreement'}
            </h1>
            <p className="text-xs text-slate-500">
              Client: {contract.client?.clientProfile?.firstName} {contract.client?.clientProfile?.lastName} ({contract.client?.email}) • Created {formatDate(contract.createdAt)}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Contract Amount
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatNgn(contract.totalAmount)}
            </span>
            <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
              <p>Platform Fee (5%): {formatNgn(contract.platformFeeAmount)}</p>
              <p className="font-semibold text-slate-300">
                Net Take-Home: {formatNgn(Number(contract.totalAmount) - Number(contract.platformFeeAmount))}
              </p>
            </div>
          </div>
        </div>

        {/* Monad Web3 Blockchain Status Bar */}
        {contract.onChainEscrowId && (
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Monad Testnet On-Chain Verification
              </span>
              <span className="text-slate-400 font-mono">
                Smart Contract: {shortenAddress(contract.smartContractAddr)}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-slate-300 pt-1">
              {contract.fundingTxHash && (
                <a
                  href={`https://testnet.monadexplorer.com/tx/${contract.fundingTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 flex items-center gap-1 underline"
                >
                  Funding Tx: {contract.fundingTxHash.slice(0, 10)}... <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {contract.releaseTxHash && (
                <a
                  href={`https://testnet.monadexplorer.com/tx/${contract.releaseTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 flex items-center gap-1 underline text-emerald-400"
                >
                  Release Tx: {contract.releaseTxHash.slice(0, 10)}... <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Milestone Progression Stepper */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
            Milestone Progression Flow
          </h3>
          <Stepper
            steps={milestones.map((m) => ({
              title: m.title,
              status: m.status,
              amount: m.amount,
            }))}
          />
        </div>
      </Card>

      {/* Milestones Deliverables List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Contract Deliverables & Escrow Milestones ({milestones.length})
        </h2>

        {milestones.map((milestone) => {
          const isFunded = milestone.status === 'FUNDED' || milestone.status === 'IN_PROGRESS';
          const isSubmitted = milestone.status === 'SUBMITTED';
          const isReleased = milestone.status === 'RELEASED';
          const isRevision = milestone.submissionNotes?.includes('[REVISION REQUESTED]');

          return (
            <Card key={milestone.id} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge status={milestone.status}>{milestone.status.replace('_', ' ')}</Badge>
                    <span className="text-xs font-semibold text-slate-400">
                      Step #{milestone.stepOrder}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {milestone.title}
                  </h3>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatNgn(milestone.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Net Take-Home: {formatNgn(Number(milestone.amount) * 0.95)}
                  </span>
                </div>
              </div>

              {/* Revision Notice Banner */}
              {isRevision && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Client Requested Changes on this Milestone</span>
                  </div>
                  <p className="text-slate-300 pl-5 whitespace-pre-line">
                    {milestone.submissionNotes}
                  </p>
                </div>
              )}

              {/* Submitted Proof Photos Showcase */}
              {milestone.submissionProofUrls && milestone.submissionProofUrls.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Submitted Work Deliverable Proofs ({milestone.submissionProofUrls.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {milestone.submissionProofUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt="Proof deliverable"
                          className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestone Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  {isReleased ? (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Escrow Funds Released to Wallet
                    </span>
                  ) : isSubmitted ? (
                    <span className="text-sky-500 font-semibold flex items-center gap-1">
                      <Clock className="w-4 h-4 animate-pulse" /> Awaiting Client Inspection & Release
                    </span>
                  ) : isFunded ? (
                    <span className="text-amber-500 font-semibold">
                      Funds Secured in Escrow — Ready to submit completion proof
                    </span>
                  ) : (
                    <span>Status: {milestone.status}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(isFunded || isRevision) && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRefundMilestone(milestone)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Refund Milestone
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedMilestone(milestone);
                          setSubmissionNotes('');
                          setBeforeProofUrls(milestone.beforeProofUrls || []);
                          setSubmissionProofUrls(milestone.submissionProofUrls || []);
                        }}
                        leftIcon={<Upload className="w-3.5 h-3.5" />}
                      >
                        {isRevision ? 'Resubmit Proof' : 'Submit Deliverable Proof'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Submit Work Modal */}
      <Modal
        isOpen={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        title="Submit Milestone Deliverable Proof"
        description="Upload photos/videos of completed work and provide notes for client verification."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitDeliverable} className="space-y-4">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {submitError}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center justify-between">
            <span>{selectedMilestone?.title}</span>
            <span className="text-emerald-500 font-bold">{formatNgn(selectedMilestone?.amount)}</span>
          </div>

          <Textarea
            label="Work Summary & Completion Notes"
            rows={4}
            placeholder="Describe the tasks executed, materials installed, testing performed, and any maintenance advice..."
            value={submissionNotes}
            onChange={(e) => setSubmissionNotes(e.target.value)}
            required
          />

          {/* Before Photos Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              "Before Work" Photos (Optional)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/mp4"
              onChange={(e) => handleFileUpload(e, 'before')}
              className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
            />
            {beforeProofUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {beforeProofUrls.map((url, i) => (
                  <img key={i} src={url} alt="Before" className="w-14 h-14 object-cover rounded-lg border" />
                ))}
              </div>
            )}
          </div>

          {/* After Deliverable Photos Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              "Completed Deliverable / After" Photos (Required Proof)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/mp4"
              onChange={(e) => handleFileUpload(e, 'after')}
              className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
            />
            {submissionProofUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {submissionProofUrls.map((url, i) => (
                  <img key={i} src={url} alt="After" className="w-14 h-14 object-cover rounded-lg border border-emerald-500" />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setSelectedMilestone(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || isUploading}>
              Submit for Approval & Payout
            </Button>
          </div>
        </form>
      </Modal>

      {/* Voluntary Refund Modal */}
      <Modal
        isOpen={!!refundMilestone}
        onClose={() => setRefundMilestone(null)}
        title="Voluntary Milestone Refund"
        description="Refund funded escrow milestone back to client wallet balance."
      >
        <form onSubmit={handleVoluntaryRefund} className="space-y-4">
          <p className="text-xs text-slate-300">
            You are initiating a refund of{' '}
            <strong className="text-emerald-400">{formatNgn(refundMilestone?.amount)}</strong> for "
            {refundMilestone?.title}". Funds will be unlocked back to the client.
          </p>

          <Textarea
            label="Refund Explanation"
            rows={3}
            placeholder="Reason for refunding milestone..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRefundMilestone(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={isRefunding}>
              Confirm Refund
            </Button>
          </div>
        </form>
      </Modal>

      {/* File Dispute Modal */}
      <Modal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        title="File Escrow Dispute"
        description="Escalate this contract to admin arbitration. Escrow funds will be frozen."
      >
        <form onSubmit={handleFileDispute} className="space-y-4">
          <Input
            label="Dispute Reason"
            placeholder="e.g. Scope disagreement, Unresponsive client"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            required
          />

          <Textarea
            label="Detailed Explanation"
            rows={4}
            placeholder="Provide a comprehensive statement for the dispute arbitrator..."
            value={disputeExplanation}
            onChange={(e) => setDisputeExplanation(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsDisputeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={isFilingDispute}>
              File Official Dispute
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
