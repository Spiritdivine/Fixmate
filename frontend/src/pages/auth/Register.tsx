import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, Briefcase, MapPin, Sparkles, ArrowRight, UserCheck, Wrench, Building } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { ApiResponse, AuthResponse } from '../../types';

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-xl shadow-sky-500/20 font-bold mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Join Fixmate</h2>
          <p className="text-xs text-slate-400">
            {role === 'CLIENT'
              ? 'Hire verified artisans with smart escrow milestone protection'
              : 'Get hired for verified contracts with guaranteed escrow payouts'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === 'CLIENT'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
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
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>I am an Artisan</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5">
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
              className={`w-full ${role === 'CLIENT' ? 'bg-purple-600 hover:bg-purple-500' : ''}`}
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {role === 'CLIENT' ? 'Create Client Account' : 'Create Artisan Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
