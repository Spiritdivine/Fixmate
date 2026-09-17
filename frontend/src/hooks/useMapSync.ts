import { useState, useCallback } from 'react';

export function useMapSync() {
  const [selectedArtisanId, setSelectedArtisanId] = useState<string | null>(null);
  const [hoveredArtisanId, setHoveredArtisanId] = useState<string | null>(null);

  const scrollToArtisan = useCallback((artisanId: string) => {
    setSelectedArtisanId(artisanId);
    const element = document.getElementById(`artisan-card-${artisanId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50/30');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50/30');
      }, 2500);
    }
  }, []);

  const selectArtisan = useCallback((artisanId: string) => {
    scrollToArtisan(artisanId);
  }, [scrollToArtisan]);

  const hoverArtisan = useCallback((artisanId: string | null) => {
    setHoveredArtisanId(artisanId);
  }, []);

  return {
    selectedArtisanId,
    hoveredArtisanId,
    selectArtisan,
    hoverArtisan,
    scrollToArtisan,
  };
}
