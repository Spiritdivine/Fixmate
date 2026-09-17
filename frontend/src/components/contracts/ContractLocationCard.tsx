import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';

export interface NavigationSuite {
  googleMaps: string;
  appleMaps: string;
  waze: string;
}

export interface ContractLocationCardProps {
  artisanName: string;
  address?: string | null;
  state?: string | null;
  lgaCity?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  navigationSuite?: NavigationSuite | null;
  isLocationRevealed?: boolean;
}

export const ContractLocationCard: React.FC<ContractLocationCardProps> = ({
  artisanName,
  address,
  state,
  lgaCity,
  latitude,
  longitude,
  navigationSuite,
  isLocationRevealed = false,
}) => {
  const [copied, setCopied] = useState(false);

  const fullAddress = [address, lgaCity, state].filter(Boolean).join(', ');

  const handleCopy = async () => {
    if (!fullAddress) return;
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const navLinks = navigationSuite || {
    googleMaps: latitude && longitude ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}` : '#',
    appleMaps: latitude && longitude ? `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d` : '#',
    waze: latitude && longitude ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes` : '#',
  };

  return (
    <Card className="space-y-4 border-emerald-500/30 bg-emerald-500/5">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Workshop & Job Site Location
                {isLocationRevealed && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Escrow Verified
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {isLocationRevealed
                  ? `Exact coordinates unlocked for ${artisanName}`
                  : 'Coordinates shielded until escrow funding'}
              </CardDescription>
            </div>
          </div>

          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </CardHeader>

      {/* Address Details & Copy */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {fullAddress || 'Operating within ' + (lgaCity || 'Lagos') + ', ' + (state || 'Nigeria')}
            </p>
            {latitude && longitude && (
              <p className="text-[11px] font-mono text-slate-400">
                GPS: {Number(latitude).toFixed(5)}° N, {Number(longitude).toFixed(5)}° E
              </p>
            )}
          </div>

          {fullAddress && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="text-xs shrink-0 flex items-center gap-1.5 h-8 px-2.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* External Navigation Launch Buttons */}
      {latitude && longitude && (
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-emerald-600" />
            Launch GPS Navigation App:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={navLinks.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href={navLinks.appleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Apple Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <a
              href={navLinks.waze}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Waze</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      )}
    </Card>
  );
};
