import type { ReactNode } from 'react';
import { FathomProvider } from 'react-fathom';
import { NextFathomTrackViewPages } from 'react-fathom/next';

import {
  analyticsPageviewUrl,
  fathomClientOptions,
  fathomClientRef,
  fathomSiteId,
} from '../lib/analytics';

/**
 * Wraps the app in react-fathom's provider and counts a pageview on load and on every route
 * change (Pages Router). Without `NEXT_PUBLIC_FATHOM_SITE_ID` it renders its children and
 * nothing else, so Fathom's script never loads.
 */
export function SiteAnalytics({ children }: { children: ReactNode }) {
  if (!fathomSiteId) return children;

  return (
    <FathomProvider
      siteId={fathomSiteId}
      clientOptions={fathomClientOptions}
      clientRef={fathomClientRef}
    >
      <NextFathomTrackViewPages transformUrl={analyticsPageviewUrl} />
      {children}
    </FathomProvider>
  );
}
