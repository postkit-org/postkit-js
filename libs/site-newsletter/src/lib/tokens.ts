import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Sealed newsletter tokens (04 §1, "Tokens").
 *
 * A token is `base64url(nonce ‖ ciphertext ‖ tag)`: AES-256-GCM with a random 96-bit nonce,
 * keyed by `SUBSCRIBE_SECRET`, with the purpose as associated data. The plaintext is
 * `{ email, expiresAt? }`, so the address can't be read from a token and never appears in a
 * URL. Tampering fails the tag check, and because the purpose is bound into the tag, a
 * confirm token can't unsubscribe anyone and an unsubscribe token can't subscribe anyone.
 */

export type TokenPurpose = 'confirm' | 'unsubscribe';

export interface TokenPayload {
  /** The normalised address. */
  readonly email: string;
  /** Milliseconds since the epoch; absent on tokens that never expire. */
  readonly expiresAt?: number;
}

/** Confirm links work for 7 days (04 §1). Unsubscribe tokens never expire. */
export const CONFIRM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

/**
 * The longest token worth trying to open. A real one is about 120 characters (a 254-character
 * address plus JSON and the 28 bytes of nonce and tag stay well under this).
 */
const MAX_TOKEN_LENGTH = 1024;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

/**
 * Decodes `SUBSCRIBE_SECRET`: exactly 32 random bytes, base64-encoded (base64url is accepted
 * too). Returns `null` for anything else, so a short or malformed key turns the feature off
 * instead of weakening it.
 */
export function parseSubscribeSecret(value: string | undefined): Buffer | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(trimmed)) return null;
  const key = Buffer.from(trimmed, 'base64');
  return key.length === KEY_BYTES ? key : null;
}

/** Seals `payload` for `purpose`. A fresh random nonce every time, so tokens never repeat. */
export function sealToken(
  key: Buffer,
  purpose: TokenPurpose,
  payload: TokenPayload,
): string {
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, nonce, {
    authTagLength: TAG_BYTES,
  });
  cipher.setAAD(Buffer.from(purpose, 'utf8'));
  const plaintext = JSON.stringify(
    payload.expiresAt === undefined
      ? { email: payload.email }
      : { email: payload.email, expiresAt: payload.expiresAt },
  );
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([nonce, ciphertext, cipher.getAuthTag()]).toString(
    'base64url',
  );
}

export type OpenTokenResult =
  | { readonly ok: true; readonly payload: TokenPayload }
  | { readonly ok: false; readonly reason: 'invalid' | 'expired' };

/**
 * Opens a token sealed for `purpose`. Anything that isn't a well-formed, untampered token for
 * that purpose is `invalid`; a confirm token past its `expiresAt` is `expired`. Never throws,
 * and never says why a token was invalid (the reason could only help someone forging one).
 */
export function openToken(
  key: Buffer,
  purpose: TokenPurpose,
  token: unknown,
  now: number = Date.now(),
): OpenTokenResult {
  const invalid = { ok: false, reason: 'invalid' } as const;
  if (
    typeof token !== 'string' ||
    token.length > MAX_TOKEN_LENGTH ||
    !BASE64URL.test(token)
  ) {
    return invalid;
  }

  const sealed = Buffer.from(token, 'base64url');
  if (sealed.length <= NONCE_BYTES + TAG_BYTES) return invalid;

  let plaintext: string;
  try {
    const nonce = sealed.subarray(0, NONCE_BYTES);
    const tag = sealed.subarray(sealed.length - TAG_BYTES);
    const ciphertext = sealed.subarray(NONCE_BYTES, sealed.length - TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, key, nonce, {
      authTagLength: TAG_BYTES,
    });
    decipher.setAAD(Buffer.from(purpose, 'utf8'));
    decipher.setAuthTag(tag);
    plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return invalid;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext);
  } catch {
    return invalid;
  }
  if (parsed === null || typeof parsed !== 'object') return invalid;

  const { email, expiresAt } = parsed as Record<string, unknown>;
  if (typeof email !== 'string' || email.length === 0) return invalid;
  if (expiresAt !== undefined) {
    if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) {
      return invalid;
    }
    if (now > expiresAt) return { ok: false, reason: 'expired' };
    return { ok: true, payload: { email, expiresAt } };
  }

  // Only unsubscribe tokens may omit the expiry; a confirm token without one is forged or
  // from a bug, so refuse it.
  if (purpose === 'confirm') return invalid;
  return { ok: true, payload: { email } };
}

/** A confirm token for `email`, valid for {@link CONFIRM_TOKEN_TTL_MS}. */
export function sealConfirmToken(
  key: Buffer,
  email: string,
  now: number = Date.now(),
): string {
  return sealToken(key, 'confirm', {
    email,
    expiresAt: now + CONFIRM_TOKEN_TTL_MS,
  });
}

/** An unsubscribe token for `email`. It never expires. */
export function sealUnsubscribeToken(key: Buffer, email: string): string {
  return sealToken(key, 'unsubscribe', { email });
}
