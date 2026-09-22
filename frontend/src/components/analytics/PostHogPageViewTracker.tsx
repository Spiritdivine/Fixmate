import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { posthog } from '../../lib/posthog';

export function PostHogPageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // Only capture if PostHog has been initialized
    if (posthog.__loaded) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        pathname: location.pathname,
        search: location.search,
        title: document.title,
      });
    }
  }, [location.pathname, location.search]);

  return null;
}
