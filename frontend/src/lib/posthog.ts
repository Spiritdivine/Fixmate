import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

let isInitialized = false;

export const initPostHog = () => {
  if (isInitialized) return;

  if (!POSTHOG_KEY) {
    if (import.meta.env.DEV) {
      throw new Error(
        'VITE_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_KEY is configured'
      );
    }
    return;
  }

  if (!POSTHOG_HOST) {
    if (import.meta.env.DEV) {
      throw new Error(
        'VITE_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_HOST is configured'
      );
    }
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_pageview: false, // Handled explicitly by PostHogPageViewTracker for SPA route accuracy
    capture_pageleave: true,
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    persistence: 'localStorage+cookie',
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
      },
    },
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        ph.debug();
      }
    },
  });

  isInitialized = true;
};

export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (isInitialized) {
    posthog.capture(eventName, properties);
  }
};

export const identifyUser = (distinctId: string, userProperties?: Record<string, unknown>) => {
  if (isInitialized) {
    posthog.identify(distinctId, userProperties);
  }
};

export const resetUser = () => {
  if (isInitialized) {
    posthog.reset();
  }
};

export { posthog };
