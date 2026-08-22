import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { ApiResponse, AuthResponse } from '../../types';

export const AdminLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('admin@artisanplatform.com');
  const [password, setPassword] = useState('Admin@123456');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide your admin email and password');
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

      if (data.data.user.role !== 'ADMIN' && data.data.user.role !== 'SUPPORT') {
        setError('Unauthorized: This portal is strictly restricted to Fixmate Administrators.');
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20 font-bold mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Fixmate Admin Console</h2>
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
            Superuser & Compliance Authorization
          </p>
        </div>

        <div className="bg-slate-900/80 border border-purple-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Admin Email Address"
              type="email"
              placeholder="admin@artisanplatform.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Master Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Authorize Admin Session
            </Button>
          </form>

          <div className="pt-2 text-center">
            <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
              ← Return to Artisan Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
