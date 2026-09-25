// ==============================================================================
// WEB SHARE API HELPER (Native WhatsApp / Telegram / Social Sharing)
// ==============================================================================

interface ShareOptions {
  title: string;
  text?: string;
  url: string;
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareWithNativeShare(options: ShareOptions): Promise<boolean> {
  if (canNativeShare()) {
    try {
      await navigator.share(options);
      return true;
    } catch (err: unknown) {
      // User cancelled or aborted share
      if (err instanceof Error && err.name === 'AbortError') {
        return false;
      }
    }
  }

  // Fallback: Copy URL to clipboard
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(options.url);
      return true;
    }
  } catch {
    // Clipboard failed
  }

  return false;
}
