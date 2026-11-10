import { parseSubscribeSecret } from './tokens';

/** The environment the newsletter routes read (04 §5). */
export interface NewsletterEnv {
  readonly [name: string]: string | undefined;
  readonly RESEND_API_KEY?: string;
  readonly RESEND_AUDIENCE_ID?: string;
  readonly SUBSCRIBE_SECRET?: string;
  readonly NEXT_PUBLIC_SITE_URL?: string;
}

export interface NewsletterConfig {
  readonly apiKey: string;
  readonly audienceId: string;
  /** The 32-byte AES-256-GCM key decoded from `SUBSCRIBE_SECRET`. */
  readonly key: Buffer;
  /** The origin for links in emails and redirects, without a trailing slash. */
  readonly siteUrl: string;
}

/**
 * The newsletter's configuration, or `null` when any of `RESEND_API_KEY`,
 * `RESEND_AUDIENCE_ID` or `SUBSCRIBE_SECRET` is missing (or the secret isn't 32 base64
 * bytes). Without it the routes answer `unavailable` and nothing is sent; the site still
 * builds and every other page works.
 */
export function readNewsletterConfig(env: NewsletterEnv): NewsletterConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const audienceId = env.RESEND_AUDIENCE_ID?.trim();
  const key = parseSubscribeSecret(env.SUBSCRIBE_SECRET);
  if (!apiKey || !audienceId || !key) return null;
  return {
    apiKey,
    audienceId,
    key,
    siteUrl: (env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://postkit.org').replace(
      /\/+$/,
      '',
    ),
  };
}
