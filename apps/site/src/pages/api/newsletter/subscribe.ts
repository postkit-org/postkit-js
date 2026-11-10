import { captureException } from '@sentry/nextjs';
import {
  createNewsletterHandlersFromEnv,
  createNextNewsletterRoute,
} from '@postkit/site-newsletter';

/**
 * `POST /api/newsletter/subscribe` with `{ email, website? }` (PK-050, 04 §1).
 *
 * - 202 `{ state: 'check-inbox' }` for new and existing addresses alike (and for the honeypot);
 *   the email sent differs, the response never does.
 * - 400 `{ error: 'invalid-email' }`, 429 `{ error: 'rate-limited' }`,
 *   503 `{ error: 'unavailable' }` when Resend isn't configured or fails, 405 otherwise.
 *
 * The limits (3 per address and 20 per IP, per hour) are in memory per instance, so on
 * Vercel they aren't global. Nothing here logs; Resend failures go to Sentry as the
 * operation and Resend's error name only, and Sentry scrubs addresses and tokens anyway.
 */
export const config = {
  api: { bodyParser: false },
};

export default createNextNewsletterRoute(
  createNewsletterHandlersFromEnv().subscribe,
  { onFailure: (failure) => captureException(failure) },
);
