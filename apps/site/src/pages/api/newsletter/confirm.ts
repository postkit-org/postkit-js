import { captureException } from '@sentry/nextjs';
import {
  createNewsletterHandlersFromEnv,
  createNextNewsletterRoute,
} from '@postkit/site-newsletter';

/**
 * `GET /api/newsletter/confirm?token=…` (PK-050, 04 §1): the link in the confirm email.
 *
 * - A valid token adds the contact to the audience (an idempotent upsert, with a fresh
 *   `unsubscribe_token` property) and 303s to
 *   `/newsletter/subscribe?status=confirmed#for=r%E2%80%A6@example.com` (the masked address,
 *   percent-encoded; `decodeURIComponent` gives `r…@example.com`).
 * - A bad, expired or tampered token, a missing configuration or a Resend failure 303s to
 *   `/newsletter/subscribe?status=expired`, whose form sends a fresh link.
 */
export const config = {
  api: { bodyParser: false },
};

export default createNextNewsletterRoute(
  createNewsletterHandlersFromEnv().confirm,
  { onFailure: (failure) => captureException(failure) },
);
