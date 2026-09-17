import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Search, Loader2 } from 'lucide-react';
import { geocodingService, GeocodedAddress } from '../../lib/geocoding';
import { GeolocationService } from '../../lib/geolocation';

export interface LocationPickerMapProps {
  initialLat?: number | null;
  initialLng?: number | null;
  coverageRadiusKm?: number;
  onCoordinatesChange: (coords: {
    lat: number;
    lng: number;
    addressSuggestion?: GeocodedAddress;
  }) => void;
  className?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLat = 6.5952,
  initialLng = 3.3512,
  coverageRadiusKm = 15,
  onCoordinatesChange,
  className = 'w-full h-[360px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(Number(initialLat) || 6.5952);
  const [currentLng, setCurrentLng] = useState<number>(Number(initialLng) || 3.3512);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodedAddress[]>([]);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  // Custom Draggable Artisan Pin Icon
  const createDraggablePinIcon = () => {
    return L.divIcon({
      html: `
        <div class="relative flex flex-col items-center cursor-grab active:cursor-grabbing">
          <div class="px-2 py-0.5 mb-1 rounded-full text-[10px] font-bold bg-slate-900 text-white shadow-xl whitespace-nowrap border border-emerald-400">
            📍 Drag to workshop
          </div>
          <div class="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-700 text-white shadow-2xl border-2 border-white ring-4 ring-emerald-500/30">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div class="w-2 h-2 -mt-1 rotate-45 bg-emerald-700 border-r border-b border-white shadow-xs"></div>
        </div>
      `,
      className: 'custom-artisan-pin-container',
      iconSize: [110, 58],
      iconAnchor: [55, 58],
    });
  };

  // Helper to trigger coordinate updates and reverse geocoding
  const handlePositionSelected = async (lat: number, lng: number) => {
    const validLat = Number(lat);
    const validLng = Number(lng);
    setCurrentLat(validLat);
    setCurrentLng(validLng);

    // Perform reverse geocoding to suggest address
    const suggestion = await geocodingService.reverseGeocode(validLat, validLng);
    if (suggestion) {
      setResolvedAddress(suggestion.formattedAddress);
    }
    onCoordinatesChange({ lat: validLat, lng: validLng, addressSuggestion: suggestion || undefined });
  };

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [currentLat, currentLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Draggable Marker
    const marker = L.marker([currentLat, currentLng], {
      draggable: true,
      icon: createDraggablePinIcon(),
      zIndexOffset: 1000,
    }).addTo(map);

    // Drag end listener
    marker.on('dragend', (e: any) => {
      const position = e.target.getLatLng();
      handlePositionSelected(position.lat, position.lng);
    });

    // Map click listener: moves pin to clicked position
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      handlePositionSelected(e.latlng.lat, e.latlng.lng);
    });

    // Coverage Radius Circle
    const circle = L.circle([currentLat, currentLng], {
      radius: coverageRadiusKm * 1000,
      color: '#059669', // Emerald 600
      weight: 1.5,
      fillColor: '#10b981',
      fillOpacity: 0.08,
      dashArray: '6, 8',
    }).addTo(map);

    markerRef.current = marker;
    circleRef.current = circle;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  // 2. Update Marker & Circle when state or radius updates
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !circleRef.current) return;

    const latLng: [number, number] = [currentLat, currentLng];
    markerRef.current.setLatLng(latLng);
    circleRef.current.setLatLng(latLng);
    circleRef.current.setRadius(coverageRadiusKm * 1000);
  }, [currentLat, currentLng, coverageRadiusKm]);

  // 3. Handle GPS Auto-Detection
  const handleDetectGPS = async () => {
    setIsDetectingGPS(true);
    const result = await GeolocationService.getCurrentPosition();
    if (result.coordinates && mapRef.current) {
      const { latitude, longitude } = result.coordinates;
      mapRef.current.flyTo([latitude, longitude], 15, { duration: 1.2 });
      if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
      await handlePositionSelected(latitude, longitude);
    }
    setIsDetectingGPS(false);
  };

  // 4. Handle Landmark Search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await geocodingService.forwardGeocode(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSearchResult = async (result: GeocodedAddress) => {
    setSearchResults([]);
    setSearchQuery('');
    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo([result.latitude, result.longitude], 15, { duration: 1.2 });
      markerRef.current.setLatLng([result.latitude, result.longitude]);
      await handlePositionSelected(result.latitude, result.longitude);
    }
  };

  return (
    <div className="relative w-full rounded-[24px] overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      {/* Map Header Controls: Landmark Search & GPS Detection */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search landmark (e.g. Allen Avenue, Ikeja)..."
            className="w-full pl-9 pr-8 py-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
          )}

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-48 overflow-y-auto z-[2000]">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border-b border-slate-100 last:border-0 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-emerald-700">📍</span>
                  <span className="truncate">{res.formattedAddress}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isDetectingGPS}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold shadow-sm cursor-pointer transition-transform active:scale-95 disabled:opacity-60 flex-shrink-0"
          title="Detect Current GPS Location"
        >
          {isDetectingGPS ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isDetectingGPS ? 'Detecting...' : 'Detect GPS'}</span>
        </button>
      </div>

      {/* Map Canvas */}
      <div ref={containerRef} className={className} />

      {/* Bottom Coordinates & Address Banner */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200 shadow-md text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse flex-shrink-0"></span>
          <p className="text-[11px] text-slate-700 truncate">
            {resolvedAddress ? (
              <span className="font-semibold">{resolvedAddress}</span>
            ) : (
              <span>Coordinates: {currentLat.toFixed(5)}, {currentLng.toFixed(5)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-slate-500 font-medium">
          <span>Reachable Radius: {coverageRadiusKm}km</span>
        </div>
      </div>
    </div>
  );
};
