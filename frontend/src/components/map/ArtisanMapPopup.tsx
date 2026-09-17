import { ArtisanProfile } from '../../types';
import { formatCurrency } from '../../lib/formatters';

/**
 * Generates rich HTML DOM node for Leaflet popup rendering with sanitized content.
 */
export function createArtisanPopupElement(
  artisan: ArtisanProfile,
  onNavigateProfile?: (artisanId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'p-3 w-64 font-dashboard text-slate-800 space-y-2.5';

  const avatarUrl =
    artisan.user?.avatarUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      artisan.businessName || 'Artisan'
    )}`;

  const rating = Number(artisan.ratingAvg || 0).toFixed(1);
  const primarySkill = artisan.skills?.[0]?.skill?.name || 'Verified Artisan';
  const hourlyRate =
    artisan.hourlyRate != null ? formatCurrency(Number(artisan.hourlyRate)) : null;

  container.innerHTML = `
    <div class="flex items-start gap-3">
      <img 
        src="${avatarUrl}" 
        alt="${artisan.businessName || 'Artisan'}" 
        class="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs flex-shrink-0"
      />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1">
          <h4 class="font-bold text-xs text-slate-900 truncate leading-tight">
            ${artisan.businessName || 'Verified Artisan'}
          </h4>
          ${
            artisan.user?.isKycVerified
              ? `<span title="KYC Verified" class="text-emerald-600 flex-shrink-0">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </span>`
              : ''
          }
        </div>
        <p class="text-[11px] font-medium text-emerald-700 truncate mt-0.5">${primarySkill}</p>
        <p class="text-[10px] text-slate-400 truncate">${artisan.lgaCity}, ${artisan.state}</p>
      </div>
    </div>

    <!-- Rating & Proximity Bar -->
    <div class="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg text-[11px]">
      <div class="flex items-center gap-1 font-bold text-slate-800">
        <span class="text-amber-500">★</span>
        <span>${rating}</span>
        <span class="font-normal text-slate-400">(${artisan.reviewCount || 0})</span>
      </div>
      ${
        artisan.distanceKm != null
          ? `<div class="flex items-center gap-1 font-semibold text-emerald-700">
               <span>📍</span>
               <span>${artisan.distanceKm} km away</span>
             </div>`
          : ''
      }
    </div>

    <!-- Hourly Rate & Action -->
    <div class="flex items-center justify-between pt-1 border-t border-slate-100">
      <div>
        <p class="text-[9px] uppercase tracking-wider font-bold text-slate-400">Rate</p>
        <p class="text-xs font-bold text-slate-900">${hourlyRate ? `${hourlyRate}/hr` : 'Negotiable'}</p>
      </div>
      <button 
        id="popup-view-profile-btn-${artisan.id}"
        class="bg-emerald-800 hover:bg-emerald-900 text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
      >
        View Profile →
      </button>
    </div>
  `;

  // Attach event listener to View Profile button
  const button = container.querySelector(`#popup-view-profile-btn-${artisan.id}`);
  if (button && onNavigateProfile) {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onNavigateProfile(artisan.id);
    });
  }

  return container;
}
