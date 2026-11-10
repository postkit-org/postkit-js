import type { NextApiRequest, NextApiResponse } from 'next';

import { readNewsletterConfig, type NewsletterEnv } from './config';
import {
  createNewsletterHandlers,
  type NewsletterHandlers,
  type NewsletterRequest,
  type NewsletterResponse,
} from './handlers';
import type { NewsletterProviderError } from './provider';
import { createResendProvider } from './resend-provider';

/**
 * The production handlers: configuration from the environment and the real Resend client.
 * Without `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` and a valid `SUBSCRIBE_SECRET` there's no
 * provider and every route answers `unavailable`. There's no fake on this path; tests build
 * handlers with `createNewsletterHandlers` and their own provider.
 */
export function createNewsletterHandlersFromEnv(
  env: NewsletterEnv = process.env,
): NewsletterHandlers {
  const config = readNewsletterConfig(env);
  return createNewsletterHandlers({
    config,
    provider: config
      ? createResendProvider({
          apiKey: config.apiKey,
          audienceId: config.audienceId,
        })
      : null,
  });
}

/** The client IP for the per-IP limit: Vercel's `x-real-ip`, then `x-forwarded-for`. */
function clientIp(request: NextApiRequest): string | undefined {
  const realIp = request.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp.trim();
  const forwarded = request.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(',')[0]
    ?.trim();
  return first || request.socket?.remoteAddress || undefined;
}

/** The largest body worth reading: an address and a token fit in a fraction of this. */
const MAX_BODY_BYTES = 8 * 1024;

/**
 * The raw body as a string, for routes with Next's body parser off (so a malformed JSON body
 * gets the API's own 400, not Next's). The handlers parse JSON and form bodies themselves.
 * Anything over {@link MAX_BODY_BYTES} reads as empty.
 */
async function readBody(request: NextApiRequest): Promise<unknown> {
  if (request.body !== undefined) return request.body;
  if (!(Symbol.asyncIterator in request)) return undefined;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer | string>) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += buffer.length;
    if (size > MAX_BODY_BYTES) return '';
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export interface NextNewsletterRouteOptions {
  /**
   * Called when Resend fails, with an error that names the operation, Resend's error name
   * and the status, never an address. The site reports it to Sentry.
   */
  readonly onFailure?: (failure: NewsletterProviderError) => void;
}

/**
 * Adapts one newsletter handler to a Pages Router API route. Nothing is logged: no request
 * body, no query, no token.
 */
export function createNextNewsletterRoute(
  handler: (request: NewsletterRequest) => Promise<NewsletterResponse>,
  { onFailure }: NextNewsletterRouteOptions = {},
) {
  return async function newsletterRoute(
    request: NextApiRequest,
    response: NextApiResponse,
  ): Promise<void> {
    const result = await handler({
      method: request.method,
      headers: request.headers,
      query: request.query,
      // GET and other methods never need the body (and the handlers ignore it).
      body: request.method === 'POST' ? await readBody(request) : undefined,
      ip: clientIp(request),
    });

    if (result.failure) onFailure?.(result.failure);

    for (const [name, value] of Object.entries(result.headers)) {
      response.setHeader(name, value);
    }
    response.status(result.status);
    if (result.body) {
      response.send(JSON.stringify(result.body));
    } else {
      response.end();
    }
  };
}
