import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, Briefcase, MapPin, Sparkles, ArrowRight, UserCheck, Wrench, Building } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { ApiResponse, AuthResponse } from '../../types';
import { trackEvent } from '../../lib/posthog';

export const Register: React.FC = () => {
  const [role, setRole] = useState<'CLIENT' | 'ARTISAN'>('CLIENT');
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    businessName: '',
    state: 'Lagos',
    lgaCity: 'Ikeja',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const statesList = [
    { value: 'Lagos', label: 'Lagos State' },
    { value: 'Abuja (FCT)', label: 'Abuja (FCT)' },
    { value: 'Rivers', label: 'Rivers (Port Harcourt)' },
    { value: 'Oyo', label: 'Oyo (Ibadan)' },
    { value: 'Enugu', label: 'Enugu State' },
    { value: 'Kano', label: 'Kano State' },
    { value: 'Ogun', label: 'Ogun State' },
    { value: 'Delta', label: 'Delta State' },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const payload: any = {
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role,
        state: formData.state,
        lgaCity: formData.lgaCity,
      };

      if (role === 'CLIENT') {
        payload.firstName = formData.firstName || 'Client';
        payload.lastName = formData.lastName || 'User';
        if (formData.companyName) payload.companyName = formData.companyName;
      } else {
        payload.businessName = formData.businessName || `${formData.firstName || 'Artisan'} Services`;
      }

      const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);

      const accessToken = data.data.tokens?.accessToken;
      const refreshToken = data.data.tokens?.refreshToken;
      const user = data.data.user;

      login(accessToken, refreshToken, user);
      trackEvent('account_registered', { role });

      if (role === 'CLIENT') {
        navigate('/client/dashboard');
      } else {
        navigate('/artisan/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Join Artifix</h2>
          <p className="text-sm text-slate-500">
            {role === 'CLIENT'
              ? 'Hire verified artisans with smart escrow milestone protection'
              : 'Get hired for verified contracts with guaranteed escrow payouts'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === 'CLIENT'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>I want to Hire (Client)</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('ARTISAN')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === 'ARTISAN'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>I am an Artisan</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Client-specific fields */}
            {role === 'CLIENT' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    type="text"
                    placeholder="e.g. Chukwuma"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    type="text"
                    placeholder="e.g. Adeleke"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Company Name (Optional)"
                  type="text"
                  placeholder="e.g. Apex Living Ltd"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  leftIcon={<Building className="w-4 h-4" />}
                />
              </>
            ) : (
              /* Artisan-specific fields */
              <Input
                label="Business or Trade Name"
                type="text"
                placeholder="e.g. Divine Electric & Solar Fix"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                leftIcon={<Briefcase className="w-4 h-4" />}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder={role === 'CLIENT' ? 'client@domain.ng' : 'artisan@domain.ng'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="08012345678"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="State"
                options={statesList}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
              <Input
                label="City / LGA"
                type="text"
                placeholder="e.g. Ikeja / Lekki"
                value={formData.lgaCity}
                onChange={(e) => setFormData({ ...formData, lgaCity: e.target.value })}
                leftIcon={<MapPin className="w-4 h-4" />}
                required
              />
            </div>

            <Input
              label="Secure Password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {role === 'CLIENT' ? 'Create Client Account' : 'Create Artisan Account'}
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
                Sign up with Google
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
