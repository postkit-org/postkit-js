import { captureException } from '@sentry/nextjs';
import {
  createNewsletterHandlersFromEnv,
  createNextNewsletterRoute,
} from '@postkit/site-newsletter';

/**
 * `POST /api/newsletter/unsubscribe` (PK-050, 04 §1a). The token comes from `?token=`, a JSON
 * body `{ token }` or a form field.
 *
 * - fetch / JSON: 200 `{ state: 'unsubscribed' }` (again: the same 200), 400
 *   `{ error: 'invalid-token' }`, 503 `{ error: 'unavailable' }`.
 * - An HTML form post (form-encoded, no JSON `Accept`): 303 to `/newsletter/unsubscribe#done`,
 *   `#invalid` or `#error`.
 * - RFC 8058 one-click (`List-Unsubscribe=One-Click`): 200.
 * - Anything but POST, GET included, is a 405: link scanners can't unsubscribe anyone.
 */
export const config = {
  api: { bodyParser: false },
};

export default createNextNewsletterRoute(
  createNewsletterHandlersFromEnv().unsubscribe,
  { onFailure: (failure) => captureException(failure) },
);
