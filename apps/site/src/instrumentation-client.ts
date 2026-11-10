import * as Sentry from '@sentry/nextjs';

import {
  sentryEnabled,
  sentrySharedOptions,
  withoutForbiddenIntegrations,
} from './lib/sentry-options';

// Browser error reporting. Without NEXT_PUBLIC_SENTRY_DSN, Sentry.init is never called and
// the browser sends nothing. Pages Router navigations are traced by Sentry's default
// browserTracingIntegration, so there's no `onRouterTransitionStart` (App Router only).
if (sentryEnabled) {
  Sentry.init({
    ...sentrySharedOptions,
    // Defaults minus anything that records sessions. Replay is never added.
    integrations: (defaults) => withoutForbiddenIntegrations(defaults),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
