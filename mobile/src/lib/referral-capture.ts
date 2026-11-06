import { Platform } from 'react-native';
import { Storage } from './storage';

const REFERRAL_CACHE_KEY = '@fixmate_pending_referral_code';

/**
 * Universal Referral Capture Engine (SRP & Open/Closed)
 * Automatically intercepts and caches referral codes from web URLs,
 * deep links, or in-app QR matrix scans across platforms.
 */
export class ReferralCapture {
  private static memoryCache: string | null = null;

  /**
   * Initializes capture by inspecting window.location (Web) or deep links.
   */
  static async init(): Promise<string | null> {
    try {
      // 1. Check Web URL query params (?ref=FIX-XXXX or ?referral=FIX-XXXX)
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        const refParam = params.get('ref') || params.get('referral') || params.get('invite');
        if (refParam && refParam.trim()) {
          const cleanCode = refParam.trim().toUpperCase();
          await this.set(cleanCode);
          return cleanCode;
        }
      }

      // 2. Check persistent storage
      const cached = await this.get();
      return cached;
    } catch (err) {
      console.warn('[ReferralCapture] Init warning:', err);
      return null;
    }
  }

  /**
   * Persists a referral code into cache.
   */
  static async set(code: string): Promise<void> {
    if (!code) return;
    const clean = code.trim().toUpperCase();
    this.memoryCache = clean;
    try {
      await Storage.setItem(REFERRAL_CACHE_KEY, clean);
    } catch {
      // Memory fallback active
    }
  }

  /**
   * Retrieves the currently pending referral code if any.
   */
  static async get(): Promise<string | null> {
    if (this.memoryCache) return this.memoryCache;
    try {
      const stored = await Storage.getItem(REFERRAL_CACHE_KEY);
      if (stored) {
        this.memoryCache = stored.trim().toUpperCase();
        return this.memoryCache;
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Clears the pending referral code once consumed during signup.
   */
  static async clear(): Promise<void> {
    this.memoryCache = null;
    try {
      await Storage.removeItem(REFERRAL_CACHE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Helper to parse referral code from raw QR or scanned URL payload.
   * e.g. "https://artisan.ng/join?ref=FIX-Q5AS" -> "FIX-Q5AS"
   * e.g. "artisan:referral:FIX-Q5AS" -> "FIX-Q5AS"
   */
  static extractFromPayload(rawPayload: string): string | null {
    if (!rawPayload || typeof rawPayload !== 'string') return null;
    const clean = rawPayload.trim();

    // Check direct code format (e.g. FIX-XXXX)
    if (/^[A-Z0-9]{3,4}-[A-Z0-9]{4,6}$/i.test(clean)) {
      return clean.toUpperCase();
    }

    // Check custom URI format (artisan:referral:CODE)
    if (clean.toLowerCase().startsWith('artisan:referral:')) {
      return clean.split(':')[2]?.toUpperCase() || null;
    }

    // Check URL format
    if (clean.includes('ref=') || clean.includes('referral=')) {
      try {
        const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
        const ref = url.searchParams.get('ref') || url.searchParams.get('referral');
        if (ref) return ref.trim().toUpperCase();
      } catch {
        // Fallback regex if URL parse fails
        const match = clean.match(/[?&](?:ref|referral)=([A-Za-z0-9_-]+)/i);
        if (match && match[1]) return match[1].toUpperCase();
      }
    }

    return null;
  }
}
