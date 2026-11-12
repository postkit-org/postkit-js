// Browser error reporting. Without NEXT_PUBLIC_SENTRY_DSN, the SDK is never downloaded and
// the browser sends nothing (07 §4: about 115 KB gzipped otherwise, on every page). With it,
// the SDK loads in its own chunk and initialises as soon as it arrives. Pages Router
// navigations are traced by Sentry's default browserTracingIntegration, so there's no
// `onRouterTransitionStart` (App Router only).
if (process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) {
  void import('./lib/sentry-client').then(({ initSentryClient }) =>
    initSentryClient(),
  );
}
