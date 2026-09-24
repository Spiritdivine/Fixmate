import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
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
    if (!identifier.trim() || !password) {
      setError('Please provide your email address or phone number and password');
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

  return (
    <AuthLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <h1
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
          >
            Welcome back
          </h1>
          <p
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-sm text-stone-500"
          >
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-stone-900 hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <AuthInput
            label="Email"
            type="text"
            placeholder="you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
          />

          <AuthInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            labelAction={
              <Link
                to="/forgot-password"
                className="font-medium text-stone-700 hover:text-stone-900 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            }
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
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer Disclaimer */}
        <p className="text-xs text-center text-stone-400 leading-relaxed pt-2">
          By signing in you agree to our{' '}
          <a href="#" className="underline hover:text-stone-600 transition-colors">
            terms of use
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-stone-600 transition-colors">
            privacy policy
          </a>
          .
        </p>
      </div>
    </AuthLayout>
  );
};
