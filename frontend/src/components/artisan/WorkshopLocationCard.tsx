import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LocationPickerMap } from '../map/LocationPickerMap';
import { GeocodedAddress } from '../../lib/geocoding';

export interface WorkshopLocationCardProps {
  latitude: number | null;
  longitude: number | null;
  state: string;
  lgaCity: string;
  address: string;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onAddressFill?: (details: { state?: string; lgaCity?: string; address?: string }) => void;
  onStateChange: (val: string) => void;
  onLgaCityChange: (val: string) => void;
  onAddressChange: (val: string) => void;
}

const COVERAGE_OPTIONS = [5, 10, 15, 25, 50];

export const WorkshopLocationCard: React.FC<WorkshopLocationCardProps> = ({
  latitude,
  longitude,
  state,
  lgaCity,
  address,
  onCoordinatesChange,
  onAddressFill,
  onStateChange,
  onLgaCityChange,
  onAddressChange,
}) => {
  const [coverageRadiusKm, setCoverageRadiusKm] = useState<number>(15);
  const [lastSuggestedAddress, setLastSuggestedAddress] = useState<GeocodedAddress | null>(null);

  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  const handleCoordinatesChange = (coords: {
    lat: number;
    lng: number;
    addressSuggestion?: GeocodedAddress;
  }) => {
    onCoordinatesChange(coords.lat, coords.lng);
    if (coords.addressSuggestion) {
      setLastSuggestedAddress(coords.addressSuggestion);
    }
  };

  const handleApplySuggestedAddress = () => {
    if (!lastSuggestedAddress) return;
    if (onAddressFill) {
      onAddressFill({
        state: lastSuggestedAddress.state || state,
        lgaCity: lastSuggestedAddress.lgaCity || lgaCity,
        address: lastSuggestedAddress.formattedAddress || address,
      });
    } else {
      if (lastSuggestedAddress.state) onStateChange(lastSuggestedAddress.state);
      if (lastSuggestedAddress.lgaCity) {
        onLgaCityChange(lastSuggestedAddress.lgaCity);
      }
      if (lastSuggestedAddress.formattedAddress) {
        onAddressChange(lastSuggestedAddress.formattedAddress);
      }
    }
    setLastSuggestedAddress(null);
  };

  return (
    <Card className="space-y-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle>Operating Location & Workshop Map</CardTitle>
            </div>
            <CardDescription>
              Set your precise workshop or base location so nearby clients can discover you within
              their search radius.
            </CardDescription>
          </div>

          {/* Configuration Status Badge */}
          <div>
            {hasCoordinates ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                GPS Pin Active ({Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Pin Not Set — Tap or Drag Map to Set
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Privacy Guarantee Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Privacy Protected by Geo-Fuzzing
          </p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Your exact pinpoint is kept secure on our backend to match nearby client jobs. On public
            discovery maps, clients see an obfuscated marker within 150m–300m for your personal safety.
          </p>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            Interactive Base / Workshop Pin Drop
          </label>

          {/* Radius Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400">Service Reach:</span>
            <div className="flex gap-1">
              {COVERAGE_OPTIONS.map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setCoverageRadiusKm(km)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                    coverageRadiusKm === km
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {km}km
                </button>
              ))}
            </div>
          </div>
        </div>

        <LocationPickerMap
          initialLat={hasCoordinates ? Number(latitude) : 6.5952}
          initialLng={hasCoordinates ? Number(longitude) : 3.3512}
          coverageRadiusKm={coverageRadiusKm}
          onCoordinatesChange={handleCoordinatesChange}
          className="w-full h-[360px]"
        />

        {/* Suggested Address Autofill Prompt */}
        {lastSuggestedAddress && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Detected address:{' '}
                <strong className="font-semibold">{lastSuggestedAddress.formattedAddress}</strong>
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleApplySuggestedAddress}
              className="text-xs shrink-0 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white"
            >
              Autofill Form Fields
            </Button>
          </div>
        )}
      </div>

      {/* Manual Address Fields */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="State"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="e.g. Lagos"
            required
          />
          <Input
            label="LGA or City"
            value={lgaCity}
            onChange={(e) => onLgaCityChange(e.target.value)}
            placeholder="e.g. Ikeja"
            required
          />
        </div>

        <Input
          label="Workshop or Office Street Address"
          placeholder="e.g. 14 Awolowo Way, Ikeja, Lagos"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
        />

        {hasCoordinates && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-emerald-600" />
              Coordinates saved for distance matching
            </span>
            <span className="font-mono">
              {Number(latitude).toFixed(6)}° N, {Number(longitude).toFixed(6)}° E
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
