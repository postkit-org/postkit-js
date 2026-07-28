import { createCallbackResolver } from './callback.js';
import type { ResolvedLinkPreview } from './types.js';

describe('callback resolver', () => {
  it('adapts a custom callback and forwards resolution options', async () => {
    const result: ResolvedLinkPreview = {
      requestedUrl: 'https://example.com/article',
      url: 'https://example.com/article',
      title: 'Custom result',
      images: [],
      audio: [],
      video: [],
      provider: { id: 'site-callback' },
    };
    const callback = vi.fn(async () => result);
    const resolver = createCallbackResolver('site-callback', callback);

    await expect(
      resolver.resolve('https://example.com/article', {
        provider: 'site-callback',
        maxWidth: 960,
      }),
    ).resolves.toBe(result);
    expect(callback).toHaveBeenCalledWith('https://example.com/article', {
      provider: 'site-callback',
      maxWidth: 960,
    });
    expect(resolver.id).toBe('site-callback');
  });

  it('requires an id', () => {
    expect(() =>
      createCallbackResolver('', async () => {
        throw new Error('unreachable');
      }),
    ).toThrow('requires an id');
  });
});
