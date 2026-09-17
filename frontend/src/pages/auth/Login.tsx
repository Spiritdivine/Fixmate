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
    <div className="min-h-screen bg-[#f9fafb] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome Back</h2>
          <p className="text-sm text-slate-500">Sign in to your client or artisan portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address or Phone Number"
              type="text"
              placeholder="e.g. client@artifix.ng or 08012345678"
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
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Social Auth */}
          <div className="pt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center space-y-1.5">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
              Create an Account
            </Link>
          </p>
          <p className="text-[11px] text-slate-500">
            Artifix Staff or Compliance?{' '}
            <Link to="/admin/login" className="text-emerald-600 hover:text-emerald-700 transition-colors">
              Admin Console Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
