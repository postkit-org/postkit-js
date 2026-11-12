import { socialPostDefinition } from '@postkit/core/components';
import {
  createPostkitSocialPostSnapshot,
  type ResolvedLinkPreview,
} from '@postkit/unfurl';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';

import { SocialPost } from './social-post.js';

afterEach(cleanup);

const post: ResolvedLinkPreview = {
  requestedUrl: 'https://bsky.app/profile/ada/post/1',
  url: 'https://bsky.app/profile/ada/post/1',
  siteName: 'Bluesky',
  images: [],
  audio: [],
  video: [],
  provider: { id: 'fixture' },
  social: {
    service: 'bluesky',
    url: 'https://bsky.app/profile/ada/post/1',
    author: {
      name: 'Ada',
      handle: '@ada',
      avatar: 'https://cdn.example.com/ada.png',
    },
    text: 'Hello from the post.',
    publishedAt: '2026-01-02T03:04:05Z',
    images: [{ src: 'https://cdn.example.com/p.png', alt: 'Photo' }],
    video: [],
    metrics: { replies: 1, likes: 3 },
    quotedPost: {
      service: 'x',
      url: 'https://x.com/q/1',
      text: 'Quoted text.',
      images: [],
      video: [],
    },
  },
};

const embedPreview: ResolvedLinkPreview = {
  requestedUrl: 'https://social.example.com/p/1',
  url: 'https://social.example.com/p/1',
  siteName: 'Example',
  images: [],
  audio: [],
  video: [],
  embed: {
    type: 'rich',
    src: 'https://embed.example.com/p/1',
    aspectRatio: 0.8,
  },
  provider: { id: 'fixture' },
};

const parts = (container: Element, name: string) =>
  container.querySelectorAll(`[data-postkit-part="${name}"]`);

describe('headless SocialPost', () => {
  it('carries its definition', () => {
    expect(SocialPost.definition).toBe(socialPostDefinition);
  });

  it('renders a card with the author, post, media, quote and metrics', () => {
    const { container } = render(
      <SocialPost href={post.url} metadata={post} showMetrics="true" />,
    );
    const root = container.querySelector('article');

    expect(root?.getAttribute('data-postkit-component')).toBe('SocialPost');
    expect(root?.getAttribute('data-presentation')).toBe('auto');
    expect(root?.getAttribute('data-branding')).toBe('subtle');
    expect(root?.getAttribute('data-postkit-service')).toBe('bluesky');
    expect(root?.getAttribute('data-postkit-resolution')).toBe('provided');
    expect(root?.getAttribute('data-postkit-resolution-mode')).toBe(
      'snapshot-fallback',
    );
    expect(root?.getAttribute('data-postkit-provider')).toBe('fixture');
    expect(parts(container, 'serviceBadge')[0]?.textContent).toBe('BBluesky');
    expect(parts(container, 'authorName')[0]?.textContent).toBe('Ada');
    expect(parts(container, 'handle')[0]?.textContent).toBe('@ada');
    expect(parts(container, 'timestamp')[0]?.getAttribute('dateTime')).toBe(
      '2026-01-02T03:04:05Z',
    );
    expect(parts(container, 'content')[0]?.getAttribute('cite')).toBe(post.url);
    expect(parts(container, 'image')[0]?.getAttribute('alt')).toBe('Photo');
    expect(parts(container, 'quoteAuthor')[0]?.textContent).toBe('X');
    expect(parts(container, 'quoteContent')[0]?.textContent).toBe(
      'Quoted text.',
    );
    expect(
      [...parts(container, 'metric')].map((metric) => metric.textContent),
    ).toEqual(['1 replies', '3 likes']);
    expect(
      screen.getByRole('link', { name: 'View original' }).getAttribute('href'),
    ).toBe(post.url);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('applies overrides and service labels it is given', () => {
    const markup = renderToStaticMarkup(
      <SocialPost
        href="https://example.com/p"
        service="commune"
        authorName="Grace"
        text="Override"
        socialServices={{ commune: { label: 'Commune', icon: '◎' } }}
      />,
    );

    expect(markup).toContain('data-postkit-service="commune"');
    expect(markup).toContain(
      '<span data-postkit-part="serviceIcon">◎</span>Commune',
    );
    expect(markup).toContain('<p data-postkit-part="authorName">Grace</p>');
    expect(markup).toContain('Override</blockquote>');
    expect(markup).toContain('data-postkit-resolution="idle"');
  });

  it('shows snapshot provenance unless hidden', () => {
    const snapshot = createPostkitSocialPostSnapshot(post, {
      capturedAt: '2026-02-01T00:00:00Z',
      resolvedAt: '2026-01-31T00:00:00Z',
      cacheResult: 'hit',
      cacheStrategy: 'refresh',
    });
    const { container, rerender } = render(
      <SocialPost href={post.url} metadata={JSON.stringify(snapshot)} />,
    );
    const info = parts(container, 'snapshotInfo')[0];

    expect(
      container
        .querySelector('article')
        ?.getAttribute('data-postkit-resolution'),
    ).toBe('snapshot');
    expect(info?.getAttribute('data-postkit-snapshot-captured-at')).toBe(
      '2026-02-01T00:00:00Z',
    );
    expect(parts(container, 'snapshotLabel')).toHaveLength(2);
    expect(info?.textContent).toContain('via fixture');
    expect(info?.textContent).toContain('cache hit · refresh strategy');

    rerender(
      <SocialPost href={post.url} metadata={snapshot} snapshotInfo="hidden" />,
    );
    expect(parts(container, 'snapshotInfo')).toHaveLength(0);
  });

  it('puts a provider embed behind one consent button', async () => {
    const { container } = render(
      <SocialPost href={embedPreview.url} metadata={embedPreview} />,
    );

    expect(container.querySelector('iframe')).toBeNull();
    expect(container.innerHTML).not.toContain('embed.example.com');
    expect(
      (parts(container, 'embedFrame')[0] as HTMLElement).style.aspectRatio,
    ).toBe('0.8');
    expect(
      screen.getByText('Load interactive content from Example?'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Load post' }));

    const frame = await waitFor(() => {
      const element = container.querySelector('iframe');
      expect(element).not.toBeNull();
      return element as HTMLIFrameElement;
    });
    expect(frame.getAttribute('src')).toBe(embedPreview.embed?.src);
    expect(frame.getAttribute('title')).toBe('Post from Example');
    expect(frame.getAttribute('data-postkit-part')).toBe('embed');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('resolves live through resolveLink and ignores supplied metadata', async () => {
    const resolveLink = vi.fn(async () => post);
    const { container } = render(
      <SocialPost
        href={post.url}
        provider="bluesky"
        resolution="live"
        metadata={embedPreview}
        resolveLink={resolveLink}
      />,
    );

    await waitFor(() =>
      expect(
        container
          .querySelector('article')
          ?.getAttribute('data-postkit-resolution'),
      ).toBe('resolved'),
    );
    expect(resolveLink).toHaveBeenCalledWith(post.url, {
      provider: 'bluesky',
      signal: expect.any(AbortSignal),
    });
    expect(screen.getByText('Hello from the post.')).toBeTruthy();
  });

  it('does not resolve a snapshot-only post, and reports resolver errors', async () => {
    const resolveLink = vi.fn(async () => {
      throw new Error('offline');
    });
    const { container, rerender } = render(
      <SocialPost
        href={post.url}
        resolution="snapshot"
        resolveLink={resolveLink}
      />,
    );
    await act(async () => undefined);
    expect(resolveLink).not.toHaveBeenCalled();

    rerender(<SocialPost href={post.url} resolveLink={resolveLink} />);
    await waitFor(() =>
      expect(
        container
          .querySelector('article')
          ?.getAttribute('data-postkit-resolution'),
      ).toBe('error'),
    );
  });

  it('rejects metadata that is not JSON', () => {
    expect(() =>
      renderToStaticMarkup(<SocialPost href="https://x.com" metadata="{" />),
    ).toThrow('Postkit SocialPost metadata must contain valid metadata');
  });
});
