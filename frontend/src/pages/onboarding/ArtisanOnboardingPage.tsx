import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiClient, getErrorMessage } from '../../lib/api-client';
import { TRADE_CATALOG } from '../../data/tradeCatalogData';
import { LocationPickerMap } from '../../components/map/LocationPickerMap';
import { Button } from '../../components/ui/Button';

export const ArtisanOnboardingPage: React.FC = () => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Identity & Bio
  const [firstName, setFirstName] = useState(
    user?.artisanProfile?.firstName || ''
  );
  const [lastName, setLastName] = useState(
    user?.artisanProfile?.lastName || ''
  );
  const [businessName, setBusinessName] = useState(
    user?.artisanProfile?.businessName || ''
  );
  const [tagline, setTagline] = useState(user?.artisanProfile?.tagline || '');
  const [bio, setBio] = useState(user?.artisanProfile?.bio || '');

  // Step 2: Trade & Skills
  const [selectedCategory, setSelectedCategory] = useState<string>('solar-and-inverters');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Step 3: Rates & Experience
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(
    user?.artisanProfile?.yearsOfExperience || 3
  );
  const [hourlyRate, setHourlyRate] = useState<string>(
    user?.artisanProfile?.hourlyRate ? String(user.artisanProfile.hourlyRate) : '5000'
  );
  const [isAvailable247, setIsAvailable247] = useState<boolean>(true);

  // Step 4: Workshop Location (100% Leaflet)
  const [latitude, setLatitude] = useState<number>(6.5952);
  const [longitude, setLongitude] = useState<number>(3.3512);
  const [state, setState] = useState<string>(user?.artisanProfile?.state || 'Lagos');
  const [lgaCity, setLgaCity] = useState<string>(user?.artisanProfile?.lgaCity || 'Ikeja');
  const [address, setAddress] = useState<string>(user?.artisanProfile?.address || '');
  const [coverageRadiusKm, setCoverageRadiusKm] = useState<number>(15);

  const availableSkills = TRADE_CATALOG[selectedCategory]?.popularSkills || [];

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSaveAndContinue = async () => {
    if (currentStep === 1) {
      if (!firstName.trim()) {
        setError('Please enter your first name');
        return;
      }
    }

    if (currentStep < 5) {
      setError(null);
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Step 5 Submit
    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        businessName: businessName.trim() || undefined,
        tagline: tagline.trim() || undefined,
        bio: bio.trim() || undefined,
        yearsOfExperience: Number(yearsOfExperience),
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        state,
        lgaCity,
        address: address.trim() || undefined,
        latitude,
        longitude,
        isAvailable: isAvailable247,
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
      };

      await apiClient.put('/profile/artisan', payload).catch(() => {
        // Fallback endpoint if /profile/artisan has slightly different route
        return apiClient.put('/profile', payload);
      });

      if (user?.artisanProfile) {
        const { skills: _skills, ...profilePayload } = payload;
        updateUser({
          artisanProfile: {
            ...user.artisanProfile,
            ...profilePayload,
          },
        });
      }

      navigate('/artisan/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
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
      <div className="max-w-3xl mx-auto w-full">
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
                Artisan Setup Wizard
              </span>
            </div>
          </div>

          <Link
            to="/artisan/dashboard"
            className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-white transition"
          >
            Skip for now &rarr;
          </Link>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
            <span>STEP {currentStep} OF 5</span>
            <span className="text-emerald-700 dark:text-emerald-400">
              {currentStep === 1 && 'Identity & Brand'}
              {currentStep === 2 && 'Trade & Skills'}
              {currentStep === 3 && 'Rates & Capacity'}
              {currentStep === 4 && 'Workshop & Service Map'}
              {currentStep === 5 && 'Trust & Verification'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full bg-[#123E2A] dark:bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-6">
            {error}
          </div>
        )}

        {/* STEP 1: IDENTITY & BIO */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a221d] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight font-display text-stone-900 dark:text-white">
                Set up your Trade Identity
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Clients choose artisans who present a credible business persona and clear specialization.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Babatunde"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123E2A]"
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
                    className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123E2A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Business or Trade Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ade Electrical & Inverter Solutions"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123E2A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Catchy Professional Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Certified High-Voltage & Solar Expert with 8+ Years Experience"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123E2A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Professional Bio &amp; Craft Summary
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell clients about your tools, typical past projects, warranty policy, and dedication to safe standards..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123E2A]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TRADE & SKILLS */}
        {currentStep === 2 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a221d] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight font-display text-stone-900 dark:text-white">
                Select Your Core Trade &amp; Skills
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                You will receive job notifications matching the skills you highlight here.
              </p>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                Primary Trade Specialty
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(TRADE_CATALOG).map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setSelectedSkills([]);
                    }}
                    className={`p-3 rounded-2xl text-left border text-xs font-bold transition cursor-pointer ${
                      selectedCategory === cat.slug
                        ? 'bg-[#123E2A] text-white border-[#123E2A] shadow-sm'
                        : 'bg-stone-50 dark:bg-[#151c17] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-emerald-500/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Chips */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-2">
                Specific Services &amp; Specialties
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`px-3.5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RATES & EXPERIENCE */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a221d] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight font-display text-stone-900 dark:text-white">
                Experience &amp; Pricing Standards
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Transparent rates establish credibility and help clients budget milestone allocations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Years of Active Experience
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123E2A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Standard Daily / Inspection Callout (NGN)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                    ₦
                  </span>
                  <input
                    type="number"
                    step={500}
                    min={1000}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#123E2A]"
                  />
                </div>
              </div>
            </div>

            {/* 24/7 Callout Toggle */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Available for Emergency Same-Day Callouts
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Clients seeking urgent burst pipe or power failure fixes will see your profile highlighted.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isAvailable247}
                onChange={(e) => setIsAvailable247(e.target.checked)}
                className="w-5 h-5 rounded text-[#123E2A] focus:ring-[#123E2A] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* STEP 4: WORKSHOP & COVERAGE (100% LEAFLET) */}
        {currentStep === 4 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a221d] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight font-display text-stone-900 dark:text-white">
                Pin Your Workshop &amp; Coverage Radius
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Search your landmark or drag the pin. We filter jobs to within your dispatch radius.
              </p>
            </div>

            {/* 100% Free Leaflet Location Map with Photon Autocomplete */}
            <LocationPickerMap
              initialLat={latitude}
              initialLng={longitude}
              coverageRadiusKm={coverageRadiusKm}
              onCoordinatesChange={(coords) => {
                setLatitude(coords.lat);
                setLongitude(coords.lng);
                if (coords.addressSuggestion) {
                  if (coords.addressSuggestion.state) setState(coords.addressSuggestion.state);
                  if (coords.addressSuggestion.lgaCity) setLgaCity(coords.addressSuggestion.lgaCity);
                  if (coords.addressSuggestion.formattedAddress) setAddress(coords.addressSuggestion.formattedAddress);
                }
              }}
              className="w-full h-[320px]"
            />

            {/* Address Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  LGA / City
                </label>
                <input
                  type="text"
                  value={lgaCity}
                  onChange={(e) => setLgaCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-300 dark:border-stone-700 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Radius Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-stone-700 dark:text-stone-300">Service Travel Radius</span>
                <span className="text-[#123E2A] dark:text-emerald-400">{coverageRadiusKm} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={coverageRadiusKm}
                onChange={(e) => setCoverageRadiusKm(Number(e.target.value))}
                className="w-full accent-[#123E2A] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* STEP 5: TRUST & KYC PRIMER */}
        {currentStep === 5 && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a221d] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-bold tracking-tight font-display text-stone-900 dark:text-white">
                Unlock the Verified Artisan Shield
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                Artisans with identity verification (NIN, BVN, or Driver&apos;s License) receive{' '}
                <strong className="text-stone-800 dark:text-stone-200">4x more bid acceptances</strong> and can withdraw escrow payouts instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-200 dark:border-stone-800">
                <div className="font-bold text-stone-900 dark:text-white mb-0.5">Green Checkmark</div>
                <div className="text-[11px] text-stone-500">Highlighted on search results</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-200 dark:border-stone-800">
                <div className="font-bold text-stone-900 dark:text-white mb-0.5">High-Value Jobs</div>
                <div className="text-[11px] text-stone-500">Access commercial projects</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#151c17] border border-stone-200 dark:border-stone-800">
                <div className="font-bold text-stone-900 dark:text-white mb-0.5">Fast Escrow Payouts</div>
                <div className="text-[11px] text-stone-500">Instant Paystack / Monad release</div>
              </div>
            </div>

            <p className="text-xs text-stone-400">
              You can verify right now or complete it anytime from your dashboard.
            </p>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-stone-200 dark:border-stone-800 mt-6">
          {currentStep > 1 ? (
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

          <Button
            type="button"
            size="md"
            className="bg-[#123E2A] hover:bg-[#0e3222] text-white shadow-md cursor-pointer"
            onClick={handleSaveAndContinue}
            disabled={isSubmitting}
            rightIcon={currentStep < 5 ? <ArrowRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white mr-2" />
                <span>Saving Setup...</span>
              </>
            ) : currentStep < 5 ? (
              <span>Continue &rarr;</span>
            ) : (
              <span>Launch Dashboard &rarr;</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
