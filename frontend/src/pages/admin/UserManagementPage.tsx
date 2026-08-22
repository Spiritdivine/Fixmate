import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UserX,
  UserCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  BadgeCheck,
  Phone,
  Mail,
  FileCheck,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, User, PaginationMeta, UserRole, AccountStatus } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';

export const UserManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [kycFilter, setKycFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status Moderation Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetStatus, setTargetStatus] = useState<AccountStatus>('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Manual Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState<User | null>(null);
  const [verifyKyc, setVerifyKyc] = useState(true);
  const [verifyEmail, setVerifyEmail] = useState(true);
  const [verifyPhone, setVerifyPhone] = useState(true);
  const [verifyDocType, setVerifyDocType] = useState('NIN');
  const [verifyDocNumber, setVerifyDocNumber] = useState('');
  const [verifyReason, setVerifyReason] = useState('');
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  const fetchUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit: 15 };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (kycFilter !== 'ALL') params.kycStatus = kycFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await apiClient.get<ApiResponse<{ users: User[]; meta: PaginationMeta }>>('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.data.users);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter, kycFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const openStatusModal = (user: User, status: AccountStatus) => {
    setSelectedUser(user);
    setTargetStatus(status);
    setStatusReason('');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!statusReason.trim()) {
      setError('A justification note is required for the audit trail.');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      setError(null);
      const res = await apiClient.patch<ApiResponse<User>>(`/admin/users/${selectedUser.id}/status`, {
        status: targetStatus,
        reason: statusReason.trim(),
      });

      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, status: targetStatus } : u))
        );
        setSuccessMsg(`User ${selectedUser.email} status updated to ${targetStatus}`);
        setStatusModalOpen(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openVerifyModal = (user: User) => {
    setVerifyingUser(user);
    setVerifyKyc(!user.isKycVerified);
    setVerifyEmail(user.isEmailVerified);
    setVerifyPhone(user.isPhoneVerified);
    setVerifyDocType('NIN');
    setVerifyDocNumber('');
    setVerifyReason('Manual administrative compliance review and identity approval');
    setVerifyModalOpen(true);
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingUser) return;
    if (!verifyReason.trim()) {
      setError('A verification justification note is required.');
      return;
    }

    try {
      setIsSubmittingVerify(true);
      setError(null);
      const res = await apiClient.patch<ApiResponse<User>>(`/admin/users/${verifyingUser.id}/verify`, {
        isKycVerified: verifyKyc,
        isEmailVerified: verifyEmail,
        isPhoneVerified: verifyPhone,
        documentType: verifyDocType,
        documentNumber: verifyDocNumber.trim() || undefined,
        reason: verifyReason.trim(),
      });

      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === verifyingUser.id
              ? {
                  ...u,
                  isKycVerified: verifyKyc,
                  isEmailVerified: verifyEmail,
                  isPhoneVerified: verifyPhone,
                }
              : u
          )
        );
        setSuccessMsg(`User ${verifyingUser.email} verification settings updated successfully.`);
        setVerifyModalOpen(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            User Directory & Account Moderation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage Artisan profiles, Client accounts, manual KYC identity verification, and suspension states.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            Total Users: {meta.total}
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

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'ARTISAN', 'CLIENT', 'ADMIN', 'SUPPORT'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                roleFilter === r
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search email, phone, business name, or Monad wallet address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white text-[11px] font-bold rounded-lg transition-colors"
            >
              Search
            </button>
          </form>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Account Status Filter"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="SUSPENDED">Suspended Accounts</option>
            <option value="DEACTIVATED">Deactivated Accounts</option>
          </select>

          {/* KYC Status Dropdown */}
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            aria-label="KYC Status Filter"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-purple-500"
          >
            <option value="ALL">All KYC States</option>
            <option value="VERIFIED">KYC Verified</option>
            <option value="UNVERIFIED">KYC Unverified</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Verifications</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Querying user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    No users matching current filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const displayName =
                    u.role === 'ARTISAN'
                      ? u.artisanProfile?.businessName || u.email
                      : u.role === 'CLIENT'
                      ? `${u.clientProfile?.firstName || ''} ${u.clientProfile?.lastName || ''}`.trim() || u.email
                      : u.email;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Avatar & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={u.avatarUrl}
                            name={displayName}
                            size="sm"
                            className="ring-1 ring-slate-700"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/admin/users/${u.id}`}
                              className="font-bold text-white hover:text-purple-400 transition-colors truncate block max-w-[200px]"
                            >
                              {displayName}
                            </Link>
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                              {u.email}
                            </p>
                            {u.phoneNumber && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                {u.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.role === 'ARTISAN'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : u.role === 'CLIENT'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            u.status === 'ACTIVE'
                              ? 'success'
                              : u.status === 'SUSPENDED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {u.status}
                        </Badge>
                      </td>

                      {/* Verifications Stack */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {u.isKycVerified ? (
                            <span
                              title="KYC Verified"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold"
                            >
                              <BadgeCheck className="w-3 h-3" />
                              KYC
                            </span>
                          ) : (
                            <span
                              title="KYC Pending / Unverified"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]"
                            >
                              No KYC
                            </span>
                          )}

                          {u.isEmailVerified && (
                            <span
                              title="Email Verified"
                              className="p-1 rounded bg-blue-500/10 text-blue-400"
                            >
                              <Mail className="w-3 h-3" />
                            </span>
                          )}
                          {u.isPhoneVerified && (
                            <span
                              title="Phone Verified"
                              className="p-1 rounded bg-purple-500/10 text-purple-400"
                            >
                              <Phone className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Wallet Balance */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">
                          {formatCurrency(u.wallet?.availableBalance || 0)}
                        </p>
                        {Number(u.wallet?.escrowLockedBalance || 0) > 0 && (
                          <p className="text-[10px] text-purple-400">
                            {formatCurrency(u.wallet?.escrowLockedBalance || 0)} locked
                          </p>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link to={`/admin/users/${u.id}`}>
                            <button
                              title="View Full Profile & Dossier"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </Link>

                          {/* Manual Verification Button */}
                          <button
                            onClick={() => openVerifyModal(u)}
                            title="Manually Verify User / Manage Badges"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-purple-400 hover:text-white transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          {u.status === 'ACTIVE' ? (
                            <button
                              onClick={() => openStatusModal(u, 'SUSPENDED')}
                              title="Suspend User Account"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => openStatusModal(u, 'ACTIVE')}
                              title="Reactivate User Account"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3.5 px-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing page <strong className="text-white">{meta.page}</strong> of{' '}
            <strong className="text-white">{meta.totalPages || 1}</strong> ({meta.total} users)
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchUsers(meta.page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchUsers(meta.page + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Verification Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title={`Manual Compliance Verification: ${verifyingUser?.email}`}
      >
        <form onSubmit={handleManualVerify} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Administratively grant or update compliance verification badges for this user account.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-bold text-white flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span>KYC Identity Verified (NIN / BVN Status)</span>
              </span>
              <input
                type="checkbox"
                checked={verifyKyc}
                onChange={(e) => setVerifyKyc(e.target.checked)}
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
                checked={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.checked)}
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
                checked={verifyPhone}
                onChange={(e) => setVerifyPhone(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
              />
            </label>
          </div>

          {verifyKyc && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Identity Document Type</label>
                <select
                  value={verifyDocType}
                  onChange={(e) => setVerifyDocType(e.target.value)}
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
                label="Document Identification Number"
                placeholder="e.g. 12345678901 or leave blank for auto"
                value={verifyDocNumber}
                onChange={(e) => setVerifyDocNumber(e.target.value)}
              />
            </div>
          )}

          <Textarea
            label="Administrative Verification Justification (Mandatory Audit Trail)"
            placeholder="e.g. Physical office audit conducted, verified with government NIN database, manual phone verification confirmed..."
            value={verifyReason}
            onChange={(e) => setVerifyReason(e.target.value)}
            required
            rows={2}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setVerifyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmittingVerify}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              Save Verification Badges
            </Button>
          </div>
        </form>
      </Modal>

      {/* Account Status Moderation Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={targetStatus === 'SUSPENDED' ? 'Suspend User Account' : 'Reactivate User Account'}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <p className="text-xs text-slate-300">
            You are about to set status of{' '}
            <strong className="text-white">{selectedUser?.email}</strong> to{' '}
            <Badge variant={targetStatus === 'ACTIVE' ? 'success' : 'danger'}>{targetStatus}</Badge>.
          </p>

          <Textarea
            label="Mandatory Audit Trail Justification"
            placeholder="Specify reason for moderation action (e.g. Terms of Service violation, verification dispute, security review)..."
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            required
            rows={3}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isUpdatingStatus}
              className={
                targetStatus === 'SUSPENDED'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
            >
              Confirm State Change
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
