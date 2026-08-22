import React, { useEffect, useState } from 'react';
import {
  Lock,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  LogOut,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { formatDate, formatDateTime } from '../../lib/formatters';
import { useAuthStore } from '../../stores/authStore';

interface Session {
  id: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  expiresAt: string;
  createdAt: string;
}

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const { data } = await apiClient.get('/auth/sessions');
      setSessions(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      await apiClient.patch('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      setPasswordSuccess('Password updated successfully! All other sessions invalidated.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await fetchSessions();
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      await apiClient.delete('/auth/sessions');
      alert('All other logged-in sessions have been revoked.');
      await fetchSessions();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeactivateAccount = async () => {
    if (
      !window.confirm(
        'WARNING: Are you sure you want to deactivate your Fixmate artisan account? Your profile and service offerings will be hidden.'
      )
    )
      return;

    try {
      await apiClient.delete('/profiles/account');
      alert('Account deactivated.');
      logout();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Account Security & Login Sessions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your password credentials, active device tokens, and account status.
        </p>
      </div>

      {/* Password Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-sky-500" />
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Updating your password invalidates all other active login tokens.</CardDescription>
            </div>
          </div>
        </CardHeader>

        {passwordSuccess && (
          <div className="p-3.5 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" size="sm" isLoading={isChangingPassword}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* Active Login Sessions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-purple-500" />
              <div>
                <CardTitle>Active Device Sessions ({sessions.length})</CardTitle>
                <CardDescription>Review all browsers and devices authorized on your account.</CardDescription>
              </div>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRevokeAllOtherSessions}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Log Out Others
              </Button>
            )}
          </div>
        </CardHeader>

        {isLoadingSessions ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading session list...</div>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/80">
            {sessions.map((s, idx) => (
              <div
                key={s.id}
                className="pt-3 first:pt-0 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {s.deviceInfo || 'Standard Web Browser'}
                      </span>
                      {idx === 0 && <Badge variant="emerald">Current Session</Badge>}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      IP: {s.ipAddress || '127.0.0.1'} • Logged in: {formatDateTime(s.createdAt)}
                    </p>
                  </div>
                </div>

                {idx !== 0 && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Revoke session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Danger Zone: Deactivation */}
      <Card className="border-rose-500/30 bg-rose-500/5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Danger Zone: Deactivate Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Soft-deactivating your account unpublishes your artisan profile and cancels all pending invitations.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={handleDeactivateAccount}>
            Deactivate Account
          </Button>
        </div>
      </Card>
    </div>
  );
};
