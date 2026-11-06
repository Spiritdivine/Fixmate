import { QueryClient, QueryKey } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface OptimisticMetadata {
  _syncStatus?: SyncStatus;
  _isOptimistic?: boolean;
  _tempId?: string;
  _error?: string;
}

export type OptimisticEntity<T> = T & OptimisticMetadata;

/**
 * Creates a unique client-side temporary ID for newly created entities
 */
export function generateTempId(prefix = 'temp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Helper to trigger standard optimistic tactile feedback
 */
export async function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  try {
    switch (type) {
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'light':
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  } catch {
    // Graceful fallback on web or unsupported devices
  }
}

/**
 * Safely updates an entity inside a list cache or replaces an existing item
 */
export function updateItemInList<T extends { id?: string | number }>(
  list: T[] | undefined,
  matcher: (item: T) => boolean,
  updater: (item: T) => T
): T[] {
  if (!list || !Array.isArray(list)) return [];
  return list.map((item) => (matcher(item) ? updater(item) : item));
}

/**
 * Safely removes an item from a list cache
 */
export function removeItemFromList<T extends { id?: string | number }>(
  list: T[] | undefined,
  matcher: (item: T) => boolean
): T[] {
  if (!list || !Array.isArray(list)) return [];
  return list.filter((item) => !matcher(item));
}

/**
 * Prepends a new optimistic item to a list cache
 */
export function prependOptimisticItem<T>(list: T[] | undefined, newItem: T): T[] {
  if (!list || !Array.isArray(list)) return [newItem];
  return [newItem, ...list];
}
