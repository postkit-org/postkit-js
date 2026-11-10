import type { NextApiRequest, NextApiResponse } from 'next';

import {
  createNewsletterHandlersFromEnv,
  createNextNewsletterRoute,
} from './next-route';
import { NewsletterProviderError } from './provider';

function fakeResponse() {
  const state = {
    status: 0,
    headers: {} as Record<string, string>,
    body: undefined as string | undefined,
    ended: false,
  };
  const response = {
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return response;
    },
    status(code: number) {
      state.status = code;
      return response;
    },
    send(body: string) {
      state.body = body;
      state.ended = true;
    },
    end() {
      state.ended = true;
    },
  };
  return { state, response: response as unknown as NextApiResponse };
}

function fakeRequest(overrides: Partial<NextApiRequest>): NextApiRequest {
  return {
    method: 'POST',
    headers: {},
    query: {},
    body: undefined,
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as NextApiRequest;
}

describe('createNewsletterHandlersFromEnv', () => {
  it('is unavailable without the Resend and secret variables', async () => {
    const handlers = createNewsletterHandlersFromEnv({});
    const response = await handlers.subscribe({
      method: 'POST',
      headers: {},
      query: {},
      body: { email: 'reader@example.com' },
    });
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'unavailable' });
  });

  it('is unavailable with a secret that isn’t 32 bytes', async () => {
    const handlers = createNewsletterHandlersFromEnv({
      RESEND_API_KEY: 're_test',
      RESEND_AUDIENCE_ID: 'aud',
      SUBSCRIBE_SECRET: 'c2hvcnQ=',
    });
    const response = await handlers.subscribe({
      method: 'POST',
      headers: {},
      query: {},
      body: {},
    });
    expect(response.status).toBe(503);
  });
});

describe('createNextNewsletterRoute', () => {
  it('writes the status, headers and JSON body, and logs nothing', async () => {
    const consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (method) => vi.spyOn(console, method).mockImplementation(() => undefined),
    );
    const route = createNextNewsletterRoute(
      createNewsletterHandlersFromEnv({}).subscribe,
    );
    const { state, response } = fakeResponse();
    await route(
      fakeRequest({ body: { email: 'reader@example.com' } }),
      response,
    );

    expect(state.status).toBe(503);
    expect(state.headers['Content-Type']).toBe('application/json; charset=utf-8');
    expect(state.headers['Cache-Control']).toBe('no-store');
    expect(JSON.parse(state.body ?? '')).toEqual({ error: 'unavailable' });
    for (const spy of consoleSpies) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });

  it('ends redirects without a body', async () => {
    const route = createNextNewsletterRoute(
      createNewsletterHandlersFromEnv({}).confirm,
    );
    const { state, response } = fakeResponse();
    await route(
      fakeRequest({ method: 'GET', query: { token: 'garbage' } }),
      response,
    );
    expect(state.status).toBe(303);
    expect(state.headers['Location']).toBe('/newsletter/subscribe?status=expired');
    expect(state.body).toBeUndefined();
    expect(state.ended).toBe(true);
  });

  it('reports provider failures through onFailure', async () => {
    const onFailure = vi.fn();
    const route = createNextNewsletterRoute(
      async () => ({
        status: 503,
        headers: {},
        body: { error: 'unavailable' },
        failure: new NewsletterProviderError(
          'send-email',
          'application_error',
          500,
        ),
      }),
      { onFailure },
    );
    await route(fakeRequest({}), fakeResponse().response);
    expect(onFailure).toHaveBeenCalledTimes(1);
  });
});
