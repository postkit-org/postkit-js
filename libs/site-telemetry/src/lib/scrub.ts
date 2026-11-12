/**
 * Privacy scrubbing for postkit.org's error reports and page counts.
 *
 * The site promises that addresses never reach its logs or error reports
 * (`docs/design/handoff/specs/04-emails.md` §1, "No address in logs") and that newsletter
 * tokens stay out of them too. Everything that leaves the browser or server for Sentry or
 * Fathom goes through these helpers first.
 */

/** What an email address is replaced with. */
export const REDACTED_EMAIL = '[email]';

/** What a value under a `token` key is replaced with. */
export const REDACTED_TOKEN = '[Filtered]';

/**
 * Matches an email address, plain or with a percent-encoded `@` (`%40`).
 *
 * The local part is deliberately loose (anything but whitespace and the characters that
 * delimit URLs, JSON and headers), so a masked address such as `r…@example.com` from the
 * newsletter page's `#for=` fragment is caught too. The domain needs a dot and a letter-only
 * top-level label, so `react@19.1.0` and `@postkit/chakra` are left alone.
 */
const EMAIL_PATTERN =
  /[^\s@<>()[\]{}\\,;:"'`/?#&=|]+(?:@|%40)(?:[a-z0-9-]+\.)+[a-z]{2,}(?![a-z0-9-])/gi;

/** A query string after `?`, up to the fragment or whitespace. */
const QUERY = /\?([^#\s]*)/g;

/** A query string percent-encoded inside another value (`%3Fa%3D1%26token%3D…`). */
const ENCODED_QUERY = /%3F((?:(?!%23)[^&#\s])*)/gi;

const TOKEN_PARAM = /^token(?:=|$)/i;
const ENCODED_TOKEN_PARAM = /^token(?:%3D|$)/i;
const TOKEN_KEY = /^token$/i;

/** Drops `token` from an `&`-separated parameter list, or returns `null` if it has none. */
function withoutTokenParam(
  query: string,
  separator: RegExp,
  joiner: string,
  tokenParam: RegExp,
): string | null {
  const params = query.split(separator);
  const kept = params.filter((param) => !tokenParam.test(param));
  return kept.length === params.length ? null : kept.join(joiner);
}

/** Replaces every email address in `value` with {@link REDACTED_EMAIL}. */
export function redactEmails(value: string): string {
  return value.replace(EMAIL_PATTERN, REDACTED_EMAIL);
}

/**
 * Removes every `token` query parameter from `value`, keeping the rest of the URL or query
 * string intact: `/newsletter/confirm?token=abc&x=1#top` becomes `/newsletter/confirm?x=1#top`.
 */
export function stripTokenParams(value: string): string {
  let result = value
    .replace(QUERY, (match, query: string) => {
      const kept = withoutTokenParam(query, /&/, '&', TOKEN_PARAM);
      if (kept === null) return match;
      return kept ? `?${kept}` : '';
    })
    .replace(ENCODED_QUERY, (match, query: string) => {
      const kept = withoutTokenParam(query, /%26/i, '%26', ENCODED_TOKEN_PARAM);
      if (kept === null) return match;
      return kept ? `%3F${kept}` : '';
    });

  // A bare query string with no `?`, such as Sentry's `request.query_string`.
  if (!/[\s?#]/.test(result) && result.includes('=')) {
    result = withoutTokenParam(result, /&/, '&', TOKEN_PARAM) ?? result;
  }
  return result;
}

/** Strips `token` parameters and redacts email addresses in one string. */
export function scrubText(value: string): string {
  return redactEmails(stripTokenParams(value));
}

/** Walks no deeper than this, so a pathological event can't stall the reporter. */
const MAX_DEPTH = 20;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** A `[key, value]` pair whose key is `token`, as in Sentry's array form of `query_string`. */
function isTokenPair(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'string' &&
    TOKEN_KEY.test(value[0])
  );
}

function scrubNode(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (typeof value === 'string') return scrubText(value);
  if (depth >= MAX_DEPTH || value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) return value;

  if (Array.isArray(value)) {
    seen.add(value);
    return value
      .filter((item) => !isTokenPair(item))
      .map((item) => scrubNode(item, depth + 1, seen));
  }

  // Leave class instances (Errors, DOM nodes in hints, Dates) alone: events and breadcrumbs
  // are plain JSON by the time they're sent, and rebuilding an instance would break it.
  if (!isPlainObject(value)) return value;

  seen.add(value);
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (TOKEN_KEY.test(key)) {
      result[key] = REDACTED_TOKEN;
      continue;
    }
    result[scrubText(key)] = scrubNode(child, depth + 1, seen);
  }
  return result;
}

/**
 * Returns a deep copy of `value` with every string scrubbed ({@link scrubText}), every value
 * under a `token` key replaced with {@link REDACTED_TOKEN}, and every `['token', …]` pair
 * removed. Messages, exception values, breadcrumbs, request URLs, query strings, headers and
 * bodies are all just strings somewhere in the tree, so one walk covers them.
 */
export function scrubDeep<T>(value: T): T {
  return scrubNode(value, 0, new WeakSet()) as T;
}

/**
 * Sentry `beforeSend` / `beforeSendTransaction` hook. Typed structurally so this library
 * doesn't depend on the Sentry SDK.
 */
export function scrubSentryEvent<T extends object>(event: T): T {
  return scrubDeep(event);
}

/** Sentry `beforeBreadcrumb` hook. */
export function scrubSentryBreadcrumb<T extends object>(breadcrumb: T): T {
  return scrubDeep(breadcrumb);
}

/**
 * The URL Fathom records for a pageview: `token` parameters stripped, addresses redacted and
 * the fragment dropped (it can hold the masked `#for=` address on the newsletter pages).
 */
export function cleanAnalyticsUrl(url: string): string {
  const hashIndex = url.indexOf('#');
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  return scrubText(withoutHash).replace(/\?$/, '');
}
