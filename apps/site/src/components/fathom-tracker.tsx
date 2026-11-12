import { FathomProvider } from 'react-fathom';
import { NextFathomTrackViewPages } from 'react-fathom/next';

import {
  analyticsPageviewUrl,
  fathomClientOptions,
  fathomClientRef,
} from '../lib/analytics';

/**
 * Loads Fathom and sends every pageview through {@link analyticsPageviewUrl}. Rendered by
 * `SiteAnalytics` only when `NEXT_PUBLIC_FATHOM_SITE_ID` is set.
 */
export function FathomTracker({ siteId }: { readonly siteId: string }) {
  return (
    <FathomProvider
      siteId={siteId}
      clientOptions={fathomClientOptions}
      clientRef={fathomClientRef}
    >
      <NextFathomTrackViewPages transformUrl={analyticsPageviewUrl} />
    </FathomProvider>
  );
}
