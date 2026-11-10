import { createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('allows the limit, then refuses until the window ends', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect([1, 2, 3, 4].map(() => limiter.hit('a', 0))).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(limiter.hit('b', 0)).toBe(true);
    expect(limiter.hit('a', 999)).toBe(false);
    expect(limiter.hit('a', 1000)).toBe(true);
  });

  it('stays bounded, sweeping expired keys first', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10, maxKeys: 2 });
    limiter.hit('a', 0);
    limiter.hit('b', 0);
    limiter.hit('c', 20); // a and b have expired and are swept
    expect(limiter.hit('c', 20)).toBe(false);
    limiter.hit('d', 20);
    limiter.hit('e', 20); // full of live keys: the oldest (c) goes
    expect(limiter.hit('c', 20)).toBe(true);
  });
});
