import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { fathomSiteId } from '../lib/analytics';

/**
 * react-fathom's provider and pageview tracker, in their own chunk: it's only downloaded
 * when Fathom is configured (07 §4).
 */
const FathomTracker = dynamic(
  () => import('./fathom-tracker').then((mod) => mod.FathomTracker),
  { ssr: false },
);

/**
 * Counts a pageview on load and on every route change (Pages Router). Without
 * `NEXT_PUBLIC_FATHOM_SITE_ID` it renders its children and nothing else, so neither
 * react-fathom nor Fathom's script ever loads. Goals go through `fathomClientRef`
 * (`trackGoal`), so the children don't need the provider's context.
 */
export function SiteAnalytics({ children }: { children: ReactNode }) {
  if (!fathomSiteId) return children;

  return (
    <>
      <FathomTracker siteId={fathomSiteId} />
      {children}
    </>
  );
}
