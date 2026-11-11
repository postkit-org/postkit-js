import * as Sentry from '@sentry/nextjs';

import {
  sentryEnabled,
  sentrySharedOptions,
  withoutForbiddenIntegrations,
} from './sentry-options';

/**
 * Starts browser error reporting. Loaded by `instrumentation-client.ts` only when
 * NEXT_PUBLIC_SENTRY_DSN is set, so the SDK stays out of the bundle otherwise.
 */
export function initSentryClient(): void {
  if (!sentryEnabled) return;

  Sentry.init({
    ...sentrySharedOptions,
    // Defaults minus anything that records sessions. Replay is never added.
    integrations: (defaults) => withoutForbiddenIntegrations(defaults),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
