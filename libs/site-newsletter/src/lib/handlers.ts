import { createHash } from 'node:crypto';

import {
  renderAlreadySubscribedEmail,
  renderConfirmEmail,
  type RenderedEmail,
} from '@postkit/site-emails';

import type { NewsletterConfig } from './config';
import { isValidEmail, maskEmail, normalizeEmail } from './email-address';
import {
  NewsletterProviderError,
  UNSUBSCRIBE_TOKEN_PROPERTY,
  type NewsletterProvider,
  type ProviderOperation,
} from './provider';
import {
  ADDRESS_LIMIT,
  createRateLimiter,
  IP_LIMIT,
  type RateLimiter,
} from './rate-limit';
import { openToken, sealConfirmToken, sealUnsubscribeToken } from './tokens';

/**
 * The newsletter API (04 §1), framework-neutral: each handler takes a parsed request and
 * returns a status, headers and an optional JSON body. `apps/site/src/pages/api/newsletter/*`
 * adapts them to Next.js; tests call them directly with a fake provider.
 *
 * Nothing here logs. Addresses and tokens never leave these functions except in the email
 * itself and, masked, in the confirm redirect's fragment.
 */

export interface NewsletterRequest {
  readonly method: string | undefined;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly query: Readonly<Record<string, string | string[] | undefined>>;
  /** The parsed body: an object for JSON and form posts, a string for anything else. */
  readonly body: unknown;
  /** The client IP, for the per-IP limit. */
  readonly ip?: string;
}

export interface NewsletterResponse {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  /** A JSON body; absent on redirects. */
  readonly body?: Readonly<Record<string, string>>;
  /** Set when a provider call failed, for error reporting. Never holds an address. */
  readonly failure?: NewsletterProviderError;
}

export interface NewsletterHandlers {
  subscribe(request: NewsletterRequest): Promise<NewsletterResponse>;
  confirm(request: NewsletterRequest): Promise<NewsletterResponse>;
  unsubscribe(request: NewsletterRequest): Promise<NewsletterResponse>;
}

export interface NewsletterHandlerOptions {
  /** `null` when the newsletter isn't configured: every route answers `unavailable`. */
  readonly config: NewsletterConfig | null;
  readonly provider: NewsletterProvider | null;
  /** Defaults to the in-memory limits (3 per address and 20 per IP, per hour). */
  readonly addressLimiter?: RateLimiter;
  readonly ipLimiter?: RateLimiter;
  /** The clock, in milliseconds (tests). */
  readonly now?: () => number;
}

/** Idempotency keys cover a 10-minute window (04 §1, "Queues"). */
const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000;

/** Responses carry tokens in their URLs or depend on them: never cache, never refer. */
const NO_STORE = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
} as const;

const SUBSCRIBE_PAGE = '/newsletter/subscribe';
const UNSUBSCRIBE_PAGE = '/newsletter/unsubscribe';

function json(
  status: number,
  body: Record<string, string>,
  extra: Record<string, string> = {},
  failure?: NewsletterProviderError,
): NewsletterResponse {
  return {
    status,
    headers: {
      ...NO_STORE,
      'Content-Type': 'application/json; charset=utf-8',
      ...extra,
    },
    body,
    ...(failure ? { failure } : {}),
  };
}

function redirect(
  location: string,
  failure?: NewsletterProviderError,
): NewsletterResponse {
  return {
    status: 303,
    headers: { ...NO_STORE, Location: location },
    ...(failure ? { failure } : {}),
  };
}

function methodNotAllowed(allow: string): NewsletterResponse {
  return json(405, { error: 'method-not-allowed' }, { Allow: allow });
}

const CHECK_INBOX = { state: 'check-inbox' } as const;
const UNSUBSCRIBED = { state: 'unsubscribed' } as const;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function header(request: NewsletterRequest, name: string): string {
  return firstValue(request.headers[name.toLowerCase()])?.toLowerCase() ?? '';
}

/** The body as a record: parsed JSON or form fields, or a JSON string that wasn't parsed. */
function bodyFields(body: unknown): Record<string, unknown> {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  if (typeof body === 'string' && body.length > 0) {
    const trimmed = body.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }
    return Object.fromEntries(new URLSearchParams(trimmed));
  }
  return {};
}

/** Any failure from the provider, as something safe to report. */
function asProviderError(
  operation: ProviderOperation,
  error: unknown,
): NewsletterProviderError {
  return error instanceof NewsletterProviderError
    ? error
    : new NewsletterProviderError(operation, 'exception', null);
}

/** `r…@example.com`, percent-encoded for a `Location` header but keeping the `@`. */
function maskedFragment(email: string): string {
  return encodeURIComponent(maskEmail(email)).replace(/%40/g, '@');
}

export function createNewsletterHandlers({
  config,
  provider,
  addressLimiter = createRateLimiter(ADDRESS_LIMIT),
  ipLimiter = createRateLimiter(IP_LIMIT),
  now = Date.now,
}: NewsletterHandlerOptions): NewsletterHandlers {
  const ready = config && provider ? { config, provider } : null;

  /** A hash of the address, the email kind and the 10-minute window. */
  function idempotencyKey(kind: string, email: string, at: number): string {
    const window = Math.floor(at / IDEMPOTENCY_WINDOW_MS);
    return `newsletter-${kind}-${createHash('sha256')
      .update(`${kind}\n${email}\n${window}`)
      .digest('hex')}`;
  }

  async function subscribe(
    request: NewsletterRequest,
  ): Promise<NewsletterResponse> {
    if (request.method !== 'POST') return methodNotAllowed('POST');
    if (!ready) return json(503, { error: 'unavailable' });
    const { config, provider } = ready;

    const fields = bodyFields(request.body);

    // The honeypot: people never see the `website` field, so anything in it is a bot. It
    // gets the same answer as everyone else, and nothing is sent.
    if (typeof fields['website'] === 'string' && fields['website'].trim()) {
      return json(202, CHECK_INBOX);
    }

    const at = now();
    if (request.ip && !ipLimiter.hit(request.ip, at)) {
      return json(429, { error: 'rate-limited' }, { 'Retry-After': '3600' });
    }

    const email =
      typeof fields['email'] === 'string'
        ? normalizeEmail(fields['email'])
        : '';
    if (!isValidEmail(email)) return json(400, { error: 'invalid-email' });

    if (!addressLimiter.hit(email, at)) {
      return json(429, { error: 'rate-limited' }, { 'Retry-After': '3600' });
    }

    let operation: ProviderOperation = 'get-contact';
    try {
      const contact = await provider.getContact(email);
      const alreadySubscribed = contact !== null && !contact.unsubscribed;

      // Already on the list: a short note instead of the confirmation, with a fresh
      // unsubscribe token. The response is identical either way (04 §1).
      const kind = alreadySubscribed ? 'already-subscribed' : 'confirm';
      const message: RenderedEmail = alreadySubscribed
        ? await renderAlreadySubscribedEmail({
            unsubscribeToken: sealUnsubscribeToken(config.key, email),
            siteUrl: config.siteUrl,
          })
        : await renderConfirmEmail({
            token: sealConfirmToken(config.key, email, at),
            siteUrl: config.siteUrl,
          });

      operation = 'send-email';
      await provider.sendEmail(
        {
          from: message.from,
          to: email,
          subject: message.subject,
          html: message.html,
          text: message.text,
          headers: message.headers,
        },
        { idempotencyKey: idempotencyKey(kind, email, at) },
      );
    } catch (error) {
      return json(
        503,
        { error: 'unavailable' },
        {},
        asProviderError(operation, error),
      );
    }

    return json(202, CHECK_INBOX);
  }

  async function confirm(
    request: NewsletterRequest,
  ): Promise<NewsletterResponse> {
    if (request.method !== 'GET') return methodNotAllowed('GET');
    const expired = `${SUBSCRIBE_PAGE}?status=expired`;
    if (!ready) return redirect(expired);
    const { config, provider } = ready;

    const opened = openToken(
      config.key,
      'confirm',
      firstValue(request.query['token']),
      now(),
    );
    if (!opened.ok) return redirect(expired);
    const { email } = opened.payload;

    // An idempotent upsert, so confirming twice is harmless and leaves one contact. The
    // contact gets a fresh unsubscribe token for Broadcasts (04 §4); older ones keep working.
    const properties = {
      [UNSUBSCRIBE_TOKEN_PROPERTY]: sealUnsubscribeToken(config.key, email),
    };
    let operation: ProviderOperation = 'update-contact';
    try {
      const updated = await provider.updateContact(email, {
        unsubscribed: false,
        properties,
      });
      if (updated === 'not-found') {
        operation = 'create-contact';
        const created = await provider.createContact({
          email,
          unsubscribed: false,
          properties,
        });
        if (created === 'exists') {
          // Another confirm won the race; make sure this one's settings stick.
          operation = 'update-contact';
          await provider.updateContact(email, {
            unsubscribed: false,
            properties,
          });
        }
      }
    } catch (error) {
      // The Expired page offers a fresh link, which is the most useful next step.
      return redirect(expired, asProviderError(operation, error));
    }

    return redirect(
      `${SUBSCRIBE_PAGE}?status=confirmed#for=${maskedFragment(email)}`,
    );
  }

  async function unsubscribe(
    request: NewsletterRequest,
  ): Promise<NewsletterResponse> {
    // Never on GET: link scanners and prefetchers can't unsubscribe anyone (04 §1a).
    if (request.method !== 'POST') return methodNotAllowed('POST');

    const fields = bodyFields(request.body);
    const contentType = header(request, 'content-type');
    const accept = header(request, 'accept');

    // RFC 8058: a mail client's one-click POST carries `List-Unsubscribe=One-Click`.
    const oneClick = fields['List-Unsubscribe'] === 'One-Click';
    // A plain HTML form (the page's <noscript> fallback) gets a redirect back to the page.
    const formPost =
      !oneClick &&
      (contentType.startsWith('application/x-www-form-urlencoded') ||
        contentType.startsWith('multipart/form-data')) &&
      !accept.includes('application/json');

    const done = formPost
      ? redirect(`${UNSUBSCRIBE_PAGE}#done`)
      : json(200, UNSUBSCRIBED);
    const invalid = formPost
      ? redirect(`${UNSUBSCRIBE_PAGE}#invalid`)
      : json(400, { error: 'invalid-token' });
    const unavailable = (failure?: NewsletterProviderError) =>
      formPost
        ? redirect(`${UNSUBSCRIBE_PAGE}#error`, failure)
        : json(503, { error: 'unavailable' }, {}, failure);

    if (!ready) return unavailable();
    const { config, provider } = ready;

    const token =
      firstValue(request.query['token']) ??
      (typeof fields['token'] === 'string' ? fields['token'] : undefined);
    const opened = openToken(config.key, 'unsubscribe', token, now());
    if (!opened.ok) return invalid;

    try {
      // A contact that's gone (deleted on request) counts as unsubscribed: same answer.
      await provider.updateContact(opened.payload.email, {
        unsubscribed: true,
      });
    } catch (error) {
      return unavailable(asProviderError('update-contact', error));
    }
    return done;
  }

  return { subscribe, confirm, unsubscribe };
}
