import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Lock,
  Bell,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  BellRing,
  Smartphone,
  Mail,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';

export const ClientSettingsPage: React.FC = () => {
  const { logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [inAppSound, setInAppSound] = useState(true);

  // 1. Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg('');
      setSuccessMsg('');
      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirmation do not match.');
      }
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }
      await apiClient.patch('/auth/change-password', {
        oldPassword: currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Password updated successfully. Other active sessions were invalidated.');
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  // 2. Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!confirm('Are you absolutely certain you want to delete your Artifix client account? This action cannot be undone.')) {
        return;
      }
      await apiClient.delete('/profiles/account');
    },
    onSuccess: () => {
      logout();
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  return (
    <div className="font-dashboard max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          Account &amp; Security
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Settings &amp; Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your Artifix credentials, escrow security alerts, and notification preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Change Password Card */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-800 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">Updating your password invalidates all other active login tokens across devices.</p>
          </div>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Current Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={!currentPassword || !newPassword || changePasswordMutation.isPending}
            onClick={() => changePasswordMutation.mutate()}
            className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-emerald-900/10 transition-all active:scale-95"
          >
            {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-800 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Notification Channels</h2>
            <p className="text-xs text-slate-500">Configure how Artifix notifies you regarding bids, escrow events, and milestone releases.</p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-slate-100">
          <label className="flex items-center justify-between pt-3 cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-500">Receive instant email alerts for proposals, contract signatures, and milestone reviews.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between pt-4 cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">SMS Verification Alerts</p>
                <p className="text-xs text-slate-500">Receive high-priority SMS security alerts for escrow milestone fund releases and OTPs.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between pt-4 cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">In-App Chat Sounds</p>
                <p className="text-xs text-slate-500">Play subtle acoustic alerts when artisans message in your active contract chat.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={inAppSound}
              onChange={(e) => setInAppSound(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-800 focus:ring-emerald-700 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Escrow & Blockchain Security Note */}
      <div className="bg-emerald-900 text-white rounded-[24px] p-6 sm:p-8 relative overflow-hidden shadow-lg shadow-emerald-950/20">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-300" />
              <span>Artifix Security Shield</span>
            </div>
            <h3 className="text-lg font-bold text-white">Monad Smart Contract &amp; Vault Protection</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              All deposited funds remain secured in non-custodial or audited on-chain smart escrow accounts until you explicitly inspect and authorize milestone approvals.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-800/60 border border-emerald-700/50 backdrop-blur-sm text-center shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block">Status</span>
            <span className="text-sm font-black text-white flex items-center justify-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Secure
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="bg-white rounded-[24px] border border-rose-200/80 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-700">Danger Zone</h3>
            <p className="text-xs text-slate-500">
              Irreversible account termination.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Deleting your account permanently closes all non-active contracts, cancels open listings, and disables your client wallet profile.
        </p>
        <div className="flex justify-start pt-2">
          <button
            type="button"
            onClick={() => deleteAccountMutation.mutate()}
            disabled={deleteAccountMutation.isPending}
            className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {deleteAccountMutation.isPending ? 'Deactivating...' : 'Delete Client Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
