/** The sender of every site email (09 Q9). */
export const EMAIL_FROM = 'Postkit <releases@postkit.org>';

/**
 * The mailing address in every footer (09 Q5; USPS needs the PMB on mail to it). Split where
 * narrow clients may wrap it: after the suite and PMB, never inside "Atlanta, GA 30339-2171".
 */
export const POSTAL_ADDRESS_LINES = [
  '1870 The Exchange SE Ste 220, PMB 980007,',
  'Atlanta, GA 30339-2171',
] as const;

export const POSTAL_ADDRESS = POSTAL_ADDRESS_LINES.join(' ');

/** Who sends the emails, before the address in the footer's last line. */
export const FOOTER_SENDER = 'Postkit, by Commune Software';

/** The footer's last line. */
export const FOOTER_SIGNATURE = `${FOOTER_SENDER} · ${POSTAL_ADDRESS}`;

/** Why the reader got a confirm or already-subscribed email. */
export const FOOTER_REASON =
  'You’re getting this because someone entered this address at postkit.org.';

/** The production origin. Preview deploys pass their own (04 §5). */
export const DEFAULT_SITE_URL = 'https://postkit.org';

/** `https://postkit.org/` → `https://postkit.org`. */
export function normalizeSiteUrl(siteUrl: string | undefined): string {
  return (siteUrl?.trim() || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

/** The links the emails carry. Tokens are base64url, but they're encoded anyway. */
export function newsletterUrls(siteUrl: string | undefined) {
  const origin = normalizeSiteUrl(siteUrl);
  return {
    home: `${origin}/`,
    privacy: `${origin}/privacy`,
    /** The confirm link: the API redirects to the subscribe page (04 §1). */
    confirm: (token: string) =>
      `${origin}/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
    /** The footer link: a static page that POSTs the token on load (04 §1a). */
    unsubscribePage: (token: string) =>
      `${origin}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
    /** The `List-Unsubscribe` target for RFC 8058 one-click POSTs. */
    unsubscribeOneClick: (token: string) =>
      `${origin}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
  };
}
