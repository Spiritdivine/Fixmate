import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArtisanProfile } from '../../types';
import { createArtisanIcon, createUserLocationIcon } from './ArtisanMapMarker';
import { createArtisanPopupElement } from './ArtisanMapPopup';
import { TileLayerWithFallback } from './TileLayerWithFallback';
import { TouchScrollGuard } from './TouchScrollGuard';
import { ArtisanMarkerCluster } from './ArtisanMarkerCluster';
import { WifiOff, Layers } from 'lucide-react';

export interface ViewportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface MapViewProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  userCoordinates?: { latitude: number; longitude: number } | null;
  radiusKm?: number | null;
  artisans?: ArtisanProfile[];
  selectedArtisanId?: string | null;
  enableClustering?: boolean;
  onSelectArtisan?: (artisanId: string) => void;
  onNavigateProfile?: (artisanId: string) => void;
  onCenterChange?: (coords: { lat: number; lng: number }) => void;
  onViewportChange?: (bounds: ViewportBounds) => void;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  center,
  zoom = 13,
  userCoordinates,
  radiusKm,
  artisans = [],
  selectedArtisanId,
  enableClustering = true,
  onSelectArtisan,
  onNavigateProfile,
  onCenterChange,
  onViewportChange,
  className = 'w-full h-full min-h-[420px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [isUsingFallbackTiles, setIsUsingFallbackTiles] = useState(false);
  const [isAllTilesFailed, setIsAllTilesFailed] = useState(false);

  // 1. Initialize Map Instance (Only Once on Mount)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Multi-CDN Fallback Tile Layer: CartoDB Voyager primary -> OSM secondary
    const tileLayer = new TileLayerWithFallback(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
        onFallbackUsed: () => setIsUsingFallbackTiles(true),
        onAllFailed: () => setIsAllTilesFailed(true),
      }
    );
    tileLayer.addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Marker Layer Group (for non-clustered mode)
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Viewport drag/zoom end handler
    map.on('moveend', () => {
      const current = map.getCenter();
      onCenterChange?.({ lat: current.lat, lng: current.lng });

      const bounds = map.getBounds();
      onViewportChange?.({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    });

    mapRef.current = map;
    setMapInstance(map);

    // Strict Unmount Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      markersLayerRef.current = null;
      userMarkerRef.current = null;
      radiusCircleRef.current = null;
      markerMapRef.current.clear();
    };
  }, []);

  // 2. Smoothly fly to center coordinates when center prop updates
  useEffect(() => {
    if (!mapRef.current) return;
    const current = mapRef.current.getCenter();
    const distanceThreshold = 0.001;
    if (
      Math.abs(current.lat - center[0]) > distanceThreshold ||
      Math.abs(current.lng - center[1]) > distanceThreshold
    ) {
      mapRef.current.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center[0], center[1], zoom]);

  // 3. Render or Update User Location Pin
  useEffect(() => {
    if (!mapRef.current) return;

    if (userCoordinates) {
      const userLatLng: [number, number] = [
        userCoordinates.latitude,
        userCoordinates.longitude,
      ];

      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(userLatLng, {
          icon: createUserLocationIcon(),
          zIndexOffset: 1000,
        }).addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLatLng(userLatLng);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userCoordinates?.latitude, userCoordinates?.longitude]);

  // 4. Render or Update Radius Boundary Circle
  useEffect(() => {
    if (!mapRef.current) return;

    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    if (radiusKm && radiusKm > 0) {
      radiusCircleRef.current = L.circle(center, {
        radius: radiusKm * 1000,
        color: '#059669', // Emerald 600
        weight: 1.5,
        fillColor: '#10b981',
        fillOpacity: 0.06,
        dashArray: '6, 8',
      }).addTo(mapRef.current);
    }

    return () => {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
      }
    };
  }, [center[0], center[1], radiusKm]);

  // 5. Synchronize Artisan Markers Layer (When clustering is off)
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // If clustering is enabled, ArtisanMarkerCluster manages the pins
    if (enableClustering) {
      markersLayerRef.current.clearLayers();
      markerMapRef.current.clear();
      return;
    }

    markersLayerRef.current.clearLayers();
    markerMapRef.current.clear();

    artisans.forEach((artisan) => {
      const lat =
        artisan.displayLatitude != null
          ? Number(artisan.displayLatitude)
          : artisan.latitude != null
          ? Number(artisan.latitude)
          : null;

      const lng =
        artisan.displayLongitude != null
          ? Number(artisan.displayLongitude)
          : artisan.longitude != null
          ? Number(artisan.longitude)
          : null;

      if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return;

      const isSelected = artisan.id === selectedArtisanId;
      const primaryCategory = artisan.skills?.[0]?.skill?.name || '';

      const marker = L.marker([lat, lng], {
        icon: createArtisanIcon({
          id: artisan.id,
          businessName: artisan.businessName || 'Artisan',
          category: primaryCategory,
          ratingAvg: artisan.ratingAvg,
          hourlyRate: artisan.hourlyRate || undefined,
          isAvailable: artisan.isAvailable,
          distanceKm: artisan.distanceKm,
          isSelected,
        }),
        zIndexOffset: isSelected ? 500 : 10,
      });

      const popupContent = createArtisanPopupElement(artisan, onNavigateProfile);
      marker.bindPopup(popupContent, {
        offset: [0, -32],
        maxWidth: 280,
        className: 'custom-artisan-leaflet-popup',
      });

      marker.on('click', () => {
        onSelectArtisan?.(artisan.id);
      });

      marker.addTo(markersLayerRef.current!);
      markerMapRef.current.set(artisan.id, marker);

      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [artisans, selectedArtisanId, enableClustering, onSelectArtisan, onNavigateProfile]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[24px] border border-slate-200 shadow-sm bg-slate-100">
      <div ref={containerRef} className={className} />

      {/* Touch Trapping Guard for Mobile Devices */}
      <TouchScrollGuard map={mapInstance} />

      {/* Clustered Marker Layer */}
      {enableClustering && (
        <ArtisanMarkerCluster
          map={mapInstance}
          artisans={artisans}
          selectedArtisanId={selectedArtisanId}
          onSelectArtisan={(artisan) => {
            onSelectArtisan?.(artisan.id);
          }}
          enableClustering={true}
        />
      )}

      {/* Network / Fallback Tile Notification */}
      {isUsingFallbackTiles && !isAllTilesFailed && (
        <div className="absolute top-3 right-3 z-[1000] px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-semibold border border-amber-400/40 shadow-md flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          <span>Secondary CDN Map Active</span>
        </div>
      )}

      {isAllTilesFailed && (
        <div className="absolute top-3 right-3 z-[1000] px-2.5 py-1 rounded-full bg-rose-900/80 backdrop-blur-md text-rose-200 text-[10px] font-semibold border border-rose-500/40 shadow-md flex items-center gap-1.5">
          <WifiOff className="w-3 h-3" />
          <span>Offline Tile Cache</span>
        </div>
      )}
    </div>
  );
};
