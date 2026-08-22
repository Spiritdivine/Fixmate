import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  RotateCw,
  ExternalLink,
  Plus,
  BadgeCheck,
  Mail,
  Phone,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatDate } from '../../lib/formatters';
import { ApiResponse, KycVerification, PaginationMeta, IdDocumentType, KycStatus } from '../../types';
import { useAdminStore } from '../../stores/adminStore';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';

export const KycVerificationPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [docFilter, setDocFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review Inspector Modal
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Manual User Verification Modal
  const [manualVerifyOpen, setManualVerifyOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [selectedUserToVerify, setSelectedUserToVerify] = useState<any | null>(null);
  const [manualKyc, setManualKyc] = useState(true);
  const [manualEmail, setManualEmail] = useState(true);
  const [manualPhone, setManualPhone] = useState(true);
  const [manualDocType, setManualDocType] = useState('NIN');
  const [manualDocNumber, setManualDocNumber] = useState('');
  const [manualReason, setManualReason] = useState('Manual verification granted by compliance administrator');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSubmittingManualVerify, setIsSubmittingManualVerify] = useState(false);

  const { fetchDashboardMetrics } = useAdminStore();

  const fetchKycSubmissions = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 15 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (docFilter !== 'ALL') params.documentType = docFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get<ApiResponse<{ submissions: any[]; meta: PaginationMeta }>>('/admin/kyc', {
        params,
      });

      if (res.data.success) {
        setSubmissions(res.data.data.submissions);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycSubmissions(1);
  }, [statusFilter, docFilter]);

  const handleReviewAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedKyc) return;
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      setError('Please provide a specific rejection reason for the user.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const res = await apiClient.patch<ApiResponse<any>>(`/profiles/kyc/${selectedKyc.id}/review`, {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason.trim() : undefined,
      });

      if (res.data.success) {
        setSubmissions((prev) =>
          prev.map((k) => (k.id === selectedKyc.id ? { ...k, status, rejectionReason } : k))
        );
        setSuccessMsg(`KYC document status marked as ${status}`);
        fetchDashboardMetrics();
        setInspectorModalOpen(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const openInspector = (kyc: any) => {
    setSelectedKyc(kyc);
    setRejectionReason('');
    setPreviewImage(kyc.documentFrontUrl);
    setInspectorModalOpen(true);
  };

  const searchUsersForManualVerify = async (query: string) => {
    setUserSearchTerm(query);
    if (!query.trim() || query.length < 2) {
      setUserSearchResults([]);
      return;
    }

    try {
      setIsSearchingUsers(true);
      const res = await apiClient.get<ApiResponse<{ users: any[] }>>('/admin/users', {
        params: { search: query.trim(), limit: 5 },
      });
      if (res.data.success) {
        setUserSearchResults(res.data.data.users);
      }
    } catch {
      setUserSearchResults([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleManualVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToVerify) {
      setError('Please select a user to manually verify.');
      return;
    }
    if (!manualReason.trim()) {
      setError('A verification justification note is required.');
      return;
    }

    try {
      setIsSubmittingManualVerify(true);
      setError(null);
      const res = await apiClient.patch<ApiResponse<any>>(`/admin/users/${selectedUserToVerify.id}/verify`, {
        isKycVerified: manualKyc,
        isEmailVerified: manualEmail,
        isPhoneVerified: manualPhone,
        documentType: manualDocType,
        documentNumber: manualDocNumber.trim() || undefined,
        reason: manualReason.trim(),
      });

      if (res.data.success) {
        setSuccessMsg(`User ${selectedUserToVerify.email} has been manually verified successfully.`);
        fetchDashboardMetrics();
        fetchKycSubmissions(1);
        setManualVerifyOpen(false);
        setSelectedUserToVerify(null);
        setUserSearchTerm('');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmittingManualVerify(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Identity Verification & KYC Compliance
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Verify Nigerian statutory identity documents (NIN, BVN, Driver's License, Voter's Card, Passport) and perform manual user verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setSelectedUserToVerify(null);
              setUserSearchTerm('');
              setUserSearchResults([]);
              setManualVerifyOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Manually Verify Any User
          </Button>
          <Badge variant="purple" size="md">
            Queue: {meta.total} records
          </Badge>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'PENDING', label: 'Pending Review' },
            { key: 'APPROVED', label: 'Approved & Verified' },
            { key: 'REJECTED', label: 'Rejected Submissions' },
            { key: 'ALL', label: 'All Records' },
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

        {/* Secondary Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchKycSubmissions(1)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
            />
          </div>

          <select
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)}
            aria-label="Document Type Filter"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
          >
            <option value="ALL">All Document Types</option>
            <option value="NIN">National Identity Number (NIN)</option>
            <option value="BVN">Bank Verification Number (BVN)</option>
            <option value="DRIVERS_LICENSE">Driver's License</option>
            <option value="VOTERS_CARD">Voter's Card</option>
            <option value="INTERNATIONAL_PASSPORT">International Passport</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Identification Number</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading identity verification records...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    No KYC submissions matching current filters.
                  </td>
                </tr>
              ) : (
                submissions.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={k.user?.avatarUrl}
                          name={k.user?.email || 'User'}
                          size="sm"
                        />
                        <div>
                          <p className="font-bold text-white">{k.user?.email}</p>
                          <span className="text-[10px] text-purple-400">{k.user?.role}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-200">{k.documentType}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-purple-300">
                      {k.documentNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          k.status === 'APPROVED'
                            ? 'success'
                            : k.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {k.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {formatDate(k.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInspector(k)}
                        className="font-bold text-xs"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect Dossier
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
            Showing page <strong className="text-white">{meta.page}</strong> of{' '}
            <strong className="text-white">{meta.totalPages || 1}</strong> ({meta.total} records)
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchKycSubmissions(meta.page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchKycSubmissions(meta.page + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Verify Any User Modal */}
      <Modal
        isOpen={manualVerifyOpen}
        onClose={() => setManualVerifyOpen(false)}
        title="Admin Manual User Verification"
      >
        <form onSubmit={handleManualVerifySubmit} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Directly search and verify any user on the platform with administrative compliance approval.
          </p>

          {/* User Search Input */}
          {!selectedUserToVerify ? (
            <div className="space-y-2">
              <label className="block font-bold text-slate-300">Search User by Email or Phone</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type email to search..."
                  value={userSearchTerm}
                  onChange={(e) => searchUsersForManualVerify(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              {isSearchingUsers && (
                <p className="text-[11px] text-purple-400">Searching accounts...</p>
              )}

              {userSearchResults.length > 0 && (
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                  {userSearchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserToVerify(u)}
                      className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-900 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-white">{u.email}</p>
                        <span className="text-[10px] text-slate-400">{u.role} • {u.phoneNumber || 'No phone'}</span>
                      </div>
                      <Badge variant={u.isKycVerified ? 'success' : 'default'} size="sm">
                        {u.isKycVerified ? 'KYC Verified' : 'No KYC'}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase">Selected Target User</span>
                <p className="font-bold text-white text-sm">{selectedUserToVerify.email}</p>
                <p className="text-[11px] text-slate-400">{selectedUserToVerify.role} • ID: {selectedUserToVerify.id.slice(0, 8)}...</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedUserToVerify(null)}
              >
                Change
              </Button>
            </div>
          )}

          {selectedUserToVerify && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-white flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    <span>KYC Identity Verified (NIN / BVN Status)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={manualKyc}
                    onChange={(e) => setManualKyc(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>Email Address Verified</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={manualEmail}
                    onChange={(e) => setManualEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-400" />
                    <span>Phone Number Verified</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={manualPhone}
                    onChange={(e) => setManualPhone(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                  />
                </label>
              </div>

              {manualKyc && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Identity Document Type</label>
                    <select
                      value={manualDocType}
                      onChange={(e) => setManualDocType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                    >
                      <option value="NIN">National Identity Number (NIN)</option>
                      <option value="BVN">Bank Verification Number (BVN)</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                      <option value="VOTERS_CARD">Voter's Card</option>
                      <option value="INTERNATIONAL_PASSPORT">International Passport</option>
                    </select>
                  </div>

                  <Input
                    label="Document Number (Optional)"
                    placeholder="e.g. 12345678901"
                    value={manualDocNumber}
                    onChange={(e) => setManualDocNumber(e.target.value)}
                  />
                </div>
              )}

              <Textarea
                label="Verification Justification Note (Required)"
                placeholder="Document administrative audit details..."
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                required
                rows={2}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualVerifyOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingManualVerify}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Confirm & Verify User
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* KYC Inspector Modal */}
      {selectedKyc && (
        <Modal
          isOpen={inspectorModalOpen}
          onClose={() => setInspectorModalOpen(false)}
          title={`KYC Dossier: ${selectedKyc.user?.email}`}
        >
          <div className="space-y-4 text-xs">
            {/* User Meta Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{selectedKyc.user?.email}</p>
                <p className="text-slate-400 font-mono">
                  {selectedKyc.documentType} • #{selectedKyc.documentNumber}
                </p>
              </div>
              <Badge
                variant={
                  selectedKyc.status === 'APPROVED'
                    ? 'success'
                    : selectedKyc.status === 'REJECTED'
                    ? 'danger'
                    : 'warning'
                }
              >
                {selectedKyc.status}
              </Badge>
            </div>

            {/* Document Image Lightbox & Switcher */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {selectedKyc.documentFrontUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(selectedKyc.documentFrontUrl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      previewImage === selectedKyc.documentFrontUrl
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Front Document
                  </button>
                )}
                {selectedKyc.documentBackUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(selectedKyc.documentBackUrl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      previewImage === selectedKyc.documentBackUrl
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Back Document
                  </button>
                )}
                {selectedKyc.selfieUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(selectedKyc.selfieUrl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      previewImage === selectedKyc.selfieUrl
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Selfie Photo
                  </button>
                )}
              </div>

              {previewImage && (
                <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center min-h-[220px] max-h-[300px]">
                  <img
                    src={previewImage}
                    alt="Document preview"
                    className="max-h-[280px] w-auto object-contain rounded-xl"
                  />
                  <a
                    href={previewImage}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-purple-600 text-white rounded-lg backdrop-blur-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Rejection Justification Field */}
            {selectedKyc.status === 'PENDING' && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <Textarea
                  label="Rejection Reason (If rejecting)"
                  placeholder="e.g. Blurred document photograph, expired identification, mismatch in name..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    isLoading={isProcessing}
                    onClick={() => handleReviewAction('REJECTED')}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject Submission
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    isLoading={isProcessing}
                    onClick={() => handleReviewAction('APPROVED')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve & Verify Identity
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
