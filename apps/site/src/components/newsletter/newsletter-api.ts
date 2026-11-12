/**
 * Client calls to the newsletter API (04 §1). The routes live in `pages/api/newsletter/*`;
 * these helpers only map their responses onto the states the UI draws.
 */

export const SUBSCRIBE_ENDPOINT = '/api/newsletter/subscribe';
export const UNSUBSCRIBE_ENDPOINT = '/api/newsletter/unsubscribe';

/**
 * - `check-inbox`: 202, for a new and an already-subscribed address alike (04 §2 states 4–5).
 * - `invalid`: 400 `invalid-email` (state 2).
 * - `failed`: a network error, 429 or 5xx (state 6).
 */
export type SubscribeResult = 'check-inbox' | 'invalid' | 'failed';

/** Posts `{ email, website? }`. `website` is the honeypot, sent only when something filled it. */
export async function requestSubscribe(
  email: string,
  website = '',
): Promise<SubscribeResult> {
  try {
    const response = await fetch(SUBSCRIBE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(website ? { email, website } : { email }),
    });
    if (response.status === 202) return 'check-inbox';
    if (response.status === 400) return 'invalid';
    return 'failed';
  } catch {
    return 'failed';
  }
}

/**
 * - `done`: 200 (unsubscribing twice is harmless and answers the same).
 * - `invalid`: 400 `invalid-token`, a missing, malformed or tampered token.
 * - `failed`: a network error or anything else.
 */
export type UnsubscribeResult = 'done' | 'invalid' | 'failed';

export async function requestUnsubscribe(
  token: string,
): Promise<UnsubscribeResult> {
  try {
    const response = await fetch(UNSUBSCRIBE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (response.ok) return 'done';
    if (response.status === 400) return 'invalid';
    return 'failed';
  } catch {
    return 'failed';
  }
}

/** The client-side check on submit (04 §2 state 2): something@something.tld, no spaces. */
export function looksLikeEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value);
}
