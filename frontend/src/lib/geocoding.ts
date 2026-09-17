/**
 * Geocoding Service Module
 * Implements OpenStreetMap Nominatim forward & reverse geocoding
 * with local in-memory caching and Nigerian administrative normalization.
 */

export interface GeocodedAddress {
  formattedAddress: string;
  streetNumber?: string;
  road?: string;
  suburb?: string;
  lgaCity?: string;
  state?: string;
  country?: string;
  postcode?: string;
  latitude: number;
  longitude: number;
}

export interface IGeocodingStrategy {
  reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null>;
  forwardGeocode(query: string): Promise<GeocodedAddress[]>;
}

/**
 * OpenStreetMap Nominatim Geocoding Strategy
 * Zero monthly billing risk, global coverage, robust Nigerian LGA & State resolution.
 */
export class NominatimGeocodingStrategy implements IGeocodingStrategy {
  private userAgent = 'FixmateArtisanPlatform/1.0';
  private cache = new Map<string, GeocodedAddress>();

  /**
   * Reverse geocodes coordinates to structured address components.
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng)) return null;

    const cacheKey = `${numLat.toFixed(4)},${numLng.toFixed(4)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.append('format', 'jsonv2');
      url.searchParams.append('lat', String(numLat));
      url.searchParams.append('lon', String(numLng));
      url.searchParams.append('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data || !data.address) return null;

      const addr = data.address;

      // Extract Nigerian administrative levels
      const state =
        addr.state?.replace(/\s+State$/i, '') ||
        addr.province ||
        addr.region ||
        'Lagos';

      // In Nigeria, county often represents Local Government Area (LGA)
      const lgaCity =
        addr.city ||
        addr.county ||
        addr.town ||
        addr.suburb ||
        addr.city_district ||
        'Ikeja';

      const streetNumber = addr.house_number || '';
      const road = addr.road || addr.pedestrian || addr.neighbourhood || '';
      const formattedAddress = data.display_name || '';

      const result: GeocodedAddress = {
        formattedAddress,
        streetNumber,
        road,
        suburb: addr.suburb || '',
        lgaCity,
        state,
        country: addr.country || 'Nigeria',
        postcode: addr.postcode || '',
        latitude: numLat,
        longitude: numLng,
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn('[Geocoding] Reverse geocode lookup failed:', err);
      return null;
    }
  }

  /**
   * Forward searches an address or landmark string to candidate coordinates in Nigeria.
   */
  async forwardGeocode(query: string): Promise<GeocodedAddress[]> {
    if (!query || query.trim().length < 3) return [];

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.append('format', 'jsonv2');
      url.searchParams.append('q', query.trim());
      url.searchParams.append('countrycodes', 'ng'); // Restrict search to Nigeria
      url.searchParams.append('limit', '5');
      url.searchParams.append('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) return [];

      const items = await response.json();
      if (!Array.isArray(items)) return [];

      return items.map((item: any) => {
        const addr = item.address || {};
        return {
          formattedAddress: item.display_name,
          lgaCity: addr.city || addr.county || addr.town || addr.suburb || '',
          state: addr.state?.replace(/\s+State$/i, '') || '',
          road: addr.road || '',
          country: addr.country || 'Nigeria',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      });
    } catch (err) {
      console.warn('[Geocoding] Forward search failed:', err);
      return [];
    }
  }
}

export const geocodingService = new NominatimGeocodingStrategy();
