import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthInput } from '../../components/auth/AuthInput';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { useAuthStore } from '../../stores/authStore';
import { ApiResponse, AuthResponse } from '../../types';
import { trackEvent } from '../../lib/posthog';

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

export const Register: React.FC = () => {
  const [role, setRole] = useState<'CLIENT' | 'ARTISAN'>('CLIENT');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    state: 'Lagos',
    lgaCity: 'Ikeja',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const payload: any = {
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        role,
        state: formData.state,
        lgaCity: formData.lgaCity.trim(),
      };

      if (role === 'CLIENT') {
        payload.firstName = formData.firstName.trim() || 'Client';
        payload.lastName = formData.lastName.trim() || 'User';
        if (formData.companyName.trim()) {
          payload.companyName = formData.companyName.trim();
        }
      } else {
        payload.businessName =
          formData.businessName.trim() ||
          `${formData.firstName.trim() || 'Artisan'} Services`;
        payload.firstName = formData.firstName.trim() || 'Artisan';
        payload.lastName = formData.lastName.trim() || 'Pro';
      }

      const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        payload
      );

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
    <AuthLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <h1
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
          >
            Create your account
          </h1>
          <p
            style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}
            className="text-sm text-stone-500"
          >
            Already with us?{' '}
            <Link
              to="/login"
              className="font-bold text-stone-900 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Minimalist Role Selector */}
        <div className="p-1 rounded-full bg-stone-100 border border-stone-200 grid grid-cols-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`py-2 px-3 rounded-full transition-all text-center cursor-pointer ${
              role === 'CLIENT'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            I want to Hire
          </button>
          <button
            type="button"
            onClick={() => setRole('ARTISAN')}
            className={`py-2 px-3 rounded-full transition-all text-center cursor-pointer ${
              role === 'ARTISAN'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            I am an Artisan
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* First & Last name or Business name */}
          {role === 'CLIENT' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <AuthInput
                label="First name"
                type="text"
                placeholder="Kwesi"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                autoComplete="given-name"
              />
              <AuthInput
                label="Last name"
                type="text"
                placeholder="Danso"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                autoComplete="family-name"
              />
            </div>
          ) : (
            <div className="space-y-3.5">
              <AuthInput
                label="Business or Trade Name"
                type="text"
                placeholder="e.g. Apex Electrical & Solar Services"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <AuthInput
                  label="First name"
                  type="text"
                  placeholder="Kwesi"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
                <AuthInput
                  label="Last name"
                  type="text"
                  placeholder="Danso"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <AuthInput
            label="Work email"
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            autoComplete="email"
          />

          {/* Phone Number */}
          <AuthInput
            label="Phone number"
            type="tel"
            placeholder="08012345678"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            required
            autoComplete="tel"
          />

          {/* State & City / LGA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5 text-left font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
              <label
                htmlFor="state-select"
                className="text-xs sm:text-[13px] font-semibold text-stone-800 tracking-normal block select-none"
              >
                State
              </label>
              <div className="relative">
                <select
                  id="state-select"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full appearance-none rounded-2xl border border-stone-200 bg-white text-stone-900 text-sm px-4 py-3.5 pr-10 transition-all outline-none hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200/50 cursor-pointer"
                >
                  {statesList.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <AuthInput
              label="City / LGA"
              type="text"
              placeholder="Ikeja"
              value={formData.lgaCity}
              onChange={(e) =>
                setFormData({ ...formData, lgaCity: e.target.value })
              }
              required
            />
          </div>

          {/* Password */}
          <AuthInput
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            helperText="Use 8+ characters with a number and a symbol"
            required
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <AuthInput
            label="Confirm password"
            type="password"
            placeholder="Repeat it"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            error={
              formData.confirmPassword &&
              formData.password !== formData.confirmPassword
                ? 'Passwords do not match'
                : undefined
            }
            required
            autoComplete="new-password"
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
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer Disclaimer */}
        <p className="text-xs text-center text-stone-400 leading-relaxed pt-2">
          By signing up you agree to our{' '}
          <a
            href="#"
            className="underline hover:text-stone-600 transition-colors"
          >
            terms of use
          </a>{' '}
          and{' '}
          <a
            href="#"
            className="underline hover:text-stone-600 transition-colors"
          >
            privacy policy
          </a>
          .
        </p>
      </div>
    </AuthLayout>
  );
};
