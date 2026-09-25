// ==============================================================================
// W3C APP BADGING API HELPER (Android / iOS PWA Home Screen Badges)
// ==============================================================================

export function isAppBadgeSupported(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
}

export function setAppBadge(count: number): void {
  if (isAppBadgeSupported()) {
    try {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    } catch {
      // Ignore unsupported platforms
    }
  }
}

export function clearAppBadge(): void {
  if (isAppBadgeSupported()) {
    try {
      navigator.clearAppBadge().catch(() => {});
    } catch {
      // Ignore
    }
  }
}
