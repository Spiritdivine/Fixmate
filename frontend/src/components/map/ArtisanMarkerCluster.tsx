import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ArtisanProfile } from '../../types';
import { createArtisanIcon } from './ArtisanMapMarker';
import { createArtisanPopupElement } from './ArtisanMapPopup';

export interface ArtisanMarkerClusterProps {
  map: L.Map | null;
  artisans: ArtisanProfile[];
  selectedArtisanId?: string | null;
  onSelectArtisan?: (artisan: ArtisanProfile) => void;
  enableClustering?: boolean;
}

interface ClusterGroup {
  id: string;
  lat: number;
  lng: number;
  artisans: ArtisanProfile[];
}

export const ArtisanMarkerCluster: React.FC<ArtisanMarkerClusterProps> = ({
  map,
  artisans,
  selectedArtisanId,
  onSelectArtisan,
  enableClustering = true,
}) => {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [spiderfiedClusterId, setSpiderfiedClusterId] = useState<string | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const zoom = map.getZoom();

    // 1. Group proximate artisans into clusters
    const clusters: ClusterGroup[] = [];
    const clusterThreshold = enableClustering
      ? zoom >= 17
        ? 0.0003
        : zoom >= 15
        ? 0.001
        : zoom >= 13
        ? 0.004
        : 0.01
      : 0.00001;

    artisans.forEach((artisan) => {
      const lat = Number(artisan.displayLatitude || artisan.latitude);
      const lng = Number(artisan.displayLongitude || artisan.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const existing = clusters.find((c) => {
        const dLat = Math.abs(c.lat - lat);
        const dLng = Math.abs(c.lng - lng);
        return dLat < clusterThreshold && dLng < clusterThreshold;
      });

      if (existing && enableClustering) {
        existing.artisans.push(artisan);
      } else {
        clusters.push({
          id: `cluster_${artisan.id}`,
          lat,
          lng,
          artisans: [artisan],
        });
      }
    });

    // 2. Render Clusters and Markers
    clusters.forEach((cluster) => {
      const isSpiderfied = spiderfiedClusterId === cluster.id;

      // Case A: Single Artisan Marker
      if (cluster.artisans.length === 1 && !isSpiderfied) {
        const artisan = cluster.artisans[0];
        const isSelected = selectedArtisanId === artisan.id;
        const primaryCategory = artisan.skills?.[0]?.skill?.name || '';
        const icon = createArtisanIcon({
          id: artisan.id,
          businessName: artisan.businessName || 'Artisan',
          category: primaryCategory,
          ratingAvg: artisan.ratingAvg,
          hourlyRate: artisan.hourlyRate || undefined,
          isAvailable: artisan.isAvailable,
          distanceKm: artisan.distanceKm,
          isSelected,
        });

        const marker = L.marker([cluster.lat, cluster.lng], {
          icon,
          zIndexOffset: isSelected ? 1000 : 100,
        });

        const popupContent = createArtisanPopupElement(artisan);
        marker.bindPopup(popupContent, {
          className: 'fixmate-custom-popup',
          closeButton: false,
          offset: [0, -32],
          maxWidth: 290,
        });

        marker.on('click', () => {
          if (onSelectArtisan) onSelectArtisan(artisan);
        });

        layerGroup.addLayer(marker);
        return;
      }

      // Case B: Spiderfied Cluster (Expanded Spiral)
      if (isSpiderfied) {
        const count = cluster.artisans.length;
        const spiderRadiusDeg = 0.0007; // ~75 meters visual radius

        cluster.artisans.forEach((artisan, index) => {
          const angle = (index / count) * 2 * Math.PI;
          const sLat = cluster.lat + spiderRadiusDeg * Math.sin(angle);
          const sLng = cluster.lng + spiderRadiusDeg * Math.cos(angle) * 1.2;
          const isSelected = selectedArtisanId === artisan.id;

          // Connective tether line back to origin
          const line = L.polyline(
            [
              [cluster.lat, cluster.lng],
              [sLat, sLng],
            ],
            {
              color: '#10b981',
              weight: 2,
              dashArray: '3, 4',
              opacity: 0.8,
            }
          );
          layerGroup.addLayer(line);

          // Individual marker
          const primaryCategory = artisan.skills?.[0]?.skill?.name || '';
          const icon = createArtisanIcon({
            id: artisan.id,
            businessName: artisan.businessName || 'Artisan',
            category: primaryCategory,
            ratingAvg: artisan.ratingAvg,
            hourlyRate: artisan.hourlyRate || undefined,
            isAvailable: artisan.isAvailable,
            distanceKm: artisan.distanceKm,
            isSelected,
          });

          const marker = L.marker([sLat, sLng], {
            icon,
            zIndexOffset: isSelected ? 1200 : 500,
          });

          const popupContent = createArtisanPopupElement(artisan);
          marker.bindPopup(popupContent, {
            className: 'fixmate-custom-popup',
            closeButton: false,
            offset: [0, -32],
            maxWidth: 290,
          });

          marker.on('click', () => {
            if (onSelectArtisan) onSelectArtisan(artisan);
          });

          layerGroup.addLayer(marker);
        });

        // Center collapse button
        const centerIcon = L.divIcon({
          html: `
            <div class="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border-2 border-emerald-400 shadow-xl cursor-pointer hover:scale-110 transition-transform" title="Collapse artisans">
              ✕
            </div>
          `,
          className: 'cluster-collapse-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const collapseMarker = L.marker([cluster.lat, cluster.lng], {
          icon: centerIcon,
          zIndexOffset: 1500,
        });

        collapseMarker.on('click', () => {
          setSpiderfiedClusterId(null);
        });

        layerGroup.addLayer(collapseMarker);
        return;
      }

      // Case C: Grouped Cluster Badge
      const count = cluster.artisans.length;
      const clusterIcon = L.divIcon({
        html: `
          <div class="relative group cursor-pointer">
            <div class="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping"></div>
            <div class="relative flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 border-2 border-emerald-400 text-white shadow-2xl transition-all duration-300 group-hover:scale-110">
              <span class="text-xs font-black text-emerald-300">${count}</span>
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-sm text-[9px] font-bold text-white whitespace-nowrap shadow-md border border-slate-700 pointer-events-none">
              ${count} Artisans
            </div>
          </div>
        `,
        className: 'custom-artisan-cluster-pin',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const clusterMarker = L.marker([cluster.lat, cluster.lng], {
        icon: clusterIcon,
        zIndexOffset: 300,
      });

      clusterMarker.on('click', () => {
        if (zoom < 16) {
          map.flyTo([cluster.lat, cluster.lng], Math.min(zoom + 2, 17), {
            duration: 0.8,
          });
        } else {
          setSpiderfiedClusterId(cluster.id);
        }
      });

      layerGroup.addLayer(clusterMarker);
    });

    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }
    };
  }, [map, artisans, selectedArtisanId, spiderfiedClusterId, enableClustering]);

  return null;
};
