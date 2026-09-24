import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
import { apiClient, getErrorMessage } from '../../lib/api-client';

export const VerifyOtp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState(searchParams.get('identifier') || '');
  const [otp, setOtp] = useState('');
  const [purpose, setPurpose] = useState(searchParams.get('purpose') || 'PHONE_VERIFICATION');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setError('Please provide your email address or phone number');
      return;
    }

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await apiClient.post('/auth/verify-otp', {
        identifier: identifier.trim(),
        otp: otp.trim(),
        purpose,
      });

      setSuccess(data.message || 'OTP verified successfully! Redirecting...');
      setTimeout(() => navigate('/artisan/dashboard'), 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !identifier.trim()) return;

    try {
      setIsResending(true);
      setError(null);

      await apiClient.post('/auth/forgot-password', {
        identifier: identifier.trim(),
      });

      setSuccess('A fresh 6-digit verification code has been dispatched.');
      setResendCooldown(60);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      showcaseTitle={
        <>
          Two-step <span className="text-[#34d399]">verification.</span>
          <br />
          Total peace of mind.
        </>
      }
      showcaseSubtitle="Multi-factor authentication protects your funded contracts, milestone approvals, and identity from unauthorized access."
      showcasePills={[
        'Real-time SMS/Email',
        'Fraud Prevention',
        'KYC Compliance',
        'Zero Breach',
        'Bank-Grade Security',
      ]}
      showcaseFooter="Multi-factor verification powered by Artifix Security Engine."
    >
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#123E2A]/10 text-[11px] font-bold text-[#123E2A] mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>IDENTITY &amp; SECURITY VERIFICATION</span>
          </div>

          <h1
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
          >
            Enter verification code
          </h1>
          <p
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-sm text-stone-500"
          >
            We&apos;ve sent a 6-digit one-time code to your contact. Enter it below to complete authorization.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <AuthInput
            label="Email Address or Phone Number"
            type="text"
            placeholder="you@example.com or 080..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
          />

          <AuthInput
            label="6-Digit OTP Code"
            type="text"
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.trim())}
            className="text-center tracking-widest font-mono text-lg font-bold"
            required
            autoFocus
          />

          {/* Resend Option */}
          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span>Didn&apos;t get the code?</span>
            {resendCooldown > 0 ? (
              <span className="font-medium text-stone-400">
                Resend in <strong className="text-stone-600">{resendCooldown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="font-bold text-[#123E2A] hover:underline transition-colors"
              >
                {isResending ? 'Sending...' : 'Resend code'}
              </button>
            )}
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
                  <span>Verifying code...</span>
                </>
              ) : (
                <span>Verify Code →</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <p className="text-xs text-center text-stone-500 pt-2">
          Need help?{' '}
          <Link to="/login" className="font-bold text-stone-900 hover:underline transition-colors">
            Return to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
