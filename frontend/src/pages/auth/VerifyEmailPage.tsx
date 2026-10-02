import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, MailCheck, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser, isInitialized } = useAuthStore();

  const emailParam = searchParams.get('email') || user?.email || '';
  const tokenParam = searchParams.get('token') || '';

  // If user is already verified, immediately redirect to dashboard
  useEffect(() => {
    if (isInitialized && user?.isEmailVerified) {
      const destination =
        user.role === 'ARTISAN' ? '/artisan/dashboard' : '/client/dashboard';
      navigate(destination, { replace: true });
    }
  }, [user?.isEmailVerified, user?.role, isInitialized, navigate]);

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(Boolean(tokenParam && emailParam));
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If URL has token and email, automatically verify
  useEffect(() => {
    if (!tokenParam || !emailParam) return;

    let isMounted = true;
    const verifyToken = async () => {
      try {
        setIsVerifyingToken(true);
        setError(null);

        const { data } = await apiClient.get('/auth/verify-email', {
          params: { email: emailParam, token: tokenParam },
        });

        if (isMounted) {
          setSuccess(data.message || 'Email successfully verified! Redirecting to setup...');
          updateUser({ isEmailVerified: true });
          setTimeout(() => {
            const redirectUrl =
              user?.role === 'ARTISAN' ? '/onboarding/artisan' : '/onboarding/client';
            navigate(redirectUrl);
          }, 2000);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [tokenParam, emailParam, navigate, updateUser, user?.role]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please provide your registered email address');
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
        identifier: email.trim(),
        otp: otp.trim(),
        purpose: 'EMAIL_VERIFICATION',
      });

      setSuccess(data.message || 'Email verified successfully! Redirecting to setup...');
      updateUser({ isEmailVerified: true });

      setTimeout(() => {
        const redirectUrl =
          user?.role === 'ARTISAN' ? '/onboarding/artisan' : '/onboarding/client';
        navigate(redirectUrl);
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email.trim()) return;

    try {
      setIsResending(true);
      setError(null);

      await apiClient.post('/auth/resend-otp', {
        identifier: email.trim(),
        purpose: 'EMAIL_VERIFICATION',
      });

      setSuccess('A fresh 6-digit verification code and link has been sent to your email.');
      setResendCooldown(60);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  if (isInitialized && user?.isEmailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F0] dark:bg-[#141A16]">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthLayout
      showcaseTitle={
        <>
          Verified trust.
          <br />
          <span className="text-[#34d399]">Protected contracts.</span>
        </>
      }
      showcaseSubtitle="Email verification protects your milestone escrow releases, wallet payouts, and marketplace reputation."
      showcasePills={[
        'Escrow Protection',
        'Identity Verified',
        'Fraud Shield',
        'Instant Bidding',
      ]}
      showcaseFooter="Artifix Safe Escrow & Identity Engine &bull; Lagos, Nigeria"
    >
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#123E2A]/10 text-[11px] font-bold text-[#123E2A] mb-1">
            <MailCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>EMAIL SECURITY VERIFICATION</span>
          </div>

          <h1
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
          >
            Confirm your email
          </h1>
          <p
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-sm text-stone-500"
          >
            We&apos;ve sent a verification code to{' '}
            <strong className="text-stone-800">{email || 'your email'}</strong>. Enter the 6-digit
            code below or click the link in your email.
          </p>
        </div>

        {/* Token Verification Loading State */}
        {isVerifyingToken && (
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#123E2A] mx-auto" />
            <p className="text-sm font-semibold text-stone-800">
              Validating your one-click verification link...
            </p>
            <p className="text-xs text-stone-500">Please hold on while we secure your account.</p>
          </div>
        )}

        {/* Alerts */}
        {error && !isVerifyingToken && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        {!isVerifyingToken && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <AuthInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <AuthInput
              label="6-Digit Verification Code"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.trim())}
              className="text-center tracking-widest font-mono text-xl font-bold"
              required
              autoFocus
            />

            {/* Resend Option */}
            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
              <span>Didn&apos;t receive the email?</span>
              {resendCooldown > 0 ? (
                <span className="font-medium text-stone-400">
                  Resend in <strong className="text-stone-600">{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-bold text-[#123E2A] hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Dispatching...' : 'Resend Code'}</span>
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-full bg-[#123E2A] hover:bg-[#0e3222] active:bg-[#0a2519] text-white font-semibold text-sm sm:text-base transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Email &amp; Continue &rarr;</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-semibold text-stone-600 hover:text-stone-900 hover:underline transition-colors cursor-pointer"
          >
            Use different account
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
