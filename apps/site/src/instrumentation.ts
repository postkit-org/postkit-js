import * as Sentry from '@sentry/nextjs';

import { sentryEnabled, sentrySharedOptions } from './lib/sentry-options';

/**
 * Server and edge error reporting. Next.js calls `register` once per runtime. Without
 * NEXT_PUBLIC_SENTRY_DSN, Sentry.init is never called and nothing is sent.
 */
export async function register() {
  if (!sentryEnabled) return;

  if (
    process.env.NEXT_RUNTIME === 'nodejs' ||
    process.env.NEXT_RUNTIME === 'edge'
  ) {
    Sentry.init(sentrySharedOptions);
  }
}

/** Errors from pages, API routes and middleware. A no-op until Sentry.init has run. */
export const onRequestError = Sentry.captureRequestError;
