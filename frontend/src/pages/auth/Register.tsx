import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Wallet, Sparkles } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { useUnifiedWallet } from '../../lib/privy-provider';
import { ApiResponse, AuthResponse } from '../../types';
import { trackEvent } from '../../lib/posthog';

export const Register: React.FC = () => {
  const [role, setRole] = useState<'CLIENT' | 'ARTISAN'>('CLIENT');
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const { address: preconnectedWallet, createEmbeddedWallet } = useUnifiedWallet();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload: any = {
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        role,
      };

      if (preconnectedWallet) {
        payload.walletAddress = preconnectedWallet;
      }

      const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        payload
      );

      const accessToken = data.data.tokens?.accessToken;
      const refreshToken = data.data.tokens?.refreshToken;
      const user = data.data.user;

      login(accessToken, refreshToken, user);
      trackEvent('account_registered', { role });

      // Automatically provision or link embedded non-custodial wallet on Monad
      if (!user?.walletAddress && !preconnectedWallet) {
        createEmbeddedWallet().catch((walletErr) => {
          console.warn('[Register] Embedded wallet auto-provision deferred to post-login:', walletErr);
        });
      }

      // Navigate immediately to email verification page
      navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim())}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <h1
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
          >
            Create your account
          </h1>
          <p
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-sm text-stone-500"
          >
            Already with us?{' '}
            <Link
              to="/login"
              className="font-bold text-stone-900 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Minimalist Role Selector */}
        <div className="p-1 rounded-full bg-stone-100 border border-stone-200 grid grid-cols-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`py-2 px-3 rounded-full transition-all text-center cursor-pointer ${
              role === 'CLIENT'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            I want to Hire
          </button>
          <button
            type="button"
            onClick={() => setRole('ARTISAN')}
            className={`py-2 px-3 rounded-full transition-all text-center cursor-pointer ${
              role === 'ARTISAN'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            I am an Artisan
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Email Address */}
          <AuthInput
            label="Work email"
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            autoComplete="email"
          />

          {/* Phone Number */}
          <AuthInput
            label="Phone number"
            type="tel"
            placeholder="08012345678"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            required
            autoComplete="tel"
          />

          {/* Password */}
          <AuthInput
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            helperText="Use 8+ characters with a number and a symbol"
            required
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <AuthInput
            label="Confirm password"
            type="password"
            placeholder="Repeat it"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            error={
              formData.confirmPassword &&
              formData.password !== formData.confirmPassword
                ? 'Passwords do not match'
                : undefined
            }
            required
            autoComplete="new-password"
          />

          {/* Monad Embedded Wallet Trust Callout */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
            <div className="w-6 h-6 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-700 shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 leading-snug">
              <span className="font-semibold text-emerald-950">Automated Monad Escrow Wallet:</span>{' '}
              {preconnectedWallet ? (
                <>
                  Pre-connected wallet{' '}
                  <span className="font-mono text-[11px] font-semibold">
                    {preconnectedWallet.slice(0, 6)}...{preconnectedWallet.slice(-4)}
                  </span>{' '}
                  will be bound to your account.
                </>
              ) : (
                <>A secure non-custodial embedded wallet is automatically generated and secured for your account.</>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-full bg-[#cbf7d2] hover:bg-[#bcf0c5] active:bg-[#b0ebb9] text-[#153e2d] font-semibold text-sm sm:text-base transition-all duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#153e2d]" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer Disclaimer */}
        <p className="text-xs text-center text-stone-400 leading-relaxed pt-2">
          By signing up you agree to our{' '}
          <a
            href="#"
            className="underline hover:text-stone-600 transition-colors"
          >
            terms of use
          </a>{' '}
          and{' '}
          <a
            href="#"
            className="underline hover:text-stone-600 transition-colors"
          >
            privacy policy
          </a>
          .
        </p>
      </div>
    </AuthLayout>
  );
};
