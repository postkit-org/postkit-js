import {
  createCallbackResolver,
  createLinkResolverRegistry,
} from '@postkit/unfurl';

const resolver = createCallbackResolver('example', async (url) => ({
  requestedUrl: url,
  url,
  title: 'Portable publishing',
  description: 'A normalized response owned by the server boundary.',
  siteName: 'PostKit example',
  images: [],
  audio: [],
  video: [],
  provider: { id: 'example', name: 'Example resolver' },
}));
const registry = createLinkResolverRegistry({
  resolvers: [resolver],
  defaultProvider: 'example',
});
const result = await registry.resolve('https://example.com/article');

if (
  result.title !== 'Portable publishing' ||
  result.url !== 'https://example.com/article'
) {
  throw new Error('The unfurl example returned an unexpected result.');
}

process.stdout.write('PostKit unfurl example verified.\n');
