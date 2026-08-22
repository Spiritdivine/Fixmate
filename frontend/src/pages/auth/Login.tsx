import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles, ArrowRight, Wrench, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { ApiResponse, AuthResponse } from '../../types';

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide your email/phone and password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
        email: identifier,
        identifier,
        password,
      });

      const accessToken = data.data.tokens?.accessToken;
      const refreshToken = data.data.tokens?.refreshToken;
      const user = data.data.user;

      login(accessToken, refreshToken, user);

      if (user.role === 'CLIENT') {
        navigate('/client/dashboard');
      } else if (user.role === 'ARTISAN') {
        navigate('/artisan/dashboard');
      } else {
        navigate('/admin/login');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickLogin = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-xl shadow-sky-500/20 font-bold mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Welcome to Fixmate</h2>
          <p className="text-xs text-slate-400">Sign in to your client or artisan escrow portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address or Phone Number"
              type="text"
              placeholder="e.g. client@fixmate.ng or 08012345678"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Secured with Monad Web3 Escrow</span>
              <Link
                to="/forgot-password"
                className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Quick Demo Credentials for Fast Testing */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Quick Test Autofill
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickLogin('client@fixmate.ng', 'Password123!')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-medium transition-colors border border-purple-500/30"
              >
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Test Client</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin('artisan@fixmate.ng', 'Password123!')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-xs font-medium transition-colors border border-sky-500/30"
              >
                <Wrench className="w-3.5 h-3.5 text-sky-400" />
                <span>Test Artisan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center space-y-1.5">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
              Create an Account
            </Link>
          </p>
          <p className="text-[11px] text-slate-600">
            Fixmate Staff or Compliance?{' '}
            <Link to="/admin/login" className="text-purple-400 hover:text-purple-300 transition-colors">
              Admin Console Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
