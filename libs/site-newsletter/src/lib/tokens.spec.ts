import { randomBytes } from 'node:crypto';

import {
  CONFIRM_TOKEN_TTL_MS,
  openToken,
  parseSubscribeSecret,
  sealConfirmToken,
  sealToken,
  sealUnsubscribeToken,
} from './tokens';

const key = randomBytes(32);
const EMAIL = 'reader@example.com';
const NOW = Date.UTC(2026, 10, 10, 12, 0, 0);

describe('parseSubscribeSecret', () => {
  it('accepts exactly 32 bytes of base64', () => {
    const secret = randomBytes(32);
    expect(parseSubscribeSecret(secret.toString('base64'))).toEqual(secret);
    expect(parseSubscribeSecret(secret.toString('base64url'))).toEqual(secret);
  });

  it('refuses missing, short, long and malformed secrets', () => {
    expect(parseSubscribeSecret(undefined)).toBeNull();
    expect(parseSubscribeSecret('')).toBeNull();
    expect(parseSubscribeSecret(randomBytes(16).toString('base64'))).toBeNull();
    expect(parseSubscribeSecret(randomBytes(33).toString('base64'))).toBeNull();
    expect(parseSubscribeSecret('not a base64 secret!')).toBeNull();
  });
});

describe('sealed tokens', () => {
  it('round-trips a confirm token inside its 7 days', () => {
    const token = sealConfirmToken(key, EMAIL, NOW);
    expect(openToken(key, 'confirm', token, NOW)).toEqual({
      ok: true,
      payload: { email: EMAIL, expiresAt: NOW + CONFIRM_TOKEN_TTL_MS },
    });
    expect(
      openToken(key, 'confirm', token, NOW + CONFIRM_TOKEN_TTL_MS).ok,
    ).toBe(true);
  });

  it('expires a confirm token 7 days and 1 second after it was made', () => {
    const token = sealConfirmToken(key, EMAIL, NOW);
    expect(
      openToken(key, 'confirm', token, NOW + CONFIRM_TOKEN_TTL_MS + 1000),
    ).toEqual({ ok: false, reason: 'expired' });
  });

  it('never expires an unsubscribe token', () => {
    const token = sealUnsubscribeToken(key, EMAIL);
    const inTenYears = NOW + 10 * 365 * 24 * 60 * 60 * 1000;
    expect(openToken(key, 'unsubscribe', token, inTenYears)).toEqual({
      ok: true,
      payload: { email: EMAIL },
    });
  });

  it('is URL-safe and never repeats', () => {
    const first = sealUnsubscribeToken(key, EMAIL);
    const second = sealUnsubscribeToken(key, EMAIL);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(first).not.toBe(second);
  });

  it('binds the purpose: a confirm token never unsubscribes, and the reverse', () => {
    const confirm = sealConfirmToken(key, EMAIL, NOW);
    const unsubscribe = sealUnsubscribeToken(key, EMAIL);
    expect(openToken(key, 'unsubscribe', confirm, NOW).ok).toBe(false);
    expect(openToken(key, 'confirm', unsubscribe, NOW).ok).toBe(false);
  });

  it('rejects a tampered token', () => {
    const token = sealConfirmToken(key, EMAIL, NOW);
    const bytes = Buffer.from(token, 'base64url');
    for (const index of [0, 12, bytes.length - 1]) {
      const tampered = Buffer.from(bytes);
      tampered[index] ^= 0x01;
      expect(
        openToken(key, 'confirm', tampered.toString('base64url'), NOW),
      ).toEqual({ ok: false, reason: 'invalid' });
    }
  });

  it('rejects garbage without throwing', () => {
    for (const garbage of [
      undefined,
      null,
      42,
      '',
      'garbage',
      'not+base64/url=',
      'A'.repeat(2000),
      Buffer.alloc(40).toString('base64url'),
    ]) {
      expect(openToken(key, 'confirm', garbage, NOW).ok).toBe(false);
    }
  });

  it('refuses a confirm token sealed without an expiry', () => {
    const forged = sealToken(key, 'confirm', { email: EMAIL });
    expect(openToken(key, 'confirm', forged, NOW).ok).toBe(false);
  });

  it('decodes to nothing readable without the key', () => {
    const tokens = [
      sealConfirmToken(key, EMAIL, NOW),
      sealUnsubscribeToken(key, EMAIL),
    ];
    for (const token of tokens) {
      const raw = Buffer.from(token, 'base64url');
      for (const encoding of ['utf8', 'latin1', 'ascii'] as const) {
        const decoded = raw.toString(encoding).toLowerCase();
        expect(decoded).not.toContain('reader');
        expect(decoded).not.toContain('example');
        expect(decoded).not.toContain('email');
      }
      expect(token.toLowerCase()).not.toContain('reader');
      // Another key can't open it either.
      expect(openToken(randomBytes(32), 'confirm', token, NOW).ok).toBe(false);
      expect(openToken(randomBytes(32), 'unsubscribe', token, NOW).ok).toBe(
        false,
      );
    }
  });
});
