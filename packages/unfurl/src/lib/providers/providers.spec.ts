import {
  createEmbedlyResolver,
  createIframelyResolver,
  createMicrolinkResolver,
  createOpenGraphsResolver,
  type OpenGraphsResponse,
} from '../../index.js';
import type { PostkitFetch } from '../types.js';

function jsonFetch(
  body: unknown,
  inspect?: (request: URL, init: RequestInit | undefined) => void,
): PostkitFetch {
  return async (input, init) => {
    const request = new URL(
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    inspect?.(request, init);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

describe('hosted link resolvers', () => {
  it('uses OpenGraphs by its public normalized contract without requiring a key', async () => {
    const resolver = createOpenGraphsResolver({
      fetch: jsonFetch(
        {
          schemaVersion: 1,
          requestId: '1d6275d3-c72a-4215-ad9d-1a7b809a9bf5',
          resolver: {
            id: 'opengraphs',
            name: 'OpenGraphs',
            url: 'https://opengraphs.com/',
          },
          data: {
            canonicalUrl: 'https://example.com/canonical',
            title: 'A durable link preview',
            description: 'Resolved once and rendered anywhere.',
            siteName: 'Example',
            author: null,
            authorUrl: null,
            favicon: 'https://example.com/favicon.png',
            images: [
              {
                url: 'https://example.com/one.jpg',
                alt: null,
                type: 'image/jpeg',
                width: 1200,
                height: 630,
              },
              {
                url: 'https://example.com/two.jpg',
                alt: null,
                type: 'image/jpeg',
                width: null,
                height: null,
              },
            ],
            video: [
              {
                url: 'https://example.com/video.mp4',
                type: 'video/mp4',
                width: null,
                height: null,
                poster: null,
              },
            ],
            audio: [
              {
                url: 'https://example.com/audio.mp3',
                type: 'audio/mpeg',
                durationSeconds: 0,
              },
            ],
            embed: {
              type: 'video',
              src: 'https://player.example.com/video',
              rawHtml:
                '<iframe src="https://player.example.com/video"></iframe>',
              thumbnail: {
                url: 'https://example.com/embed-thumbnail.jpg',
                alt: 'Video thumbnail',
                type: 'image/jpeg',
                width: 640,
                height: 360,
              },
              width: 1280,
              height: 720,
              aspectRatio: null,
              title: null,
            },
            provider: {
              id: 'example',
              name: 'Example',
              url: 'https://example.com/',
            },
            social: {
              service: 'bluesky',
              url: 'https://bsky.app/profile/example/post/1',
              author: {
                name: 'Ada Example',
                handle: '@ada.example',
                url: 'https://bsky.app/profile/example',
                avatar: 'https://example.com/ada.jpg',
              },
              text: 'A social post.',
              publishedAt: '2026-07-26T12:00:00Z',
              images: [
                {
                  url: 'https://example.com/social.jpg',
                  alt: null,
                  type: 'image/jpeg',
                  width: null,
                  height: null,
                },
              ],
              video: [],
              metrics: {
                replies: 2,
                reposts: 4,
                likes: 0,
                shares: null,
              },
              quotedPost: {
                service: 'example',
                url: 'https://social.example/post/quoted',
                author: null,
                text: 'Quoted content.',
                publishedAt: null,
                images: [],
                video: [],
                metrics: null,
              },
            },
          },
          cache: {
            strategy: 'refresh',
            result: 'hit',
            fetchedAt: '2026-07-26T14:31:00Z',
            expiresAt: null,
            maxAgeSeconds: 0,
          },
          resolution: {
            kind: 'oembed',
            requestedMode: 'auto',
            requestedUrl: 'https://example.com/article',
            requester: 'GENERIC',
            upstreamError: {
              code: 'OEMBED_NOT_FOUND',
              statusCode: 404,
            },
          },
        } satisfies OpenGraphsResponse,
        (request) => {
          expect(request.origin + request.pathname).toBe(
            'https://unfurl.opengraphs.com/v1/resolve',
          );
          expect(request.searchParams.get('url')).toBe(
            'https://example.com/article',
          );
        },
      ),
    });

    const result = await resolver.resolve('https://example.com/article');

    expect(result.provider.id).toBe('opengraphs');
    expect(result.url).toBe('https://example.com/canonical');
    expect(result.images).toHaveLength(2);
    expect(result.video[0]).toMatchObject({
      src: 'https://example.com/video.mp4',
      type: 'video/mp4',
    });
    expect(result.embed).toMatchObject({
      src: 'https://player.example.com/video',
      aspectRatio: 1280 / 720,
      thumbnail: {
        src: 'https://example.com/embed-thumbnail.jpg',
        alt: 'Video thumbnail',
      },
    });
    expect(result.provider).toEqual({
      id: 'opengraphs',
      name: 'OpenGraphs',
      url: 'https://opengraphs.com/',
    });
    expect(result.sourceProvider).toEqual({
      id: 'example',
      name: 'Example',
      url: 'https://example.com/',
    });
    expect(result.cache).toEqual({
      strategy: 'refresh',
      result: 'hit',
      fetchedAt: '2026-07-26T14:31:00Z',
      expiresAt: undefined,
      maxAgeSeconds: 0,
    });
    expect(result.resolution).toEqual({
      kind: 'oembed',
      requestedMode: 'auto',
      requestedUrl: 'https://example.com/article',
      requester: 'GENERIC',
      upstreamError: {
        code: 'OEMBED_NOT_FOUND',
        statusCode: 404,
      },
    });
    expect(result.requestId).toBe('1d6275d3-c72a-4215-ad9d-1a7b809a9bf5');
    expect(result.audio[0]?.durationSeconds).toBe(0);
    expect(result.social).toMatchObject({
      service: 'bluesky',
      author: {
        name: 'Ada Example',
        handle: '@ada.example',
      },
      text: 'A social post.',
      metrics: {
        replies: 2,
        reposts: 4,
        likes: 0,
      },
    });
    expect(result.social?.images[0]?.src).toBe(
      'https://example.com/social.jpg',
    );
    expect(result.social?.quotedPost).toMatchObject({
      service: 'example',
      text: 'Quoted content.',
    });
  });

  it('rejects unknown OpenGraphs envelope versions and resolver identities', async () => {
    const unknownVersion = createOpenGraphsResolver({
      fetch: jsonFetch({ schemaVersion: 2, data: {} }),
    });
    const wrongResolver = createOpenGraphsResolver({
      fetch: jsonFetch({
        schemaVersion: 1,
        resolver: { id: 'other' },
        data: {},
      }),
    });
    const missingResolver = createOpenGraphsResolver({
      fetch: jsonFetch({ schemaVersion: 1, data: {} }),
    });

    await expect(
      unknownVersion.resolve('https://example.com/article'),
    ).rejects.toThrow('unsupported schema version 2');
    await expect(
      wrongResolver.resolve('https://example.com/article'),
    ).rejects.toThrow('unexpected resolver "other"');
    await expect(
      missingResolver.resolve('https://example.com/article'),
    ).rejects.toThrow('unexpected resolver "missing"');
  });

  it('normalizes Iframely metadata, media links, and a safe iframe source', async () => {
    const resolver = createIframelyResolver({
      apiKey: 'secret',
      fetch: jsonFetch(
        {
          url: 'https://vimeo.com/123',
          html: '<iframe src="https://player.vimeo.com/video/123"></iframe>',
          meta: {
            title: 'Input/Output',
            description: 'A short film.',
            author: 'Terri Timely',
            author_url: 'https://vimeo.com/terri',
            site: 'Vimeo',
            canonical: 'https://vimeo.com/123',
            medium: 'video',
          },
          links: {
            player: {
              href: 'https://player.vimeo.com/video/123',
              type: 'text/html',
              media: { 'aspect-ratio': 1.777778 },
            },
            thumbnail: {
              href: 'https://cdn.example.com/poster.jpg',
              type: 'image/jpeg',
              media: { width: 640, height: 360 },
            },
            icon: {
              href: 'https://vimeo.com/favicon.ico',
              type: 'image/x-icon',
            },
          },
        },
        (request) => {
          expect(request.searchParams.get('api_key')).toBe('secret');
          expect(request.searchParams.get('omit_script')).toBe('1');
          expect(request.searchParams.get('import')).toBe('0');
        },
      ),
    });

    const result = await resolver.resolve('https://vimeo.com/123');

    expect(result).toMatchObject({
      title: 'Input/Output',
      siteName: 'Vimeo',
      favicon: 'https://vimeo.com/favicon.ico',
      embed: {
        type: 'video',
        src: 'https://player.vimeo.com/video/123',
        aspectRatio: 1.777778,
      },
    });
    expect(result.images[0]).toMatchObject({
      src: 'https://cdn.example.com/poster.jpg',
      width: 640,
      height: 360,
    });
  });

  it('normalizes Embedly oEmbed responses', async () => {
    const resolver = createEmbedlyResolver({
      apiKey: 'embedly-key',
      fetch: jsonFetch({
        version: '1.0',
        type: 'video',
        title: 'An embedded video',
        provider_name: 'Video Site',
        provider_url: 'https://video.example.com',
        thumbnail_url: 'https://video.example.com/poster.jpg',
        thumbnail_width: 640,
        thumbnail_height: 360,
        width: 640,
        height: 360,
        html: '<iframe src="https://video.example.com/embed/1"></iframe>',
      }),
    });

    const result = await resolver.resolve('https://video.example.com/watch/1');

    expect(result.provider.id).toBe('embedly');
    expect(result.images[0]?.src).toBe('https://video.example.com/poster.jpg');
    expect(result.embed?.src).toBe('https://video.example.com/embed/1');
  });

  it('uses the Microlink Pro endpoint for authenticated metadata', async () => {
    const resolver = createMicrolinkResolver({
      apiKey: 'microlink-key',
      fetch: jsonFetch(
        {
          status: 'success',
          data: {
            title: 'Microlink result',
            description: 'Structured metadata.',
            publisher: 'Example',
            author: 'Ada',
            url: 'https://example.com/',
            image: {
              url: 'https://example.com/image.png',
              type: 'png',
              width: 1200,
              height: 630,
            },
            logo: {
              url: 'https://example.com/logo.png',
              type: 'png',
            },
            audio: {
              url: 'https://example.com/audio.mp3',
              type: 'audio/mpeg',
            },
          },
        },
        (request, init) => {
          expect(request.origin).toBe('https://pro.microlink.io');
          expect((init?.headers as Record<string, string>)['x-api-key']).toBe(
            'microlink-key',
          );
        },
      ),
    });

    const result = await resolver.resolve('https://example.com');

    expect(result.provider.id).toBe('microlink');
    expect(result.images[0]?.src).toBe('https://example.com/image.png');
    expect(result.audio[0]).toMatchObject({
      src: 'https://example.com/audio.mp3',
      type: 'audio/mpeg',
    });
  });
});
