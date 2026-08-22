import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Building,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Upload,
  Trash2,
  Sparkles,
  Wallet as WalletIcon,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';

export const ClientProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const profile = user?.clientProfile;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [state, setState] = useState('Lagos');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setCompanyName(profile.companyName || '');
      setState(profile.state || 'Lagos');
      setCity(profile.city || '');
      setAddress(profile.address || '');
    }
    if (user?.walletAddress) {
      setWalletAddress(user.walletAddress);
    }
  }, [profile, user]);

  // 1. Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      setSuccessMessage('');
      const { data } = await apiClient.patch('/profiles/client', {
        firstName,
        lastName,
        companyName: companyName || undefined,
        state,
        city,
        address: address || undefined,
      });
      return data.data.clientProfile;
    },
    onSuccess: (updatedClientProfile) => {
      updateUser({ clientProfile: updatedClientProfile });
      setSuccessMessage('Profile updated successfully.');
    },
    onError: (err) => {
      setErrorMessage(getErrorMessage(err));
    },
  });

  // 2. Update Monad Wallet Address Mutation
  const updateWalletMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage('');
      setSuccessMessage('');
      const { data } = await apiClient.patch('/profiles/wallet-address', {
        walletAddress,
      });
      return data.data;
    },
    onSuccess: () => {
      updateUser({ walletAddress });
      setSuccessMessage('Monad wallet address updated successfully.');
    },
    onError: (err) => {
      setErrorMessage(getErrorMessage(err));
    },
  });

  // 3. Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');

      const { data: uploadData } = await apiClient.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const avatarUrl = uploadData.data.url;
      await apiClient.patch('/profiles/avatar', { avatarUrl });
      updateUser({ avatarUrl });
      setSuccessMessage('Avatar uploaded successfully.');
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  };

  const removeAvatar = async () => {
    try {
      await apiClient.delete('/profiles/avatar');
      updateUser({ avatarUrl: null });
      setSuccessMessage('Avatar removed.');
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  };

  const displayName = firstName ? `${firstName} ${lastName}`.trim() : user?.email;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Client Profile &amp; Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your contact information, company billing details, and Monad Web3 wallet connection.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Card / Avatar */}
      <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <Avatar
            src={user?.avatarUrl}
            name={displayName || 'Client'}
            size="lg"
            className="w-24 h-24 text-2xl"
          />
          <label className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
            <Upload className="w-6 h-6" />
            <input type="file" onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </label>
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {displayName}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400">
              CLIENT
            </span>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-3">
            <span>{user?.email}</span>
            <span>•</span>
            <span>{user?.phoneNumber}</span>
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
            <label className="text-xs font-bold text-sky-600 hover:underline cursor-pointer">
              Upload New Photo
              <input type="file" onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            </label>
            {user?.avatarUrl && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Main Details Form */}
      <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Personal &amp; Company Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company Name (Optional)</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Apex Property Holdings Ltd"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            >
              <option value="Lagos">Lagos</option>
              <option value="Abuja">Abuja (FCT)</option>
              <option value="Rivers">Rivers (Port Harcourt)</option>
              <option value="Oyo">Oyo (Ibadan)</option>
              <option value="Ogun">Ogun</option>
              <option value="Enugu">Enugu</option>
              <option value="Anambra">Anambra</option>
              <option value="Kano">Kano</option>
              <option value="Kaduna">Kaduna</option>
              <option value="Edo">Edo</option>
              <option value="Delta">Delta</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">City / LGA</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Site Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            disabled={updateProfileMutation.isPending}
            onClick={() => updateProfileMutation.mutate()}
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </div>
      </Card>

      {/* Monad Web3 Integration Card */}
      <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-sm font-bold">Monad Blockchain Integration</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Connect your Monad Testnet EVM wallet address to execute on-chain escrow deposits and instant smart contract authorizations.
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            EVM Wallet Address (0x...)
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x1234567890abcdef1234567890abcdef12345678"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            disabled={updateWalletMutation.isPending}
            onClick={() => updateWalletMutation.mutate()}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
          >
            {updateWalletMutation.isPending ? 'Binding...' : 'Update Wallet Address'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
