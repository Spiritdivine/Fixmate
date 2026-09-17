import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  CheckCircle2,
  Bookmark,
  Eye,
  Send,
  LocateFixed,
  Map as MapIcon,
  List as ListIcon,
  Loader2,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { ArtisanProfile, JobCategory, ApiResponse, PaginationMeta } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { Avatar } from '../../components/ui/Avatar';
import { MapView } from '../../components/map/MapView';
import { GeolocationService, DEFAULT_NIGERIAN_COORDINATES } from '../../lib/geolocation';
import { useNearbyArtisans, ViewportBoundingBox } from '../../hooks/useNearbyArtisans';
import { useMapSync } from '../../hooks/useMapSync';

export const FindArtisansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [savedArtisanIds, setSavedArtisanIds] = useState<Set<string>>(new Set());

  // Geolocation & Spatial State
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    DEFAULT_NIGERIAN_COORDINATES.latitude,
    DEFAULT_NIGERIAN_COORDINATES.longitude,
  ]);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(15);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Viewport Bounding Box States (Phase 5 "Search This Area")
  const [viewportBBox, setViewportBBox] = useState<ViewportBoundingBox | null>(null);
  const [pendingBBox, setPendingBBox] = useState<ViewportBoundingBox | null>(null);
  const [autoSearchOnMove, setAutoSearchOnMove] = useState<boolean>(false);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState<boolean>(false);

  // Responsive Mobile View State ('list' | 'map')
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list');

  // Bi-directional Map & Card Synchronization Hook
  const { selectedArtisanId, selectArtisan, hoverArtisan } = useMapSync();

  // 1. Automatically attempt to detect user location on mount
  useEffect(() => {
    let isMounted = true;

    const detectLocation = async () => {
      setIsLocating(true);
      const result = await GeolocationService.getCurrentPosition();
      if (!isMounted) return;

      setUserCoords(result.coordinates);
      setMapCenter([result.coordinates.latitude, result.coordinates.longitude]);
      if (result.isFallback && result.error) {
        setLocationNotice(result.error);
      }
      setIsLocating(false);
    };

    detectLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Categories for Filter Dropdown
  const { data: categories = [] } = useQuery<JobCategory[]>({
    queryKey: ['job-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<JobCategory[] | { categories: JobCategory[] }>>(
        '/jobs/categories'
      );
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.categories) || [];
    },
  });

  // 3. Spatial Query: Fetch Nearby Artisans using our Phase 1 Spatial API
  const {
    data: nearbyData,
    isLoading: isNearbyLoading,
    refetch: refetchNearby,
  } = useNearbyArtisans({
    lat: mapCenter[0],
    lng: mapCenter[1],
    radius: searchRadius,
    bbox: viewportBBox,
    categoryId: selectedCategory,
    minRating,
    search: searchTerm,
    isAvailable: onlyAvailable,
    enabled: true,
  });

  // 4. Fallback: Fetch regular directory if no coordinates or state-filtered
  const { data: regularArtisans = [], isLoading: isRegularLoading } = useQuery<ArtisanProfile[]>({
    queryKey: ['find-artisans-regular', searchTerm, selectedCategory, selectedState, minRating, onlyAvailable],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedState) params.append('state', selectedState);
      if (minRating) params.append('minRating', minRating);
      if (onlyAvailable) params.append('isAvailable', 'true');

      const { data } = await apiClient.get<
        ApiResponse<ArtisanProfile[] | { artisans: ArtisanProfile[]; meta?: PaginationMeta }>
      >(`/profiles/artisans?${params.toString()}`);
      return (Array.isArray(data.data) ? data.data : (data.data as any)?.artisans) || [];
    },
    enabled: Boolean(selectedState), // Only use regular query if explicitly filtering by a state
  });

  // 5. Fetch Saved Artisans to highlight bookmarks
  useQuery<Set<string>>({
    queryKey: ['saved-artisans-ids'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<ApiResponse<any[] | { savedArtisans: { artisanProfileId: string }[] }>>(
          '/profiles/saved-artisans'
        );
        const list = (Array.isArray(data.data) ? data.data : (data.data as any)?.savedArtisans) || [];
        const ids = new Set<string>(list.map((s: any) => String(s.artisanProfileId || s.id)));
        setSavedArtisanIds(ids);
        return ids;
      } catch {
        return new Set<string>();
      }
    },
  });

  // 6. Toggle Save/Bookmark Mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ artisanId, isSaved }: { artisanId: string; isSaved: boolean }) => {
      if (isSaved) {
        await apiClient.delete(`/profiles/artisans/${artisanId}/save`);
      } else {
        await apiClient.post(`/profiles/artisans/${artisanId}/save`);
      }
      return { artisanId, isSaved };
    },
    onSuccess: ({ artisanId, isSaved }) => {
      setSavedArtisanIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(artisanId);
        else next.add(artisanId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['saved-artisans-ids'] });
    },
  });

  // Determine active artisans list
  const isSpatialMode = !selectedState;
  const artisans = isSpatialMode ? nearbyData?.artisans || [] : regularArtisans;
  const isLoading = isSpatialMode ? isNearbyLoading : isRegularLoading;
  const totalCount = isSpatialMode ? nearbyData?.meta?.total ?? artisans.length : artisans.length;

  // Handle "Use My Current Location" button click
  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocationNotice(null);
    setViewportBBox(null);
    setShowSearchAreaButton(false);
    const result = await GeolocationService.getCurrentPosition({ timeout: 10000 });
    setUserCoords(result.coordinates);
    setMapCenter([result.coordinates.latitude, result.coordinates.longitude]);
    setSelectedState(''); // Clear state filter to prioritize GPS radius

    if (result.isFallback && result.error) {
      setLocationNotice(result.error);
    }
    setIsLocating(false);
  };

  // Navigate to public profile
  const handleNavigateProfile = useCallback(
    (artisanId: string) => {
      navigate(`/client/artisans/${artisanId}`);
    },
    [navigate]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-dashboard pb-16">
      {/* Page Title & Saved Artisans Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Find Nearby Artisans
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Compass className="w-3.5 h-3.5 animate-spin-slow" />
              Live Map
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Discover verified tradespeople near your location with on-chain escrow & reviews.
          </p>
        </div>

        <Link
          to="/client/saved-artisans"
          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-xs border border-slate-200 cursor-pointer w-fit"
        >
          <Bookmark className="w-4 h-4 text-emerald-800" />
          <span>Saved Artisans ({savedArtisanIds.size})</span>
        </Link>
      </div>

      {/* Filter & Geolocation Control Bar */}
      <div className="p-5 rounded-[24px] bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search skill or business..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-transparent focus:border-emerald-500 focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-transparent focus:border-emerald-500 focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Rating */}
          <div className="relative">
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-transparent focus:border-emerald-500 focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 cursor-pointer"
            >
              <option value="">Any Rating</option>
              <option value="4.5">★ 4.5 &amp; Above</option>
              <option value="4.0">★ 4.0 &amp; Above</option>
              <option value="3.5">★ 3.5 &amp; Above</option>
            </select>
          </div>

          {/* State / Region (Overrides GPS radius) */}
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-slate-50 border border-transparent focus:border-emerald-500 focus:bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 cursor-pointer"
            >
              <option value="">Radius Search (GPS)</option>
              <option value="Lagos">Lagos State</option>
              <option value="Abuja">Abuja (FCT)</option>
              <option value="Rivers">Rivers State</option>
              <option value="Oyo">Oyo State</option>
              <option value="Ogun">Ogun State</option>
            </select>
          </div>
        </div>

        {/* Spatial Radius Chips & "Near Me" GPS Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Use Device GPS"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5" />
              )}
              <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
            </button>

            {/* Radius Selector Chips (Active in Spatial Mode) */}
            {isSpatialMode && (
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 px-2">Radius:</span>
                {[5, 10, 15, 25, 50].map((km) => (
                  <button
                    key={km}
                    onClick={() => setSearchRadius(km)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      searchRadius === km
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {km}km
                  </button>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 ml-2">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-600 border-slate-300 cursor-pointer"
              />
              <span>Available Now</span>
            </label>
          </div>

          {(searchTerm || selectedCategory || selectedState || minRating || searchRadius !== 15) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedState('');
                setMinRating('');
                setSearchRadius(15);
                setOnlyAvailable(true);
              }}
              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {locationNotice && (
          <div className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
            ℹ️ {locationNotice}
          </div>
        )}
      </div>

      {/* Main Split-Screen Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Scrollable Artisan Cards List */}
        <div
          className={`space-y-4 ${
            mobileViewMode === 'map' ? 'hidden lg:block' : 'block'
          } lg:col-span-7 xl:col-span-7`}
        >
          {/* Results Summary Header */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isLoading ? (
                'Locating nearby artisans...'
              ) : (
                <>
                  Found <span className="text-slate-900 font-extrabold">{totalCount}</span> verified{' '}
                  {totalCount === 1 ? 'artisan' : 'artisans'}
                  {isSpatialMode ? ` within ${searchRadius}km radius` : ` in ${selectedState}`}
                </>
              )}
            </p>
          </div>

          {/* Cards Container */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="p-5 bg-white rounded-[24px] border border-slate-200 animate-pulse space-y-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-8 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : artisans.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-[24px] border border-dashed border-slate-200 shadow-xs space-y-3">
              <Search className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">
                {viewportBBox
                  ? 'No artisans found in this visible area'
                  : `No artisans found within ${searchRadius}km`}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No verified artisans currently matched your filters here. Try expanding your search
                reach or clearing active filters.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewportBBox(null);
                    setSearchRadius(25);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  Expand to 25km
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewportBBox(null);
                    setSearchRadius(50);
                  }}
                  className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-full hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                >
                  Expand to 50km
                </button>
                {(selectedCategory || minRating || searchTerm || viewportBBox) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('');
                      setMinRating('');
                      setSearchTerm('');
                      setViewportBBox(null);
                      setShowSearchAreaButton(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                )}
                {userCoords && (
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full transition-colors cursor-pointer"
                  >
                    Reset to My GPS
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {artisans.map((artisan) => {
                const isSaved = savedArtisanIds.has(artisan.id);
                const isSelected = selectedArtisanId === artisan.id;
                const displayName =
                  artisan.businessName || artisan.user?.email?.split('@')[0] || 'Artisan';

                return (
                  <div
                    key={artisan.id}
                    id={`artisan-card-${artisan.id}`}
                    onMouseEnter={() => hoverArtisan(artisan.id)}
                    onMouseLeave={() => hoverArtisan(null)}
                    onClick={() => selectArtisan(artisan.id)}
                    className={`p-5 rounded-[24px] bg-white border transition-all duration-200 shadow-xs cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row: Avatar, Info, Bookmark */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={artisan.user?.avatarUrl}
                          name={displayName}
                          size="md"
                          isOnline={artisan.isAvailable}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900 truncate hover:text-emerald-800 transition-colors">
                              {displayName}
                            </h3>
                            {artisan.user?.isKycVerified && (
                              <span title="KYC Verified Artisan">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {artisan.lgaCity}, {artisan.state}
                              </span>
                            </p>

                            {/* Proximity Distance Badge */}
                            {artisan.distanceKm != null && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                📍 {artisan.distanceKm} km away
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          bookmarkMutation.mutate({ artisanId: artisan.id, isSaved });
                        }}
                        disabled={bookmarkMutation.isPending}
                        className={`p-2 rounded-full transition-colors shrink-0 cursor-pointer ${
                          isSaved
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isSaved ? 'Remove from Saved' : 'Save Artisan'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-600' : ''}`} />
                      </button>
                    </div>

                    {/* Tagline / Bio */}
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                      {artisan.tagline ||
                        artisan.bio ||
                        'Experienced craftsperson delivering vetted domestic and commercial services.'}
                    </p>

                    {/* Skills pills */}
                    {artisan.skills && artisan.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {artisan.skills.slice(0, 3).map((s) => (
                          <span
                            key={s.skill.id}
                            className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600"
                          >
                            {s.skill.name}
                          </span>
                        ))}
                        {artisan.skills.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400 font-semibold bg-slate-50">
                            +{artisan.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bottom Row: Rating, Rate & Profile CTA */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{Number(artisan.ratingAvg || 0).toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">
                            ({artisan.reviewCount || 0})
                          </span>
                        </div>
                        <span className="text-slate-300">·</span>
                        <div className="font-bold text-slate-900">
                          {artisan.hourlyRate
                            ? `${formatCurrency(Number(artisan.hourlyRate))}/hr`
                            : 'Custom Quote'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/client/artisans/${artisan.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to={`/client/artisans/${artisan.id}?action=invite`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Hire</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Interactive Map */}
        <div
          className={`${
            mobileViewMode === 'list' ? 'hidden lg:block' : 'block'
          } lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6`}
        >
          <div className="h-[580px] w-full rounded-[24px] overflow-hidden shadow-sm border border-slate-200 relative">
            <MapView
              center={mapCenter}
              zoom={searchRadius <= 10 ? 13 : searchRadius <= 25 ? 12 : 11}
              userCoordinates={userCoords}
              radiusKm={isSpatialMode && !viewportBBox ? searchRadius : undefined}
              artisans={artisans}
              selectedArtisanId={selectedArtisanId}
              onSelectArtisan={selectArtisan}
              onNavigateProfile={handleNavigateProfile}
              onCenterChange={(coords) => {
                setMapCenter([coords.lat, coords.lng]);
              }}
              onViewportChange={(bounds) => {
                setPendingBBox(bounds);
                if (autoSearchOnMove) {
                  setViewportBBox(bounds);
                } else {
                  setShowSearchAreaButton(true);
                }
              }}
              className="w-full h-full"
            />

            {/* Floating "Search This Area" Pill Button */}
            {showSearchAreaButton && !autoSearchOnMove && (
              <button
                type="button"
                onClick={() => {
                  if (pendingBBox) {
                    setViewportBBox(pendingBBox);
                    setShowSearchAreaButton(false);
                  }
                }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xl flex items-center gap-1.5 transition-all transform active:scale-95 border border-emerald-400/50 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search this area</span>
              </button>
            )}

            {/* Map Legend & Auto-search Toggle Overlay */}
            <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{viewportBBox ? 'Viewport Mode' : 'Available Pins'}</span>
                <span className="text-slate-300">|</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Your Location</span>
              </div>

              <label className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm text-[10px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSearchOnMove}
                  onChange={(e) => {
                    setAutoSearchOnMove(e.target.checked);
                    if (e.target.checked && pendingBBox) {
                      setViewportBBox(pendingBBox);
                      setShowSearchAreaButton(false);
                    }
                  }}
                  className="w-3 h-3 text-emerald-600 rounded"
                />
                <span>Auto-search as map moves</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Floating View Switcher for Mobile Screens */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
        <button
          onClick={() => setMobileViewMode((prev) => (prev === 'list' ? 'map' : 'list'))}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl cursor-pointer transition-transform active:scale-95 border border-slate-700"
        >
          {mobileViewMode === 'list' ? (
            <>
              <MapIcon className="w-4 h-4 text-emerald-400" />
              <span>Show Map ({artisans.length})</span>
            </>
          ) : (
            <>
              <ListIcon className="w-4 h-4 text-emerald-400" />
              <span>Show List ({artisans.length})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
