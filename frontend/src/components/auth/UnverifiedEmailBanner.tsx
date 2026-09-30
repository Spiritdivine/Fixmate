import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MailCheck, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiClient, getErrorMessage } from '../../lib/api-client';

export const UnverifiedEmailBanner: React.FC = () => {
  const { user } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  if (!user || user.isEmailVerified) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0 || isSending) return;

    try {
      setIsSending(true);
      setMessage(null);

      await apiClient.post('/auth/send-verification-email', {
        email: user.email,
      });

      setMessage('Verification link sent! Check your inbox.');
      setCooldown(60);

      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
      className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Your email ({user.email}) is not yet verified.</strong> Please verify your email to submit proposals and unlock escrow withdrawals.
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {message ? (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{message}</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isSending || cooldown > 0}
              className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Resend in {cooldown}s</span>
              ) : (
                <>
                  <MailCheck className="w-3.5 h-3.5" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          )}

          <Link
            to="/verify-email"
            className="inline-flex items-center gap-1 font-extrabold text-[#123E2A] dark:text-emerald-400 hover:underline"
          >
            <span>Enter Code</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
