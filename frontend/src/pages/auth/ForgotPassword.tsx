import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiClient, getErrorMessage } from '../../lib/api-client';

export const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.post('/auth/forgot-password', { identifier });
      setMessage(data.message || 'Password reset OTP has been generated.');
      setStep('RESET');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await apiClient.post('/auth/reset-password', {
        identifier,
        otp,
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-xl font-bold mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Reset Account Password</h2>
          <p className="text-xs text-slate-400">
            {step === 'REQUEST'
              ? 'Enter your registered email or phone to receive a reset code'
              : 'Enter the code and choose a strong new password'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {step === 'REQUEST' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <Input
                label="Email Address or Phone Number"
                type="text"
                placeholder="artisan@fixmate.ng"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="6-Digit Reset Code"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                leftIcon={<KeyRound className="w-4 h-4" />}
                className="text-center tracking-widest font-mono font-bold"
                required
              />
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                Confirm & Set New Password
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          Remember your password?{' '}
          <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
