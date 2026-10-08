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
  
  Wallet as WalletIcon,
  ShieldCheck,
  AlertCircle,
  Copy,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { MONAD_EXPLORER_URL } from '../../lib/monad-web3';

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

  // Copy Address Handler
  const [isCopied, setIsCopied] = useState(false);
  const handleCopyAddress = () => {
    if (!user?.walletAddress) return;
    navigator.clipboard.writeText(user.walletAddress);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-dashboard">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Client Profile &amp; Preferences
        </h1>
        <p className="text-sm text-slate-500">
          Manage your contact information, company billing details, and digital escrow wallet connection.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Profile Card / Avatar */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <Avatar
            src={user?.avatarUrl}
            name={displayName || 'Client'}
            size="lg"
            className="w-24 h-24 text-2xl"
          />
          <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
            <Upload className="w-6 h-6" />
            <input type="file" onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </label>
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 truncate">
              {displayName}
            </h2>
            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-500/20">
              CLIENT
            </span>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-3 font-medium">
            <span>{user?.email}</span>
            <span>•</span>
            <span>{user?.phoneNumber}</span>
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
            <label className="text-xs font-bold text-emerald-800 hover:text-emerald-700 cursor-pointer transition-colors">
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
      </div>

      {/* Main Details Form */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Personal &amp; Company Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-slate-900 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-slate-900 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Company Name (Optional)</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Apex Property Holdings Ltd"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-slate-900 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-slate-900 outline-none transition-all"
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

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">City / LGA</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-slate-900 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Default Site Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 text-slate-900 outline-none transition-all"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={updateProfileMutation.isPending}
            onClick={() => updateProfileMutation.mutate()}
            className="px-7 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-900/10 transition-all disabled:opacity-50"
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </div>

      {/* Monad Web3 Integration Card (Read-Only Permanent Privy Embedded Wallet) */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-purple-700">
            <WalletIcon className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold">Digital Escrow Account</h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Privy Embedded
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed font-normal">
          This is your permanent, self-custodial escrow address generated for your account. It is automatically used for milestone funding, approvals, and automated settlements.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Permanent Escrow Account ID
          </label>
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 text-sm font-mono text-slate-800 break-all">
            <span>{user?.walletAddress || 'Provisioning embedded wallet...'}</span>
            {user?.walletAddress && (
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  title="Copy Address"
                >
                  {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={`${MONAD_EXPLORER_URL}/address/${user.walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-purple-700 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  title="View On-Chain Receipt"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
