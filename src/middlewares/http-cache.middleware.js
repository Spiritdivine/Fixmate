/**
 * HTTP Cache-Control middleware for caching read-heavy endpoints.
 * Sets standard Cache-Control headers with stale-while-revalidate for CDN/browser efficiency.
 *
 * @param {Object} options
 * @param {number} [options.maxAge=300] Cache TTL in seconds (default: 5 minutes)
 * @param {number} [options.staleWhileRevalidate=600] Grace window for serving stale cache while revalidating (default: 10 minutes)
 * @param {boolean} [options.isPrivate=false] Whether the cache should be private to the requesting client
 */
export function httpCache({ maxAge = 300, staleWhileRevalidate = 600, isPrivate = false } = {}) {
  return (req, res, next) => {
    // Only apply caching headers to safe, idempotent read requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    const scope = isPrivate ? 'private' : 'public';
    res.set(
      'Cache-Control',
      `${scope}, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    );

    next();
  };
}

/**
 * Utility middleware to explicitly prevent caching on volatile or sensitive endpoints.
 */
export function noCache() {
  return (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  };
}
