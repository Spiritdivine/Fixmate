import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  UserX,
  UserCheck,
  Briefcase,
  FileText,
  CreditCard,
  Building,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  MapPin,
  Calendar,
  Phone,
  Mail,
  BadgeCheck,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ApiResponse, AccountStatus } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'kyc' | 'contracts' | 'reviews' | 'audit'>('profile');

  // Status Moderation Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<AccountStatus>('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Manual Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyKyc, setVerifyKyc] = useState(true);
  const [verifyEmail, setVerifyEmail] = useState(true);
  const [verifyPhone, setVerifyPhone] = useState(true);
  const [verifyDocType, setVerifyDocType] = useState('NIN');
  const [verifyDocNumber, setVerifyDocNumber] = useState('');
  const [verifyReason, setVerifyReason] = useState('');
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  const fetchUserDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<ApiResponse<any>>(`/admin/users/${id}`);
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (!statusReason.trim()) {
      setError('A justification note is required for the audit trail.');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      setError(null);
      const res = await apiClient.patch<ApiResponse<any>>(`/admin/users/${id}/status`, {
        status: targetStatus,
        reason: statusReason.trim(),
      });

      if (res.data.success) {
        setUser((prev: any) => ({ ...prev, status: targetStatus }));
        setSuccessMsg(`User status updated to ${targetStatus}`);
        setStatusModalOpen(false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openVerifyModal = () => {
    if (!user) return;
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
    if (!user || !id) return;
    if (!verifyReason.trim()) {
      setError('A verification justification note is required.');
      return;
    }

    try {
      setIsSubmittingVerify(true);
      setError(null);
      const res = await apiClient.patch<ApiResponse<any>>(`/admin/users/${id}/verify`, {
        isKycVerified: verifyKyc,
        isEmailVerified: verifyEmail,
        isPhoneVerified: verifyPhone,
        documentType: verifyDocType,
        documentNumber: verifyDocNumber.trim() || undefined,
        reason: verifyReason.trim(),
      });

      if (res.data.success) {
        setUser((prev: any) => ({
          ...prev,
          isKycVerified: verifyKyc,
          isEmailVerified: verifyEmail,
          isPhoneVerified: verifyPhone,
        }));
        setSuccessMsg('User verification badges updated successfully.');
        setVerifyModalOpen(false);
        fetchUserDetails(); // Refresh to include new KYC record in tab
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs uppercase font-bold tracking-wider">Loading user profile dossier...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="font-bold text-white">User dossier not found.</p>
        <Link to="/admin/users" className="text-xs text-purple-400 hover:underline mt-2 inline-block">
          Return to user directory
        </Link>
      </div>
    );
  }

  const displayName =
    user.role === 'ARTISAN'
      ? user.artisanProfile?.businessName || user.email
      : user.role === 'CLIENT'
      ? `${user.clientProfile?.firstName || ''} ${user.clientProfile?.lastName || ''}`.trim() || user.email
      : user.email;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to User Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Manual Verification Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={openVerifyModal}
            className="border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white"
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Manage Verification Badges
          </Button>

          {user.status === 'ACTIVE' ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setTargetStatus('SUSPENDED');
                setStatusReason('');
                setStatusModalOpen(true);
              }}
              leftIcon={<UserX className="w-4 h-4" />}
            >
              Suspend Account
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setTargetStatus('ACTIVE');
                setStatusReason('');
                setStatusModalOpen(true);
              }}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Reactivate Account
            </Button>
          )}
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

      {/* User Hero Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} name={displayName} size="xl" className="ring-2 ring-purple-500/40" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <Badge
                variant={
                  user.status === 'ACTIVE'
                    ? 'success'
                    : user.status === 'SUSPENDED'
                    ? 'danger'
                    : 'warning'
                }
                size="sm"
              >
                {user.status}
              </Badge>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-400">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{user.email} • {user.phoneNumber}</p>

            <div className="flex items-center gap-2 mt-2">
              {user.isKycVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  KYC Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                  KYC Unverified
                </span>
              )}

              {user.isEmailVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px]">
                  <Mail className="w-3 h-3" />
                  Email Verified
                </span>
              )}

              {user.isPhoneVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px]">
                  <Phone className="w-3 h-3" />
                  Phone Verified
                </span>
              )}
            </div>

            {user.walletAddress && (
              <p className="text-[11px] text-purple-400 font-mono mt-2 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>Monad Wallet: {user.walletAddress}</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Available Balance</span>
            <p className="text-lg font-black text-purple-400">{formatCurrency(user.wallet?.availableBalance || 0)}</p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Escrow Locked</span>
            <p className="text-lg font-black text-slate-200">{formatCurrency(user.wallet?.escrowLockedBalance || 0)}</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none text-xs font-bold">
        {[
          { key: 'profile', label: 'Dossier & Bio' },
          { key: 'wallet', label: 'Financial Wallet & Banks' },
          { key: 'kyc', label: `KYC Records (${user.kycSubmissions?.length || 0})` },
          { key: 'contracts', label: 'Contracts & Jobs' },
          { key: 'reviews', label: 'Feedback & Ratings' },
          { key: 'audit', label: 'Audit Trail' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl transition-colors shrink-0 ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Artisan Profile Details */}
          {user.role === 'ARTISAN' && user.artisanProfile && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Artisan Business Profile</h3>
              <p className="text-slate-300">{user.artisanProfile.bio || 'No bio provided.'}</p>
              <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-400">
                <p>Location: <strong className="text-white">{user.artisanProfile.city}, {user.artisanProfile.state}</strong></p>
                <p>Hourly Rate: <strong className="text-purple-400">{formatCurrency(user.artisanProfile.hourlyRate || 0)}/hr</strong></p>
                <p>Experience: <strong className="text-white">{user.artisanProfile.yearsOfExperience || 0} Years</strong></p>
                <p>Available for hire: <strong className={user.artisanProfile.isAvailable ? 'text-emerald-400' : 'text-slate-500'}>{user.artisanProfile.isAvailable ? 'Yes' : 'No'}</strong></p>
              </div>

              {/* Skills */}
              {user.artisanProfile.skills && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="font-bold text-slate-400 block mb-1.5">Trade Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.artisanProfile.skills.map((s: any) => (
                      <span key={s.id} className="px-2 py-0.5 rounded-md bg-slate-950 text-purple-300 border border-slate-800 text-[10px]">
                        {s.skill?.name || s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Client Profile Details */}
          {user.role === 'CLIENT' && user.clientProfile && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Client Personal Profile</h3>
              <div className="space-y-1 text-slate-400">
                <p>Name: <strong className="text-white">{user.clientProfile.firstName} {user.clientProfile.lastName}</strong></p>
                <p>Company / Org: <strong className="text-white">{user.clientProfile.companyName || 'Individual'}</strong></p>
                <p>Address: <strong className="text-white">{user.clientProfile.address || 'N/A'}, {user.clientProfile.city}</strong></p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Account System Metadata</h3>
            <div className="space-y-1.5 text-slate-400 font-mono text-[11px]">
              <p>User ID: <span className="text-slate-200">{user.id}</span></p>
              <p>Registered Date: <span className="text-slate-200">{formatDate(user.createdAt)}</span></p>
              <p>Last Login: <span className="text-slate-200">{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Wallet */}
      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Linked Bank Accounts</h3>
            {(!user.bankAccounts || user.bankAccounts.length === 0) ? (
              <p className="text-xs text-slate-500">No bank accounts linked.</p>
            ) : (
              <div className="space-y-2">
                {user.bankAccounts.map((b: any) => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{b.bankName}</p>
                      <p className="text-slate-400 font-mono">{b.accountNumber} ({b.accountName})</p>
                    </div>
                    {b.isDefault && (
                      <Badge variant="purple" size="sm">Default</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
            {(!user.wallet?.transactions || user.wallet.transactions.length === 0) ? (
              <p className="text-xs text-slate-500">No transactions recorded.</p>
            ) : (
              <div className="space-y-2">
                {user.wallet.transactions.map((tx: any) => (
                  <div key={tx.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{tx.description}</p>
                      <p className="text-[11px] text-slate-400 font-mono">Ref: {tx.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-400">{formatCurrency(tx.amount)}</p>
                      <Badge variant={tx.status === 'SUCCESS' ? 'success' : 'default'} size="sm">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: KYC */}
      {activeTab === 'kyc' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">KYC Verification Submissions</h3>
            <Button
              size="sm"
              onClick={openVerifyModal}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Manually Grant / Update KYC
            </Button>
          </div>

          {(!user.kycSubmissions || user.kycSubmissions.length === 0) ? (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-xs text-slate-400">No formal KYC document submissions on record for this user.</p>
              <Button size="sm" variant="outline" onClick={openVerifyModal}>
                Manually Verify This User
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {user.kycSubmissions.map((k: any) => (
                <div key={k.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{k.documentType} Verification</span>
                      <p className="text-slate-400 font-mono">Doc #{k.documentNumber}</p>
                    </div>
                    <Badge variant={k.status === 'APPROVED' ? 'success' : k.status === 'REJECTED' ? 'danger' : 'warning'}>
                      {k.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {k.documentFrontUrl && (
                      <a href={k.documentFrontUrl} target="_blank" rel="noreferrer" className="block p-2 rounded-lg bg-slate-900 border border-slate-800 text-center hover:border-purple-500 text-purple-400">
                        View Front Document
                      </a>
                    )}
                    {k.documentBackUrl && (
                      <a href={k.documentBackUrl} target="_blank" rel="noreferrer" className="block p-2 rounded-lg bg-slate-900 border border-slate-800 text-center hover:border-purple-500 text-purple-400">
                        View Back Document
                      </a>
                    )}
                    {k.selfieUrl && (
                      <a href={k.selfieUrl} target="_blank" rel="noreferrer" className="block p-2 rounded-lg bg-slate-900 border border-slate-800 text-center hover:border-purple-500 text-purple-400">
                        View Verification Selfie
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Contracts & Jobs */}
      {activeTab === 'contracts' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Contracts History</h3>
          {(!user.contractsAsArtisan?.length && !user.contractsAsClient?.length) ? (
            <p className="text-xs text-slate-500">No contract records found.</p>
          ) : (
            <div className="space-y-2">
              {[...(user.contractsAsArtisan || []), ...(user.contractsAsClient || [])].map((c: any) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-white">#{c.contractCode}</span>
                    <p className="text-slate-400">{c.title || 'Contract'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-purple-400">{formatCurrency(c.totalAmount)}</span>
                    <Badge variant={c.status === 'COMPLETED' ? 'success' : 'default'} size="sm">
                      {c.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Reviews */}
      {activeTab === 'reviews' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Reviews & Feedback</h3>
          {(!user.reviewsReceived || user.reviewsReceived.length === 0) ? (
            <p className="text-xs text-slate-500">No reviews received.</p>
          ) : (
            <div className="space-y-2">
              {user.reviewsReceived.map((r: any) => (
                <div key={r.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">★ {r.overallRating} / 5</span>
                    <Badge variant={r.isPublic ? 'success' : 'default'} size="sm">
                      {r.isPublic ? 'Public' : 'Hidden'}
                    </Badge>
                  </div>
                  <p className="text-slate-300">"{r.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Administrator Audit Trail</h3>
          {(!user.auditLogs || user.auditLogs.length === 0) ? (
            <p className="text-xs text-slate-500">No recorded administrative actions.</p>
          ) : (
            <div className="space-y-2">
              {user.auditLogs.map((l: any) => (
                <div key={l.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-300">{l.action}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{formatDate(l.createdAt)}</span>
                  </div>
                  {l.newState?.reason && (
                    <p className="text-slate-400">Reason: {l.newState.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Verification Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title={`Manual Compliance Verification: ${user.email}`}
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
            placeholder="e.g. Physical trade audit conducted, verified with government NIN database, phone interview passed..."
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

      {/* Status Moderation Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={targetStatus === 'SUSPENDED' ? 'Suspend User Account' : 'Reactivate User Account'}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <p className="text-xs text-slate-300">
            Set status of <strong className="text-white">{user.email}</strong> to{' '}
            <Badge variant={targetStatus === 'ACTIVE' ? 'success' : 'danger'}>{targetStatus}</Badge>.
          </p>

          <Textarea
            label="Mandatory Justification Note"
            placeholder="Reason for moderation action..."
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            required
            rows={3}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isUpdatingStatus}
              className={targetStatus === 'SUSPENDED' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}
            >
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
