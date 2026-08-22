import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiClient, getErrorMessage } from '../../lib/api-client';

export const VerifyOtp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState(searchParams.get('identifier') || '');
  const [otp, setOtp] = useState('');
  const [purpose, setPurpose] = useState(searchParams.get('purpose') || 'PHONE_VERIFICATION');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const { data } = await apiClient.post('/auth/verify-otp', {
        identifier,
        otp,
        purpose,
      });

      setSuccess(data.message || 'OTP verified successfully!');
      setTimeout(() => navigate('/artisan/dashboard'), 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-xl font-bold mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Security Verification</h2>
          <p className="text-xs text-slate-400">Enter the 6-digit OTP code sent to your phone or email</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Email or Phone Number"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <Input
              label="6-Digit OTP Code"
              type="text"
              placeholder="e.g. 123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.trim())}
              leftIcon={<KeyRound className="w-4 h-4" />}
              className="text-center text-lg tracking-widest font-mono font-bold"
              required
            />

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify Code
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
