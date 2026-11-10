import {
  scrubSentryBreadcrumb,
  scrubSentryEvent,
} from '@postkit/site-telemetry';

/**
 * Sentry options shared by the browser, Node.js and edge runtimes
 * (`docs/design/handoff/specs/01-site-spec.md` §12).
 *
 * Off unless `NEXT_PUBLIC_SENTRY_DSN` is set: `Sentry.init` is never called, so nothing is
 * captured or sent and the tunnel route gets no traffic.
 */
export const sentryDsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;

export const sentryEnabled = sentryDsn !== undefined;

/** Sentry integrations the site must never run. The Privacy page doesn't cover replay. */
const FORBIDDEN_INTEGRATIONS = new Set(['Replay', 'ReplayCanvas', 'Feedback']);

export function withoutForbiddenIntegrations<T extends { name: string }>(
  integrations: T[],
): T[] {
  return integrations.filter(
    (integration) => !FORBIDDEN_INTEGRATIONS.has(integration.name),
  );
}

export const sentrySharedOptions = {
  dsn: sentryDsn,
  // No IP addresses, cookies or headers that identify a reader. The Sentry project also has
  // "Prevent storing of IP addresses" on (09 "Facts the copy depends on").
  sendDefaultPii: false,
  // Low-rate tracing; errors are always sent.
  tracesSampleRate: 0.1,
  // Addresses and newsletter tokens never leave the site (04 §1, "No address in logs").
  beforeSend: scrubSentryEvent,
  beforeSendTransaction: scrubSentryEvent,
  beforeBreadcrumb: scrubSentryBreadcrumb,
};
