import { NewsletterProviderError } from './provider';
import { createResendProvider } from './resend-provider';

interface Captured {
  readonly method: string;
  readonly url: string;
  readonly headers: Headers;
  readonly body: unknown;
}

/** Stubs `fetch` for the SDK: records each request and answers with the next response. */
function stubFetch(...responses: Array<[number, unknown]>) {
  const captured: Captured[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    captured.push({
      method: init.method ?? 'GET',
      url,
      headers: new Headers(init.headers),
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    const [status, body] = responses.shift() ?? [200, {}];
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return captured;
}

const provider = () =>
  createResendProvider({ apiKey: 're_test', audienceId: 'aud_123' });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createResendProvider', () => {
  it('reads a contact from the audience, and treats 404 as none', async () => {
    const captured = stubFetch(
      [200, { object: 'contact', id: 'c1', unsubscribed: false }],
      [
        404,
        { name: 'not_found', statusCode: 404, message: 'Contact not found' },
      ],
    );
    expect(await provider().getContact('reader@example.com')).toEqual({
      unsubscribed: false,
    });
    expect(await provider().getContact('reader@example.com')).toBeNull();
    expect(captured[0].url).toMatch(
      /\/audiences\/aud_123\/contacts\/reader@example\.com$/,
    );
  });

  it('creates a contact with the unsubscribe_token property', async () => {
    const captured = stubFetch([201, { object: 'contact', id: 'c1' }]);
    await provider().createContact({
      email: 'reader@example.com',
      unsubscribed: false,
      properties: { unsubscribe_token: 'tok' },
    });
    expect(captured[0].method).toBe('POST');
    expect(captured[0].url).toMatch(/\/audiences\/aud_123\/contacts$/);
    expect(captured[0].body).toMatchObject({
      email: 'reader@example.com',
      unsubscribed: false,
      properties: { unsubscribe_token: 'tok' },
    });
  });

  it('updates a contact, and reports a missing one', async () => {
    const captured = stubFetch(
      [200, { object: 'contact', id: 'c1' }],
      [404, { name: 'not_found', statusCode: 404, message: 'nope' }],
    );
    expect(
      await provider().updateContact('reader@example.com', {
        unsubscribed: true,
      }),
    ).toBe('updated');
    expect(captured[0].method).toBe('PATCH');
    expect(captured[0].body).toMatchObject({ unsubscribed: true });
    expect(
      await provider().updateContact('reader@example.com', {
        unsubscribed: true,
      }),
    ).toBe('not-found');
  });

  it('sends with an Idempotency-Key and the message headers', async () => {
    const captured = stubFetch([200, { id: 'e1' }]);
    const result = await provider().sendEmail(
      {
        from: 'Postkit <releases@postkit.org>',
        to: 'reader@example.com',
        subject: 'Subject',
        html: '<p>Hi</p>',
        text: 'Hi',
        headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      },
      { idempotencyKey: 'newsletter-confirm-abc' },
    );
    expect(result).toBe('sent');
    expect(captured[0].url).toMatch(/\/emails$/);
    expect(captured[0].headers.get('Idempotency-Key')).toBe(
      'newsletter-confirm-abc',
    );
    expect(captured[0].body).toMatchObject({
      to: 'reader@example.com',
      text: 'Hi',
      headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    });
  });

  it('treats a reused idempotency key as a duplicate, not a failure', async () => {
    stubFetch([
      409,
      {
        name: 'invalid_idempotent_request',
        statusCode: 409,
        message: 'Same idempotency key used with a different request payload.',
      },
    ]);
    const result = await provider().sendEmail(
      {
        from: 'a',
        to: 'reader@example.com',
        subject: 's',
        html: 'h',
        text: 't',
      },
      { idempotencyKey: 'k' },
    );
    expect(result).toBe('duplicate');
  });

  it('fails with an error that carries no address', async () => {
    stubFetch([
      422,
      {
        name: 'validation_error',
        statusCode: 422,
        message: 'Invalid `to` field: reader@example.com',
      },
    ]);
    const error = await provider()
      .sendEmail(
        {
          from: 'a',
          to: 'reader@example.com',
          subject: 's',
          html: 'h',
          text: 't',
        },
        { idempotencyKey: 'k' },
      )
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(NewsletterProviderError);
    expect(error).toMatchObject({
      operation: 'send-email',
      code: 'validation_error',
      status: 422,
    });
    expect((error as Error).message).not.toContain('reader');
  });
});
