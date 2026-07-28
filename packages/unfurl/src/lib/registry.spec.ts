import { createLinkResolverRegistry } from './registry.js';
import type { LinkResolver, ResolvedLinkPreview } from './types.js';

function result(provider: string): ResolvedLinkPreview {
  return {
    requestedUrl: 'https://example.com/',
    url: 'https://example.com/',
    title: provider,
    images: [],
    audio: [],
    video: [],
    provider: { id: provider },
  };
}

function resolver(
  id: string,
  implementation: () => Promise<ResolvedLinkPreview>,
): LinkResolver {
  return {
    id,
    resolve: implementation,
  };
}

describe('link resolver registry', () => {
  it('defaults to OpenGraphs and supports a per-request provider override', async () => {
    const registry = createLinkResolverRegistry({
      resolvers: [
        resolver('opengraphs', async () => result('opengraphs')),
        resolver('microlink', async () => result('microlink')),
      ],
    });

    await expect(
      registry.resolve('https://example.com'),
    ).resolves.toMatchObject({ provider: { id: 'opengraphs' } });
    await expect(
      registry.resolve('https://example.com', { provider: 'microlink' }),
    ).resolves.toMatchObject({ provider: { id: 'microlink' } });
  });

  it('only uses explicitly configured fallbacks', async () => {
    const registry = createLinkResolverRegistry({
      resolvers: [
        resolver('opengraphs', async () => {
          throw new Error('temporarily unavailable');
        }),
        resolver('iframely', async () => result('iframely')),
      ],
      fallbackProviders: ['iframely'],
    });

    await expect(
      registry.resolve('https://example.com'),
    ).resolves.toMatchObject({ provider: { id: 'iframely' } });
  });

  it('requires the configured default to be registered', () => {
    expect(() =>
      createLinkResolverRegistry({
        resolvers: [resolver('microlink', async () => result('microlink'))],
      }),
    ).toThrow('Default link resolver "opengraphs" is not registered');
  });
});
