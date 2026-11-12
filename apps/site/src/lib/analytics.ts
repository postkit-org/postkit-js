import { cleanAnalyticsUrl } from '@postkit/site-telemetry';
import type { FathomClient, LoadOptions } from 'react-fathom';

/**
 * Fathom (react-fathom) for postkit.org: page counts plus three goals, nothing else
 * (`docs/design/handoff/specs/01-site-spec.md` §12). Fathom is cookie-free.
 *
 * Off unless `NEXT_PUBLIC_FATHOM_SITE_ID` is set at build time: no provider, no script, no
 * requests, and `trackGoal` does nothing.
 */
export const fathomSiteId =
  process.env.NEXT_PUBLIC_FATHOM_SITE_ID?.trim() || undefined;

export const analyticsEnabled = fathomSiteId !== undefined;

/** The only events the site sends. Each is created in Fathom by name on first use. */
export const ANALYTICS_GOALS = [
  'subscribe-request',
  'subscribe-confirmed',
  'copy-install',
] as const;

export type AnalyticsGoal = (typeof ANALYTICS_GOALS)[number];

/**
 * fathom-client options. `auto: false` because `NextFathomTrackViewPages` sends every pageview
 * itself, through {@link analyticsPageviewUrl}; Fathom's own auto-tracking would send the raw
 * URL, `token` included. Module-level so the provider's load effect doesn't rerun.
 */
export const fathomClientOptions: LoadOptions = { auto: false };

/**
 * The URL a pageview records: the `token` parameter on `/newsletter/*` links (and anywhere
 * else) is dropped, addresses are redacted, and the fragment (which can hold the masked
 * `#for=` address) is never sent (04 §1).
 */
export function analyticsPageviewUrl(url: string): string {
  return cleanAnalyticsUrl(url);
}

/**
 * Filled by `FathomProvider`'s `clientRef` once the provider mounts, which only happens when
 * Fathom is configured. Lets `trackGoal` run from plain handlers and async code.
 */
export const fathomClientRef: { current: FathomClient | null } = {
  current: null,
};

/**
 * Records one of the site's goals, e.g. `trackGoal('copy-install')`. A no-op when Fathom
 * isn't configured.
 *
 * Fathom's current goals are named events, so this calls react-fathom's `trackEvent` with the
 * goal's name (its `trackGoal` takes a dashboard-generated code and is deprecated upstream).
 */
export function trackGoal(goal: AnalyticsGoal): void {
  if (!analyticsEnabled) return;
  fathomClientRef.current?.trackEvent(goal);
}
