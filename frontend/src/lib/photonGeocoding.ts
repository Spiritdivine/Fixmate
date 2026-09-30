/**
 * Photon by Komoot Geocoding Engine
 * 100% Free OpenStreetMap-based Search & Autocomplete
 * Zero API keys, zero commercial billing traps, optimized for Nigerian addresses & landmarks.
 */

export interface SuggestedPlace {
  label: string;
  name: string;
  street?: string;
  lgaCity?: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

/**
 * Searches places, streets, and landmarks in Nigeria using Photon.
 * Biased towards Nigerian central coordinates (Lat: 9.0820, Lon: 8.6753).
 */
export async function searchNigerianPlaces(
  query: string,
  limit: number = 6
): Promise<SuggestedPlace[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  try {
    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.append('q', trimmed);
    url.searchParams.append('limit', String(limit));
    // Focus search around Nigeria
    url.searchParams.append('lat', '9.0820');
    url.searchParams.append('lon', '8.6753');

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.features)) {
      return [];
    }

    return data.features.map((feat: PhotonFeature) => {
      const p = feat.properties;
      const coords = feat.geometry.coordinates;

      const stateClean = p.state?.replace(/\s+State$/i, '') || '';
      const lgaCityClean = p.city || p.district || p.name || '';
      const streetClean = [p.housenumber, p.street].filter(Boolean).join(' ');

      const parts = [p.name, streetClean, lgaCityClean, stateClean, p.country || 'Nigeria']
        .filter(Boolean)
        .filter((item, index, arr) => arr.indexOf(item) === index); // deduplicate

      return {
        label: parts.join(', '),
        name: p.name || 'Location',
        street: streetClean || undefined,
        lgaCity: lgaCityClean || undefined,
        state: stateClean || undefined,
        country: p.country || 'Nigeria',
        latitude: coords[1],
        longitude: coords[0],
      };
    });
  } catch (error) {
    console.warn('[Photon] Nigerian location search failed:', error);
    return [];
  }
}
