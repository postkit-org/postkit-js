import {
  cleanAnalyticsUrl,
  redactEmails,
  REDACTED_EMAIL,
  REDACTED_TOKEN,
  scrubDeep,
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  stripTokenParams,
} from './scrub';

describe('redactEmails', () => {
  it.each([
    ['ada@example.com', REDACTED_EMAIL],
    [
      'Contact: Ada.Lovelace+news@mail.example.co.uk.',
      `Contact: ${REDACTED_EMAIL}.`,
    ],
    ['{"email":"ada@example.com"}', `{"email":"${REDACTED_EMAIL}"}`],
    [
      '/subscribe?email=ada%40example.com',
      `/subscribe?email=${REDACTED_EMAIL}`,
    ],
    [
      '/newsletter/check#for=r…@example.com',
      `/newsletter/check#for=${REDACTED_EMAIL}`,
    ],
    ['<ada@example.com>', `<${REDACTED_EMAIL}>`],
    ['a@x.io and b@y.dev', `${REDACTED_EMAIL} and ${REDACTED_EMAIL}`],
  ])('redacts %s', (input, expected) => {
    expect(redactEmails(input)).toBe(expected);
  });

  it.each([
    'npm install @postkit/chakra',
    'react@19.1.0',
    'at render (webpack-internal:///./node_modules/@sentry/nextjs/index.js:1:2)',
    'Cannot read properties of undefined',
  ])('leaves %s alone', (input) => {
    expect(redactEmails(input)).toBe(input);
  });
});

describe('stripTokenParams', () => {
  it.each([
    ['/newsletter/confirm?token=abc.def_ghi', '/newsletter/confirm'],
    [
      '/newsletter/confirm?token=abc&utm_source=x',
      '/newsletter/confirm?utm_source=x',
    ],
    [
      '/newsletter/confirm?utm_source=x&token=abc',
      '/newsletter/confirm?utm_source=x',
    ],
    ['/newsletter/confirm?a=1&token=abc&b=2', '/newsletter/confirm?a=1&b=2'],
    ['/newsletter/confirm?token=a&token=b', '/newsletter/confirm'],
    ['/newsletter/confirm?TOKEN=abc#top', '/newsletter/confirm#top'],
    [
      'https://postkit.org/newsletter/unsubscribe?token=abc',
      'https://postkit.org/newsletter/unsubscribe',
    ],
    [
      'GET /newsletter/confirm?token=abc failed with 500',
      'GET /newsletter/confirm failed with 500',
    ],
    ['token=abc&a=1', 'a=1'],
    ['token=abc', ''],
    [
      '/login?from=%2Fnewsletter%2Fconfirm%3Ftoken%3Dabc',
      '/login?from=%2Fnewsletter%2Fconfirm',
    ],
    [
      '/login?from=%2Fnewsletter%2Fconfirm%3Fa%3D1%26token%3Dabc',
      '/login?from=%2Fnewsletter%2Fconfirm%3Fa%3D1',
    ],
  ])('strips the token from %s', (input, expected) => {
    expect(stripTokenParams(input)).toBe(expected);
  });

  it.each([
    '/docs?q=tokens',
    '/docs?csrftoken=1',
    '/docs?mytoken=1&a=2',
    'What? No token here.',
    'a=1&b=2',
  ])('leaves %s alone', (input) => {
    expect(stripTokenParams(input)).toBe(input);
  });
});

describe('scrubSentryEvent', () => {
  const event = {
    message: 'Subscribe failed for ada@example.com',
    exception: {
      values: [
        {
          type: 'Error',
          value: 'Resend rejected ada@example.com',
          stacktrace: {
            frames: [{ filename: 'app:///_next/static/chunks/pages/index.js' }],
          },
        },
      ],
    },
    request: {
      url: 'https://postkit.org/newsletter/confirm?token=sealed&ref=email#for=a…@example.com',
      query_string: 'token=sealed&ref=email',
      data: '{"email":"ada@example.com","source":"home"}',
      headers: {
        Referer: 'https://postkit.org/newsletter/confirm?token=sealed',
        'User-Agent': 'Mozilla/5.0',
      },
    },
    breadcrumbs: [
      {
        category: 'navigation',
        data: { from: '/', to: '/newsletter/confirm?token=sealed' },
      },
      {
        category: 'console',
        message: 'posting ada@example.com',
        data: { arguments: ['posting', { email: 'ada@example.com' }] },
      },
    ],
    extra: { body: { email: 'ada@example.com', token: 'sealed' } },
    tags: { route: '/newsletter/confirm' },
    level: 'error',
    timestamp: 1,
  };

  const scrubbed = scrubSentryEvent(event);
  const serialized = JSON.stringify(scrubbed);

  it('removes every address and token', () => {
    expect(serialized).not.toMatch(/ada@example\.com|a…@example\.com/);
    expect(serialized).not.toContain('sealed');
  });

  it('scrubs messages, exceptions and bodies', () => {
    expect(scrubbed.message).toBe(`Subscribe failed for ${REDACTED_EMAIL}`);
    expect(scrubbed.exception.values[0].value).toBe(
      `Resend rejected ${REDACTED_EMAIL}`,
    );
    expect(scrubbed.request.data).toBe(
      `{"email":"${REDACTED_EMAIL}","source":"home"}`,
    );
    expect(scrubbed.extra.body).toEqual({
      email: REDACTED_EMAIL,
      token: REDACTED_TOKEN,
    });
  });

  it('scrubs URLs, query strings and headers but keeps other parameters', () => {
    expect(scrubbed.request.url).toBe(
      `https://postkit.org/newsletter/confirm?ref=email#for=${REDACTED_EMAIL}`,
    );
    expect(scrubbed.request.query_string).toBe('ref=email');
    expect(scrubbed.request.headers.Referer).toBe(
      'https://postkit.org/newsletter/confirm',
    );
    expect(scrubbed.request.headers['User-Agent']).toBe('Mozilla/5.0');
  });

  it('scrubs breadcrumbs inside the event', () => {
    expect(scrubbed.breadcrumbs[0].data).toEqual({
      from: '/',
      to: '/newsletter/confirm',
    });
    expect(scrubbed.breadcrumbs[1].message).toBe(`posting ${REDACTED_EMAIL}`);
  });

  it('leaves unrelated fields untouched and does not mutate the input', () => {
    expect(scrubbed.tags).toEqual({ route: '/newsletter/confirm' });
    expect(scrubbed.level).toBe('error');
    expect(scrubbed.timestamp).toBe(1);
    expect(scrubbed.exception.values[0].stacktrace.frames[0].filename).toBe(
      'app:///_next/static/chunks/pages/index.js',
    );
    expect(event.message).toBe('Subscribe failed for ada@example.com');
  });

  it('handles query strings in object and pair form', () => {
    expect(
      scrubDeep({ query_string: { token: 'sealed', ref: 'email' } })
        .query_string,
    ).toEqual({ token: REDACTED_TOKEN, ref: 'email' });
    expect(
      scrubDeep({
        query_string: [
          ['token', 'sealed'],
          ['ref', 'email'],
        ],
      }).query_string,
    ).toEqual([['ref', 'email']]);
  });

  it('redacts addresses used as object keys', () => {
    expect(scrubDeep({ 'ada@example.com': 1 })).toEqual({
      [REDACTED_EMAIL]: 1,
    });
  });

  it('survives cycles and leaves class instances alone', () => {
    const error = new Error('ada@example.com');
    const cyclic: Record<string, unknown> = { error };
    cyclic.self = cyclic;
    const result = scrubDeep(cyclic);
    expect(result.error).toBe(error);
    expect(result.self).toBe(cyclic);
  });
});

describe('scrubSentryBreadcrumb', () => {
  it('scrubs fetch breadcrumbs', () => {
    expect(
      scrubSentryBreadcrumb({
        category: 'fetch',
        data: {
          method: 'POST',
          url: '/api/newsletter/unsubscribe?token=sealed',
          status_code: 200,
        },
      }),
    ).toEqual({
      category: 'fetch',
      data: {
        method: 'POST',
        url: '/api/newsletter/unsubscribe',
        status_code: 200,
      },
    });
  });

  it('scrubs UI breadcrumbs that captured an address', () => {
    expect(
      scrubSentryBreadcrumb({
        category: 'ui.input',
        message: 'input[name="email"][value="ada@example.com"]',
      }).message,
    ).toBe(`input[name="email"][value="${REDACTED_EMAIL}"]`);
  });
});

describe('cleanAnalyticsUrl', () => {
  it.each([
    [
      'https://postkit.org/newsletter/confirm?token=sealed',
      'https://postkit.org/newsletter/confirm',
    ],
    [
      'https://postkit.org/newsletter/check?token=sealed#for=r…@example.com',
      'https://postkit.org/newsletter/check',
    ],
    [
      'https://postkit.org/docs?utm_source=newsletter&token=sealed',
      'https://postkit.org/docs?utm_source=newsletter',
    ],
    [
      'https://postkit.org/?ref=ada@example.com',
      `https://postkit.org/?ref=${REDACTED_EMAIL}`,
    ],
    ['https://postkit.org/docs/install', 'https://postkit.org/docs/install'],
  ])('cleans %s', (input, expected) => {
    expect(cleanAnalyticsUrl(input)).toBe(expected);
  });
});
