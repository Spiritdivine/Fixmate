import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
import { apiClient, getErrorMessage } from '../../lib/api-client';

export const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please provide your registered email address or phone number');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      const { data } = await apiClient.post('/auth/forgot-password', {
        identifier: identifier.trim(),
      });

      setMessage(data.message || 'Verification code sent! Please check your device.');
      setStep('RESET');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await apiClient.post('/auth/reset-password', {
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setMessage(data.message || 'Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
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
          Recover your <span className="text-[#34d399]">account.</span>
          <br />
          Stay protected.
        </>
      }
      showcaseSubtitle="Verify your identity with instant one-time passcodes and regain secure access to your escrow dockets, client inquiries, and earnings."
      showcasePills={[
        'Instant OTP Delivery',
        'NIN/BVN Linked',
        'Encrypted Credentials',
        'Escrow Safe',
        'Session Shield',
      ]}
      showcaseFooter="Account recovery secured with end-to-end encrypted verification."
    >
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <h1
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
          >
            {step === 'REQUEST' ? 'Reset password' : 'Create new password'}
          </h1>
          <p
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-sm text-stone-500"
          >
            {step === 'REQUEST'
              ? 'Enter your registered email or phone to receive a 6-digit code.'
              : `Enter the 6-digit code sent to ${identifier} and choose a new password.`}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Step 1: Request OTP Form */}
        {step === 'REQUEST' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <AuthInput
              label="Email Address or Phone Number"
              type="text"
              placeholder="you@example.com or 080..."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-full bg-[#cbf7d2] hover:bg-[#bcf0c5] active:bg-[#b0ebb9] text-[#153e2d] font-semibold text-sm sm:text-base transition-all duration-150 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#153e2d]" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <span>Send Reset Code →</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Confirm OTP & Set New Password Form */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <AuthInput
              label="6-Digit Reset Code"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.trim())}
              className="text-center tracking-widest font-mono text-base font-bold"
              required
              autoFocus
            />

            <AuthInput
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <AuthInput
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                className="inline-flex items-center gap-1 font-semibold text-stone-700 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change email/phone</span>
              </button>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isLoading}
                className="font-semibold text-[#123E2A] hover:underline transition-colors"
              >
                Resend code
              </button>
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
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Set New Password →</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <p className="text-xs text-center text-stone-500 pt-2">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-stone-900 hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
