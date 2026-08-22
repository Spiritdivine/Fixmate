import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Settings,
  Lock,
  Bell,
  Trash2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Shield,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

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
      setSuccessMsg('Password updated successfully.');
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
    },
  });

  // 2. Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!confirm('Are you absolutely certain you want to delete your account? This action cannot be undone.')) {
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
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Account &amp; Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage password security, notification preferences, and account privacy.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Change Password Card */}
      <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
          <Lock className="w-4 h-4 text-sky-500" />
          <span>Change Password</span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            disabled={!currentPassword || !newPassword || changePasswordMutation.isPending}
            onClick={() => changePasswordMutation.mutate()}
          >
            {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </Card>

      {/* Notification Preferences Card */}
      <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
          <Bell className="w-4 h-4 text-sky-500" />
          <span>Notification Preferences</span>
        </div>

        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <label className="flex items-center justify-between pt-2 cursor-pointer">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Email Alerts</p>
              <p className="text-[11px] text-slate-500">Receive email notifications for proposal bids and milestone submissions</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
          </label>

          <label className="flex items-center justify-between pt-3 cursor-pointer">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">SMS Verification Alerts</p>
              <p className="text-[11px] text-slate-500">Critical security and escrow release SMS verification alerts</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
          </label>

          <label className="flex items-center justify-between pt-3 cursor-pointer">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">In-App Notification Sounds</p>
              <p className="text-[11px] text-slate-500">Play subtle sound alerts on instant chat messages</p>
            </div>
            <input
              type="checkbox"
              checked={inAppSound}
              onChange={(e) => setInAppSound(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
            />
          </label>
        </div>
      </Card>

      {/* Danger Zone Card */}
      <Card className="p-6 sm:p-8 border-rose-500/20 bg-rose-50/10 dark:bg-rose-950/10 space-y-4">
        <h3 className="text-sm font-bold text-rose-600">Danger Zone</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Once your account is deleted, your active contracts and wallet balances will be finalized and permanently erased.
        </p>
        <div className="flex justify-start">
          <Button
            size="sm"
            variant="danger"
            onClick={() => deleteAccountMutation.mutate()}
            disabled={deleteAccountMutation.isPending}
          >
            Delete Client Account
          </Button>
        </div>
      </Card>
    </div>
  );
};
