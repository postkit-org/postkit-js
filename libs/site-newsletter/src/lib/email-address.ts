/**
 * Addresses are normalised (trimmed and lower-cased) but never otherwise altered (04 §1):
 * no dot or `+tag` stripping.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** RFC 5321's limits: 254 characters in all, 64 in the local part. */
const MAX_LENGTH = 254;
const MAX_LOCAL_LENGTH = 64;

/**
 * A pragmatic check for a normalised address. The local part allows the characters people
 * actually use (letters, digits and `.!$&'*+=^_`{|}~-`), without leading, trailing or
 * doubled dots. Characters that would be read as URL syntax (`/ ? # %`) are refused: the
 * address becomes a path segment in Resend's contacts API. The domain needs at least two
 * labels and a letter-only top-level label.
 */
const LOCAL_PART = /^[a-z0-9!$&'*+=^_`{|}~-]+(?:\.[a-z0-9!$&'*+=^_`{|}~-]+)*$/;
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Whether a normalised address is acceptable. */
export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > MAX_LENGTH) return false;
  const at = email.lastIndexOf('@');
  if (at <= 0 || at !== email.indexOf('@')) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return (
    local.length <= MAX_LOCAL_LENGTH &&
    LOCAL_PART.test(local) &&
    DOMAIN.test(domain)
  );
}

/**
 * The address as the Confirmed page shows it: the first character, an ellipsis and the
 * domain (`r…@example.com`). Only this masked form ever appears in a URL, and only in the
 * fragment, which browsers never send to servers (04 §1).
 */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '…';
  return `${email.slice(0, 1)}…${email.slice(at)}`;
}
