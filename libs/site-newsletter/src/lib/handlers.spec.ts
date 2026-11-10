import { randomBytes } from 'node:crypto';

import { FakeProvider, providerOutage } from '../testing/fake-provider';
import type { NewsletterConfig } from './config';
import {
  createNewsletterHandlers,
  type NewsletterRequest,
  type NewsletterResponse,
} from './handlers';
import { createRateLimiter } from './rate-limit';
import {
  CONFIRM_TOKEN_TTL_MS,
  sealConfirmToken,
  sealUnsubscribeToken,
} from './tokens';

const EMAIL = 'reader@example.com';
const START = Date.UTC(2026, 10, 10, 12, 0, 0);

function setup() {
  const config: NewsletterConfig = {
    apiKey: 're_test',
    audienceId: 'aud_test',
    key: randomBytes(32),
    siteUrl: 'https://postkit.org',
  };
  const provider = new FakeProvider();
  const clock = { now: START };
  const handlers = createNewsletterHandlers({
    config,
    provider,
    addressLimiter: createRateLimiter({ limit: 3, windowMs: 60 * 60 * 1000 }),
    ipLimiter: createRateLimiter({ limit: 20, windowMs: 60 * 60 * 1000 }),
    now: () => clock.now,
  });
  return { config, provider, clock, handlers };
}

function request(overrides: Partial<NewsletterRequest>): NewsletterRequest {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    query: {},
    body: undefined,
    ip: '203.0.113.7',
    ...overrides,
  };
}

const subscribeRequest = (body: unknown, ip = '203.0.113.7') =>
  request({ body, ip });

/** The token in an email's confirm link or `List-Unsubscribe` header. */
function tokenFrom(text: string, path: string): string {
  const match = new RegExp(`${path.replace(/\//g, '\\/')}\\?token=([A-Za-z0-9_-]+)`).exec(text);
  if (!match) throw new Error(`No ${path} link`);
  return match[1];
}

/** Every URL the API redirects to or emails out, for the "no address in a URL" check. */
function urlsIn(response: NewsletterResponse, html = ''): string[] {
  const urls = [...html.matchAll(/https?:\/\/[^"<>\s]+/g)].map((m) => m[0]);
  if (response.headers['Location']) urls.push(response.headers['Location']);
  return urls;
}

describe('POST /api/newsletter/subscribe', () => {
  it('valid address → 202 and one confirm email', async () => {
    const { provider, handlers } = setup();
    const response = await handlers.subscribe(
      subscribeRequest({ email: '  Reader@Example.com ' }),
    );

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ state: 'check-inbox' });
    expect(provider.sent).toHaveLength(1);
    const [{ message, idempotencyKey }] = provider.sent;
    expect(message.to).toBe(EMAIL);
    expect(message.from).toBe('Postkit <releases@postkit.org>');
    expect(message.subject).toBe('Confirm your Postkit release emails');
    expect(message.text).toContain('/api/newsletter/confirm?token=');
    expect(idempotencyKey).toMatch(/^newsletter-confirm-[0-9a-f]{64}$/);
    expect(idempotencyKey).not.toContain('reader');
    // Nothing is added to the audience until the link is clicked.
    expect(provider.contacts.size).toBe(0);
  });

  it('existing subscriber → 202, the already-subscribed email, and an identical body', async () => {
    const { provider, handlers } = setup();
    const fresh = await handlers.subscribe(
      subscribeRequest({ email: 'new@example.com' }),
    );
    provider.seed(EMAIL);
    const existing = await handlers.subscribe(subscribeRequest({ email: EMAIL }));

    expect(existing.status).toBe(fresh.status);
    expect(existing.body).toEqual(fresh.body);
    expect(existing.headers).toEqual(fresh.headers);
    expect(provider.sent).toHaveLength(2);

    const { message } = provider.sent[1];
    expect(message.subject).toBe('You’re already getting Postkit release emails');
    expect(message.html).not.toContain('/api/newsletter/confirm');
    expect(message.headers).toMatchObject({
      'List-Unsubscribe': expect.stringMatching(
        /^<https:\/\/postkit\.org\/api\/newsletter\/unsubscribe\?token=[A-Za-z0-9_-]+>$/,
      ),
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
    expect(message.html).toContain('/newsletter/unsubscribe?token=');
  });

  it('an unsubscribed contact gets the confirm email again', async () => {
    const { provider, handlers } = setup();
    provider.seed(EMAIL, true);
    await handlers.subscribe(subscribeRequest({ email: EMAIL }));
    expect(provider.sent[0].message.subject).toBe(
      'Confirm your Postkit release emails',
    );
  });

  it.each([
    [{ email: 'not-an-address' }],
    [{ email: '' }],
    [{ email: 42 }],
    [{}],
    [undefined],
    ['{not json'],
  ])('bad address %j → 400', async (body) => {
    const { provider, handlers } = setup();
    const response = await handlers.subscribe(subscribeRequest(body));
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid-email' });
    expect(provider.sent).toHaveLength(0);
  });

  it('accepts a JSON string body', async () => {
    const { handlers } = setup();
    const response = await handlers.subscribe(
      subscribeRequest(JSON.stringify({ email: EMAIL })),
    );
    expect(response.status).toBe(202);
  });

  it('honeypot filled → 202 and nothing sent', async () => {
    const { provider, handlers } = setup();
    const response = await handlers.subscribe(
      subscribeRequest({ email: EMAIL, website: 'https://spam.example' }),
    );
    expect(response.status).toBe(202);
    expect(response.body).toEqual({ state: 'check-inbox' });
    expect(provider.calls).toEqual([]);
  });

  it('a fourth request for one address in an hour → 429', async () => {
    const { provider, handlers, clock } = setup();
    for (let index = 0; index < 3; index += 1) {
      clock.now = START + index * 11 * 60 * 1000;
      const response = await handlers.subscribe(
        subscribeRequest({ email: EMAIL }, `198.51.100.${index}`),
      );
      expect(response.status).toBe(202);
    }
    const limited = await handlers.subscribe(
      subscribeRequest({ email: EMAIL }, '198.51.100.99'),
    );
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({ error: 'rate-limited' });
    expect(provider.sent).toHaveLength(3);

    clock.now = START + 61 * 60 * 1000;
    const later = await handlers.subscribe(
      subscribeRequest({ email: EMAIL }, '198.51.100.100'),
    );
    expect(later.status).toBe(202);
  });

  it('too many requests from one IP → 429', async () => {
    const { handlers } = setup();
    for (let index = 0; index < 20; index += 1) {
      await handlers.subscribe(
        subscribeRequest({ email: `reader${index}@example.com` }),
      );
    }
    const limited = await handlers.subscribe(
      subscribeRequest({ email: 'one-more@example.com' }),
    );
    expect(limited.status).toBe(429);
  });

  it('a repeat inside 10 minutes reuses the idempotency key', async () => {
    const { provider, handlers, clock } = setup();
    await handlers.subscribe(subscribeRequest({ email: EMAIL }));
    clock.now = START + 60 * 1000;
    const again = await handlers.subscribe(subscribeRequest({ email: EMAIL }));
    // Resend would answer the second send as a duplicate; the reader already has an email.
    expect(again.status).toBe(202);
    expect(provider.sent).toHaveLength(1);
    expect(provider.calls.filter((call) => call === 'send-email')).toHaveLength(2);
  });

  it('Resend failing → 503 with a reportable error that holds no address', async () => {
    const { provider, handlers } = setup();
    provider.failWith = providerOutage();
    const response = await handlers.subscribe(subscribeRequest({ email: EMAIL }));
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'unavailable' });
    expect(response.failure?.message).not.toContain('reader');
  });

  it('not configured → 503 unavailable', async () => {
    const handlers = createNewsletterHandlers({ config: null, provider: null });
    const response = await handlers.subscribe(subscribeRequest({ email: EMAIL }));
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'unavailable' });
  });

  it('other methods → 405', async () => {
    const { handlers } = setup();
    const response = await handlers.subscribe(request({ method: 'GET' }));
    expect(response.status).toBe(405);
    expect(response.headers['Allow']).toBe('POST');
  });
});

describe('GET /api/newsletter/confirm', () => {
  const confirmRequest = (token: string | undefined) =>
    request({ method: 'GET', query: token === undefined ? {} : { token } });

  it('valid token → 303 to Confirmed with the masked address in the fragment', async () => {
    const { provider, handlers } = setup();
    await handlers.subscribe(subscribeRequest({ email: EMAIL }));
    const token = tokenFrom(provider.sent[0].message.text, '/api/newsletter/confirm');

    const response = await handlers.confirm(confirmRequest(token));
    expect(response.status).toBe(303);
    expect(response.headers['Location']).toBe(
      '/newsletter/subscribe?status=confirmed#for=r%E2%80%A6@example.com',
    );
    expect(decodeURIComponent(response.headers['Location'])).toBe(
      '/newsletter/subscribe?status=confirmed#for=r…@example.com',
    );

    const contact = provider.contacts.get(EMAIL);
    expect(contact?.unsubscribed).toBe(false);
    expect(contact?.properties['unsubscribe_token']).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('confirming twice leaves one contact', async () => {
    const { config, provider, handlers } = setup();
    const token = sealConfirmToken(config.key, EMAIL, START);
    expect((await handlers.confirm(confirmRequest(token))).status).toBe(303);
    expect((await handlers.confirm(confirmRequest(token))).headers['Location']).toContain(
      'status=confirmed',
    );
    expect(provider.contacts.size).toBe(1);
  });

  it('re-subscribes a contact that had unsubscribed', async () => {
    const { config, provider, handlers } = setup();
    provider.seed(EMAIL, true);
    await handlers.confirm(confirmRequest(sealConfirmToken(config.key, EMAIL, START)));
    expect(provider.contacts.get(EMAIL)?.unsubscribed).toBe(false);
  });

  it('tampered token → 303 to Expired, nothing changed', async () => {
    const { config, provider, handlers } = setup();
    const token = sealConfirmToken(config.key, EMAIL, START);
    const tampered = `${token.slice(0, -2)}${token.endsWith('AA') ? 'BB' : 'AA'}`;
    const response = await handlers.confirm(confirmRequest(tampered));
    expect(response.status).toBe(303);
    expect(response.headers['Location']).toBe('/newsletter/subscribe?status=expired');
    expect(provider.calls).toEqual([]);
  });

  it('a token 7 days and 1 second old → Expired', async () => {
    const { config, provider, handlers, clock } = setup();
    const token = sealConfirmToken(config.key, EMAIL, START);
    clock.now = START + CONFIRM_TOKEN_TTL_MS + 1000;
    const response = await handlers.confirm(confirmRequest(token));
    expect(response.headers['Location']).toBe('/newsletter/subscribe?status=expired');
    expect(provider.contacts.size).toBe(0);
  });

  it('missing or garbage token → Expired', async () => {
    const { handlers } = setup();
    for (const token of [undefined, '', 'garbage', '%%%']) {
      const response = await handlers.confirm(confirmRequest(token));
      expect(response.headers['Location']).toBe('/newsletter/subscribe?status=expired');
    }
  });

  it('an unsubscribe token can’t subscribe anyone', async () => {
    const { config, provider, handlers } = setup();
    const response = await handlers.confirm(
      confirmRequest(sealUnsubscribeToken(config.key, EMAIL)),
    );
    expect(response.headers['Location']).toBe('/newsletter/subscribe?status=expired');
    expect(provider.contacts.size).toBe(0);
  });

  it('not configured → Expired', async () => {
    const handlers = createNewsletterHandlers({ config: null, provider: null });
    const response = await handlers.confirm(confirmRequest('anything'));
    expect(response.status).toBe(303);
    expect(response.headers['Location']).toBe('/newsletter/subscribe?status=expired');
  });

  it('other methods → 405', async () => {
    const { handlers } = setup();
    expect((await handlers.confirm(request({ method: 'POST' }))).status).toBe(405);
  });
});

describe('POST /api/newsletter/unsubscribe', () => {
  async function subscribed() {
    const context = setup();
    context.provider.seed(EMAIL);
    const token = sealUnsubscribeToken(context.config.key, EMAIL);
    return { ...context, token };
  }

  it('unsubscribe token → 200 and the contact unsubscribed; again → 200, no change', async () => {
    const { provider, handlers, token } = await subscribed();
    const first = await handlers.unsubscribe(
      request({ body: { token } }),
    );
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ state: 'unsubscribed' });
    expect(provider.contacts.get(EMAIL)?.unsubscribed).toBe(true);

    const second = await handlers.unsubscribe(request({ query: { token } }));
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(provider.contacts.get(EMAIL)?.unsubscribed).toBe(true);
    expect(provider.contacts.size).toBe(1);
  });

  it('a contact that no longer exists still answers 200', async () => {
    const { config, handlers } = setup();
    const response = await handlers.unsubscribe(
      request({ query: { token: sealUnsubscribeToken(config.key, 'gone@example.com') } }),
    );
    expect(response.status).toBe(200);
  });

  it('a confirm token → 400, nothing changed', async () => {
    const { config, provider, handlers } = await subscribed();
    const response = await handlers.unsubscribe(
      request({ body: { token: sealConfirmToken(config.key, EMAIL, START) } }),
    );
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'invalid-token' });
    expect(provider.contacts.get(EMAIL)?.unsubscribed).toBe(false);
  });

  it('a tampered or missing token → 400', async () => {
    const { handlers, token } = await subscribed();
    const tampered = `A${token.slice(1)}` === token ? `B${token.slice(1)}` : `A${token.slice(1)}`;
    expect((await handlers.unsubscribe(request({ body: { token: tampered } }))).status).toBe(400);
    expect((await handlers.unsubscribe(request({ body: {} }))).status).toBe(400);
  });

  it('RFC 8058 one-click POST → 200', async () => {
    const { provider, handlers, token } = await subscribed();
    const response = await handlers.unsubscribe(
      request({
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        query: { token },
        body: { 'List-Unsubscribe': 'One-Click' },
      }),
    );
    expect(response.status).toBe(200);
    expect(provider.contacts.get(EMAIL)?.unsubscribed).toBe(true);
  });

  it('one-click with an unparsed body → 200', async () => {
    const { handlers, token } = await subscribed();
    const response = await handlers.unsubscribe(
      request({
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        query: { token },
        body: 'List-Unsubscribe=One-Click',
      }),
    );
    expect(response.status).toBe(200);
  });

  it('an HTML form post → 303 to the page’s Done or Invalid state', async () => {
    const { provider, handlers, token } = await subscribed();
    const form = { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' };
    const done = await handlers.unsubscribe(request({ headers: form, body: { token } }));
    expect(done.status).toBe(303);
    expect(done.headers['Location']).toBe('/newsletter/unsubscribe#done');
    expect(provider.contacts.get(EMAIL)?.unsubscribed).toBe(true);

    const invalid = await handlers.unsubscribe(
      request({ headers: form, body: { token: 'nope' } }),
    );
    expect(invalid.status).toBe(303);
    expect(invalid.headers['Location']).toBe('/newsletter/unsubscribe#invalid');
  });

  it('a form-encoded fetch that accepts JSON gets JSON', async () => {
    const { handlers, token } = await subscribed();
    const response = await handlers.unsubscribe(
      request({
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
        body: { token },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ state: 'unsubscribed' });
  });

  it('GET never changes anything → 405', async () => {
    const { provider, handlers, token } = await subscribed();
    const response = await handlers.unsubscribe(
      request({ method: 'GET', query: { token } }),
    );
    expect(response.status).toBe(405);
    expect(response.headers['Allow']).toBe('POST');
    expect(provider.calls).toEqual([]);
    expect(provider.contacts.get(EMAIL)?.unsubscribed).toBe(false);
  });

  it('Resend failing → 503 (JSON) or 303 #error (form)', async () => {
    const { provider, handlers, token } = await subscribed();
    provider.failWith = providerOutage();
    const fetched = await handlers.unsubscribe(request({ body: { token } }));
    expect(fetched.status).toBe(503);
    expect(fetched.body).toEqual({ error: 'unavailable' });
    const posted = await handlers.unsubscribe(
      request({
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: { token },
      }),
    );
    expect(posted.headers['Location']).toBe('/newsletter/unsubscribe#error');
  });
});

describe('the whole loop', () => {
  it('subscribe → confirm → already subscribed → unsubscribe from the header and the footer', async () => {
    const { provider, handlers, clock } = setup();

    await handlers.subscribe(subscribeRequest({ email: EMAIL }));
    const confirmToken = tokenFrom(provider.sent[0].message.html, '/api/newsletter/confirm');
    const confirmed = await handlers.confirm(
      request({ method: 'GET', query: { token: confirmToken } }),
    );
    expect(confirmed.headers['Location']).toContain('status=confirmed');

    clock.now += 11 * 60 * 1000;
    await handlers.subscribe(subscribeRequest({ email: EMAIL }));
    const already = provider.sent[1].message;
    expect(already.subject).toBe('You’re already getting Postkit release emails');

    // The mail client's one-click button, from the header.
    const headerToken = tokenFrom(
      already.headers?.['List-Unsubscribe'] ?? '',
      '/api/newsletter/unsubscribe',
    );
    const oneClick = await handlers.unsubscribe(
      request({
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        query: { token: headerToken },
        body: { 'List-Unsubscribe': 'One-Click' },
      }),
    );
    expect(oneClick.status).toBe(200);
    expect(provider.contacts.get(EMAIL)?.unsubscribed).toBe(true);

    // The footer link's page, posting the token on load; and the token stored for Broadcasts.
    const footerToken = tokenFrom(already.html, '/newsletter/unsubscribe');
    const storedToken = provider.contacts.get(EMAIL)?.properties['unsubscribe_token'] ?? '';
    for (const token of [footerToken, storedToken]) {
      const response = await handlers.unsubscribe(request({ body: { token } }));
      expect(response.status).toBe(200);
    }

    // No address in any URL the API redirected to or emailed out (the masked fragment aside).
    const urls = [
      ...urlsIn(confirmed),
      ...provider.sent.flatMap(({ message }) => [
        ...urlsIn({ status: 0, headers: {} }, message.html),
        ...urlsIn({ status: 0, headers: {} }, message.text),
        ...Object.values<string>(message.headers ?? {}),
      ]),
    ];
    expect(urls.length).toBeGreaterThan(4);
    for (const url of urls) {
      const withoutFragment = url.split('#')[0];
      expect(withoutFragment).not.toContain('reader');
      expect(withoutFragment).not.toContain('example.com');
      expect(decodeURIComponent(url)).not.toContain(EMAIL);
    }
  });
});
