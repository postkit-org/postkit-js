import { createHash } from 'node:crypto';

/**
 * Fixed-window request limits, kept in memory.
 *
 * NOT GLOBAL ON SERVERLESS: each Vercel function instance has its own counters, and a cold
 * start resets them, so a determined sender spread across instances gets more than the limit.
 * That's acceptable for a double opt-in list (the worst case is a few extra confirm emails to
 * one address); if it ever isn't, move the counters to a shared store or Vercel's firewall
 * rate limiting (04 §1, "Abuse limits").
 *
 * Keys are hashed before they're stored, so the process never holds a list of addresses or
 * IPs in the clear.
 */
export interface RateLimiter {
  /** Counts a request for `key`; `false` once the window's limit is spent. */
  hit(key: string, now?: number): boolean;
  /** Forgets every counter (tests). */
  reset(): void;
}

export interface RateLimitOptions {
  readonly limit: number;
  readonly windowMs: number;
  /** Past this many tracked keys, expired windows are swept; the oldest go first if needed. */
  readonly maxKeys?: number;
}

interface Window {
  count: number;
  resetAt: number;
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('base64url');
}

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: RateLimitOptions): RateLimiter {
  const windows = new Map<string, Window>();

  function sweep(now: number): void {
    for (const [key, window] of windows) {
      if (window.resetAt <= now) windows.delete(key);
    }
    // Still full: drop the oldest entries (Map keeps insertion order).
    for (const key of windows.keys()) {
      if (windows.size < maxKeys) break;
      windows.delete(key);
    }
  }

  return {
    hit(key, now = Date.now()) {
      const hashed = hashKey(key);
      const current = windows.get(hashed);
      if (!current || current.resetAt <= now) {
        if (!current && windows.size >= maxKeys) sweep(now);
        windows.delete(hashed);
        windows.set(hashed, { count: 1, resetAt: now + windowMs });
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    },
    reset() {
      windows.clear();
    },
  };
}

const HOUR = 60 * 60 * 1000;

/** 3 subscribe requests per address per hour (04 §1). */
export const ADDRESS_LIMIT = { limit: 3, windowMs: HOUR } as const;

/** Subscribe requests per IP per hour: room for a shared office or campus NAT. */
export const IP_LIMIT = { limit: 20, windowMs: HOUR } as const;
