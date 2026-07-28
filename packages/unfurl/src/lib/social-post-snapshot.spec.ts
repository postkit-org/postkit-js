import {
  createPostkitSocialPostSnapshot,
  isPostkitSocialPostSnapshot,
  POSTKIT_SOCIAL_POST_SNAPSHOT_SCHEMA_VERSION,
} from './social-post-snapshot.js';
import type { ResolvedLinkPreview } from './types.js';

function metadata(): ResolvedLinkPreview {
  return {
    requestedUrl: 'https://social.example/post/1',
    url: 'https://social.example/post/1',
    images: [],
    audio: [],
    video: [],
    social: {
      service: 'example',
      url: 'https://social.example/post/1',
      text: 'A captured post.',
      images: [],
      video: [],
    },
    provider: { id: 'opengraphs' },
    cache: {
      fetchedAt: '2026-07-26T18:29:42.000Z',
      strategy: 'refresh',
      result: 'hit',
    },
  };
}

describe('social post snapshots', () => {
  it('records capture provenance separately from resolver cache provenance', () => {
    const snapshot = createPostkitSocialPostSnapshot(metadata(), {
      capturedAt: '2026-07-26T18:31:00.000Z',
    });

    expect(snapshot).toEqual({
      schemaVersion: POSTKIT_SOCIAL_POST_SNAPSHOT_SCHEMA_VERSION,
      capturedAt: '2026-07-26T18:31:00.000Z',
      resolvedAt: '2026-07-26T18:29:42.000Z',
      cacheStrategy: 'refresh',
      cacheResult: 'hit',
      resolver: { id: 'opengraphs' },
      metadata: metadata(),
    });
    expect(isPostkitSocialPostSnapshot(snapshot)).toBe(true);
  });

  it('rejects malformed or unknown snapshot envelopes', () => {
    expect(
      isPostkitSocialPostSnapshot({
        ...createPostkitSocialPostSnapshot(metadata(), {
          capturedAt: '2026-07-26T18:31:00.000Z',
        }),
        cacheResult: 'unknown',
      }),
    ).toBe(false);
    expect(
      isPostkitSocialPostSnapshot({
        schemaVersion: 2,
        capturedAt: '2026-07-26T18:31:00.000Z',
        resolver: { id: 'opengraphs' },
        metadata: metadata(),
      }),
    ).toBe(false);
    expect(() =>
      createPostkitSocialPostSnapshot(metadata(), {
        capturedAt: 'not-a-date',
      }),
    ).toThrow('capturedAt');
  });
});
