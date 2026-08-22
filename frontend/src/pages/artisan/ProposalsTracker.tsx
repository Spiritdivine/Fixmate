import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Clock,
  CheckCircle,
  XCircle,
  FileCheck,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatNgn, formatDate } from '../../lib/formatters';
import { Proposal, ProposalStatus } from '../../types';

export const ProposalsTracker: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [editCoverLetter, setEditCoverLetter] = useState('');
  const [editBidAmount, setEditBidAmount] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get('/proposals/my-proposals');
      setProposals(data.data || []);
    } catch (err) {
      console.error('Failed to load proposals', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleWithdraw = async (proposalId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this proposal?')) return;
    try {
      await apiClient.delete(`/proposals/${proposalId}`);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: 'WITHDRAWN' } : p))
      );
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleOpenEdit = (p: Proposal) => {
    setEditingProposal(p);
    setEditCoverLetter(p.coverLetter);
    setEditBidAmount(String(p.bidAmount));
    setModalError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProposal) return;
    try {
      setIsUpdating(true);
      setModalError(null);

      const { data } = await apiClient.put(`/proposals/${editingProposal.id}`, {
        bidAmount: parseFloat(editBidAmount),
        coverLetter: editCoverLetter,
      });

      setProposals((prev) =>
        prev.map((p) => (p.id === editingProposal.id ? { ...p, ...data.data } : p))
      );
      setEditingProposal(null);
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const tabs: { label: string; value: string }[] = [
    { label: `All (${proposals.length})`, value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Shortlisted', value: 'SHORTLISTED' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Withdrawn', value: 'WITHDRAWN' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Proposals & Bidding Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track client review statuses, update quotations, and launch funded contracts upon acceptance.
          </p>
        </div>
        <Link to="/artisan/jobs">
          <Button size="sm" leftIcon={<Send className="w-4 h-4" />}>
            Browse More Jobs
          </Button>
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
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredProposals.length === 0 ? (
        <EmptyState
          icon={<Send className="w-8 h-8" />}
          title={`No ${activeTab.toLowerCase()} proposals found`}
          description="Submit competitive proposals with structured milestones to win contracts."
          actionLabel="Find Jobs"
          onAction={() => (window.location.href = '/artisan/jobs')}
        />
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <Card key={proposal.id} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge status={proposal.status}>{proposal.status}</Badge>
                    <span className="text-xs text-slate-400">
                      Submitted on {formatDate(proposal.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {proposal.job?.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: {proposal.job?.category?.name || 'General Trade'} • Client:{' '}
                    {proposal.job?.client?.clientProfile?.firstName || 'Verified Client'}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Your Bid Quotation
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatNgn(proposal.bidAmount)}
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Estimated {proposal.estimatedDays} days
                  </span>
                </div>
              </div>

              {/* Cover Letter excerpt */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cover Letter</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  {proposal.coverLetter}
                </p>
              </div>

              {/* Milestones preview */}
              {proposal.milestones && proposal.milestones.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Proposed Milestone Schedule ({proposal.milestones.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {proposal.milestones.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate mr-2">
                          #{m.stepOrder} {m.title}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {formatNgn(m.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500">
                  {proposal.status === 'ACCEPTED' ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Contract Created & Ready!
                    </span>
                  ) : proposal.status === 'PENDING' ? (
                    <span>Awaiting Client Shortlist or Acceptance</span>
                  ) : (
                    <span>Status: {proposal.status}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {proposal.status === 'ACCEPTED' && (
                    <Link to={`/artisan/contracts/${proposal.contract?.id || ''}`}>
                      <Button size="sm" leftIcon={<FileCheck className="w-4 h-4" />}>
                        Open Contract Workspace
                      </Button>
                    </Link>
                  )}

                  {proposal.status === 'PENDING' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(proposal)}
                        leftIcon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Revise Bid
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleWithdraw(proposal.id)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Withdraw
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Proposal Modal */}
      <Modal
        isOpen={!!editingProposal}
        onClose={() => setEditingProposal(null)}
        title="Revise Submitted Proposal"
        description="Update your quote and cover letter before the client accepts."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {modalError}
            </div>
          )}

          <Input
            label="Bid Amount (₦)"
            type="number"
            value={editBidAmount}
            onChange={(e) => setEditBidAmount(e.target.value)}
            required
          />

          <Textarea
            label="Cover Letter"
            rows={5}
            value={editCoverLetter}
            onChange={(e) => setEditCoverLetter(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditingProposal(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
