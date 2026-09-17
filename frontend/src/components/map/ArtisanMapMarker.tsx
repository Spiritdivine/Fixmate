import L from 'leaflet';

export interface MarkerConfig {
  id: string;
  businessName: string;
  category?: string;
  ratingAvg: number | string;
  hourlyRate?: number | string;
  isAvailable: boolean;
  distanceKm?: number;
  isSelected?: boolean;
}

/**
 * Trade Category SVG Path & Color Mapping
 */
function getCategoryIconConfig(categoryName: string = '') {
  const normalized = categoryName.toLowerCase();

  if (normalized.includes('electric') || normalized.includes('solar') || normalized.includes('wire')) {
    return {
      bg: 'bg-amber-500',
      activeRing: 'ring-amber-400',
      svg: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>`,
    };
  }

  if (normalized.includes('plumb') || normalized.includes('pipe') || normalized.includes('drain')) {
    return {
      bg: 'bg-sky-600',
      activeRing: 'ring-sky-400',
      svg: `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor"/>`,
    };
  }

  if (normalized.includes('carpent') || normalized.includes('wood') || normalized.includes('furniture')) {
    return {
      bg: 'bg-emerald-600',
      activeRing: 'ring-emerald-400',
      svg: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="currentColor"/>`,
    };
  }

  if (normalized.includes('paint') || normalized.includes('pop')) {
    return {
      bg: 'bg-purple-600',
      activeRing: 'ring-purple-400',
      svg: `<path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" fill="currentColor"/><path d="M9 8c-2 3-4 3.5-7 4l8 8c.5-3 1-5 4-7" fill="currentColor"/>`,
    };
  }

  if (normalized.includes('ac') || normalized.includes('hvac') || normalized.includes('cool')) {
    return {
      bg: 'bg-cyan-600',
      activeRing: 'ring-cyan-400',
      svg: `<path d="M12 12c0-3 2.5-5.5 5.5-5.5S23 9 23 12s-2.5 5.5-5.5 5.5S12 15 12 12z" fill="currentColor"/><path d="M12 12c0 3-2.5 5.5-5.5 5.5S1 15 1 12s2.5-5.5 5.5-5.5S12 9 12 12z" fill="currentColor"/>`,
    };
  }

  // Default Artisan / Trade Wrench Icon
  return {
    bg: 'bg-slate-800',
    activeRing: 'ring-slate-400',
    svg: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="currentColor"/>`,
  };
}

/**
 * Generates an interactive HTML DivIcon for an artisan.
 */
export function createArtisanIcon(config: MarkerConfig): L.DivIcon {
  const isSelected = Boolean(config.isSelected);
  const rating = Number(config.ratingAvg || 0).toFixed(1);
  const iconConfig = getCategoryIconConfig(config.category);

  const html = `
    <div class="artisan-marker-wrapper relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
      isSelected ? 'scale-125 -translate-y-2 z-[9999]' : 'hover:scale-110 hover:-translate-y-1 z-[100]'
    }">
      <!-- Rating / Distance Pill Tag -->
      <div class="px-2 py-0.5 mb-1 rounded-full text-[10px] font-bold tracking-tight shadow-md whitespace-nowrap transition-all ${
        isSelected
          ? 'bg-slate-900 text-white ring-2 ring-emerald-500 scale-105'
          : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-900 hover:text-white'
      }">
        ★ ${rating} ${config.distanceKm != null ? `· ${config.distanceKm}km` : ''}
      </div>

      <!-- Main Pin Body -->
      <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all text-white ${iconConfig.bg} ${
        isSelected ? `ring-4 ${iconConfig.activeRing} shadow-emerald-500/30` : ''
      }">
        <svg class="w-4 h-4 text-white" viewBox="0 0 24 24">
          ${iconConfig.svg}
        </svg>
      </div>

      <!-- Online / Available Pulse Beacon -->
      ${
        config.isAvailable
          ? `<span class="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
               <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
             </span>`
          : ''
      }

      <!-- Downward Pin Pointer Arrow -->
      <div class="w-2 h-2 -mt-1 rotate-45 border-r border-b border-white ${iconConfig.bg} shadow-xs"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-artisan-pin-container',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -48],
  });
}

/**
 * Generates the pulsing blue marker representing the client's current device location.
 */
export function createUserLocationIcon(): L.DivIcon {
  const html = `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute w-8 h-8 bg-blue-500/25 rounded-full animate-ping"></div>
      <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'user-location-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}
