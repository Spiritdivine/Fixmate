/**
 * Navigation Utilities Module
 * Generates platform-aware deep links for third-party navigation providers
 * (Google Maps, Apple Maps, Waze) to guide clients and artisans to job/workshop sites.
 */

export class NavigationUtils {
  /**
   * Generates Google Maps Directions URL
   */
  static getGoogleMapsUrl(latitude, longitude, destinationName) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const query = destinationName ? `${encodeURIComponent(destinationName)}/` : '';
    return `https://www.google.com/maps/dir/?api=1&destination=${query}${lat},${lng}`;
  }

  /**
   * Generates Apple Maps Directions URL
   */
  static getAppleMapsUrl(latitude, longitude, destinationName) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const qPart = destinationName ? `&q=${encodeURIComponent(destinationName)}` : '';
    return `https://maps.apple.com/?daddr=${lat},${lng}${qPart}&dirflg=d`;
  }

  /**
   * Generates Waze Navigation URL
   */
  static getWazeUrl(latitude, longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }

  /**
   * Returns a consolidated navigation suite object
   */
  static getNavigationSuite(latitude, longitude, destinationName = '') {
    return {
      googleMaps: this.getGoogleMapsUrl(latitude, longitude, destinationName),
      appleMaps: this.getAppleMapsUrl(latitude, longitude, destinationName),
      waze: this.getWazeUrl(latitude, longitude),
    };
  }
}
