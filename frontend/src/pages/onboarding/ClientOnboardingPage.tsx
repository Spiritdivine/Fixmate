import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';

export const ClientOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        navigate('/login');
      } else if (!user.isEmailVerified) {
        navigate(`/verify-email?email=${encodeURIComponent(user.email)}`, { replace: true });
      }
    }
  }, [user, isInitialized, navigate]);

  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState(user?.clientProfile?.firstName || '');
  const [lastName, setLastName] = useState(user?.clientProfile?.lastName || '');
  const [city, setCity] = useState(user?.clientProfile?.city || 'Lagos');
  const [state, setState] = useState(user?.clientProfile?.state || 'Lagos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!firstName.trim()) {
        setError('Please provide your name');
        return;
      }
      try {
        setIsSubmitting(true);
        setError(null);
        await apiClient.put('/profile/client', {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          city,
          state,
        }).catch(() => {});

        if (user?.clientProfile) {
          updateUser({
            clientProfile: {
              ...user.clientProfile,
              firstName,
              lastName,
              city,
              state,
            },
          });
        }
        setCurrentStep(2);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  if (!isInitialized || !user || !user.isEmailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF7F0] dark:bg-[#141A16]">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
      className="min-h-screen bg-[#FAF7F0] dark:bg-[#141A16] text-[#141A16] dark:text-[#FAF7F0] py-10 px-4 sm:px-6 flex flex-col justify-between"
    >
      <div className="max-w-2xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-8 border-b border-stone-200 dark:border-stone-800 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#123E2A] flex items-center justify-center text-emerald-400 font-black text-xl shadow-xs">
              A
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block leading-tight font-display text-stone-900 dark:text-white">
                Artifix
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                Client Orientation
              </span>
            </div>
          </div>

          <Link
            to="/client/dashboard"
            className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-white transition"
          >
            Skip to dashboard &rarr;
          </Link>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
            <span>STEP {currentStep} OF 3</span>
            <span className="text-emerald-700 dark:text-emerald-400">
              {currentStep === 1 && 'Profile Details'}
              {currentStep === 2 && 'Escrow Guarantee'}
              {currentStep === 3 && 'Get Started'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-[#123E2A] dark:bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-6">
            {error}
          </div>
        )}

        {/* STEP 1: CLIENT PROFILE */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a221d] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight font-display text-stone-900 dark:text-white">
                Welcome to Artifix! Tell us about yourself
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                This helps verified contractors recognize your project inquiries.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Babatunde"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adeleke"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    City / LGA
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lekki Phase 1"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ESCROW SAFETY TOUR */}
        {currentStep === 2 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a221d] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% ESCROW PROTECTION</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight font-display text-stone-900 dark:text-white">
                How Artifix Protects Your Money
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Never pay an unknown contractor upfront with direct bank transfers. Here is how our smart escrow keeps your funds secure:
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-200 dark:border-stone-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-[#123E2A] text-emerald-400 font-bold flex items-center justify-center shrink-0 text-sm">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    You Lock Funds into Smart Escrow
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Your deposit is held safely in decentralized smart escrow. The artisan sees the funds are guaranteed, but cannot touch them yet.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-200 dark:border-stone-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-[#123E2A] text-emerald-400 font-bold flex items-center justify-center shrink-0 text-sm">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    Artisan Executes Milestone Work
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    The artisan purchases materials and delivers each agreed step (e.g. piping, wiring, solar mounting).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-200 dark:border-stone-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-[#123E2A] text-emerald-400 font-bold flex items-center justify-center shrink-0 text-sm">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                    You Inspect &amp; Release Payment
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Only after you are satisfied with the inspection do you approve the release of funds to the artisan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: NEXT ACTION */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a221d] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#123E2A] text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight font-display text-stone-900 dark:text-white">
                You&apos;re All Set, {firstName || 'Client'}!
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                What would you like to accomplish first today?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
              <button
                type="button"
                onClick={() => navigate('/client/jobs/post')}
                className="p-5 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-200 dark:border-stone-800 hover:border-[#123E2A] hover:shadow-md transition text-left cursor-pointer group"
              >
                <div className="p-2.5 rounded-xl bg-[#123E2A] text-emerald-400 inline-block mb-3">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white group-hover:text-emerald-700 transition">
                  Post a Job Request
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Describe what you need and receive competitive quotations from vetted trade specialists.
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigate('/client/artisans')}
                className="p-5 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-200 dark:border-stone-800 hover:border-[#123E2A] hover:shadow-md transition text-left cursor-pointer group"
              >
                <div className="p-2.5 rounded-xl bg-[#123E2A] text-emerald-400 inline-block mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white group-hover:text-emerald-700 transition">
                  Browse Verified Artisans
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Explore certified electricians, plumbers, and solar technicians nearby on the interactive map.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Wizard Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-stone-200 dark:border-stone-800 mt-6">
          {currentStep > 1 && currentStep < 3 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              size="md"
              className="bg-[#123E2A] hover:bg-[#0e3222] text-white shadow-md cursor-pointer"
              onClick={handleNext}
              disabled={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue &rarr;
            </Button>
          ) : (
            <Button
              type="button"
              size="md"
              className="bg-[#123E2A] hover:bg-[#0e3222] text-white shadow-md cursor-pointer"
              onClick={() => navigate('/client/dashboard')}
            >
              Go to Dashboard &rarr;
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
