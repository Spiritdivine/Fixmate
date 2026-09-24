import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { ApiResponse, AuthResponse } from '../../types';

export const AdminLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('admin@artisanplatform.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide your admin email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
        email: identifier.trim(),
        identifier: identifier.trim(),
        password,
      });

      if (data.data.user.role !== 'ADMIN' && data.data.user.role !== 'SUPPORT') {
        setError('Unauthorized: This portal is strictly restricted to Artifix Administrators.');
        return;
      }

      const accessToken = data.data.tokens?.accessToken;
      const refreshToken = data.data.tokens?.refreshToken;
      const user = data.data.user;

      login(accessToken, refreshToken, user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      showcaseTitle={
        <>
          Executive <span className="text-[#34d399]">oversight.</span>
          <br />
          Platform integrity.
        </>
      }
      showcaseSubtitle="Restricted superuser portal for KYC document audits, Monad smart contract escrow arbitration, and financial ledger oversight."
      showcasePills={[
        'Role-Based Access',
        'Monad Escrow Control',
        'Dispute Resolution',
        'Audit Trail',
        'KYC Moderation',
      ]}
      showcaseFooter="Restricted to authorized Artifix compliance and operations staff only."
    >
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900 text-[11px] font-bold text-white mb-1 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SUPERUSER &amp; COMPLIANCE ACCESS</span>
          </div>

          <h1
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
          >
            Admin Authorization
          </h1>
          <p
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-sm text-stone-500"
          >
            Authenticate with your elevated administrative credentials to access platform controls.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <AuthInput
            label="Admin Email Address"
            type="email"
            placeholder="admin@artifix.ng"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
          />

          <AuthInput
            label="Master Password"
            type="password"
            placeholder="Enter administrative password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {/* Audit Notice Box */}
          <div className="p-3 rounded-xl bg-stone-100 border border-stone-200/80 text-[11px] text-stone-600 flex items-start gap-2.5 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            <span>
              All administrator activities, IP addresses, and contract interventions are cryptographically logged to the immutable audit trail.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-full bg-[#123E2A] hover:bg-[#0E3222] active:bg-[#0A2419] text-white font-semibold text-sm sm:text-base transition-all duration-150 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authorizing session...</span>
                </>
              ) : (
                <span>Authorize Admin Session →</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <p className="text-xs text-center text-stone-500 pt-2">
          Looking for customer portal?{' '}
          <Link to="/login" className="font-bold text-stone-900 hover:underline transition-colors">
            Return to User Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
