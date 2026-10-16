import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Universal Cross-Platform Token & Key-Value Storage
 * Safely routes between:
 * - Native iOS/Android: Hardware-backed encrypted Keychain / Android Keystore (expo-secure-store)
 * - Web / PWA: Browser localStorage with safe memory fallback
 */
class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const memoryFallback = new MemoryStorage();

export const Storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return memoryFallback.getItem(key);
      } catch {
        return memoryFallback.getItem(key);
      }
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn(`[Storage] Failed to read ${key} from SecureStore:`, err);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
        memoryFallback.setItem(key, value);
      } catch {
        memoryFallback.setItem(key, value);
      }
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn(`[Storage] Failed to write ${key} to SecureStore:`, err);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
        memoryFallback.removeItem(key);
      } catch {
        memoryFallback.removeItem(key);
      }
      return;
    }

    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn(`[Storage] Failed to delete ${key} from SecureStore:`, err);
    }
  },
};
