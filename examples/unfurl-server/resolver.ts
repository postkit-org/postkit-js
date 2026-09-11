import {
  createCallbackResolver,
  createLinkResolverRegistry,
  type ResolvedLinkPreview,
} from '@postkit/unfurl';

const fixtureResolver = createCallbackResolver(
  'example',
  async (url): Promise<ResolvedLinkPreview> => ({
    requestedUrl: url,
    url,
    title: 'Portable publishing',
    description: 'A normalized response owned by the server boundary.',
    siteName: 'PostKit example',
    images: [],
    audio: [],
    video: [],
    provider: { id: 'example', name: 'Example resolver' },
  }),
);

export const linkResolver = createLinkResolverRegistry({
  resolvers: [fixtureResolver],
  defaultProvider: 'example',
});
