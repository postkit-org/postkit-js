import { linkPreviewDefinition } from '@postkit/core/components';
import type { ResolvedLinkPreview } from '@postkit/unfurl';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';

import { LinkPreview } from './link-preview.js';

afterEach(cleanup);

const article: ResolvedLinkPreview = {
  requestedUrl: 'https://www.example.com/article',
  url: 'https://www.example.com/article',
  title: 'An article',
  description: 'What it says.',
  siteName: 'Example',
  favicon: 'https://www.example.com/favicon.ico',
  images: [
    {
      src: 'https://cdn.example.com/a.png',
      alt: 'A',
      width: 1200,
      height: 630,
    },
    { src: 'https://cdn.example.com/b.png', alt: 'B' },
  ],
  audio: [],
  video: [],
  provider: { id: 'fixture' },
};

const parts = (container: Element, name: string) =>
  container.querySelectorAll(`[data-postkit-part="${name}"]`);

describe('headless LinkPreview', () => {
  it('carries its definition', () => {
    expect(LinkPreview.definition).toBe(linkPreviewDefinition);
  });

  it('renders a card with the first image and site details', () => {
    const { container } = render(
      <LinkPreview href={article.url} metadata={JSON.stringify(article)} />,
    );
    const root = container.querySelector('article');

    expect(root?.getAttribute('data-postkit-component')).toBe('LinkPreview');
    expect(root?.getAttribute('data-presentation')).toBe('card');
    expect(root?.getAttribute('data-postkit-presentation')).toBe('card');
    expect(root?.getAttribute('data-postkit-resolution')).toBe('provided');
    expect(root?.getAttribute('data-postkit-provider')).toBe('fixture');
    expect(parts(container, 'image')).toHaveLength(1);
    expect(parts(container, 'image')[0]?.getAttribute('width')).toBe('1200');
    expect(parts(container, 'favicon')[0]?.getAttribute('alt')).toBe('');
    expect(parts(container, 'siteName')[0]?.textContent).toBe('Example');
    expect(parts(container, 'title')[0]?.textContent).toBe('An article');
    expect(parts(container, 'domain')[0]?.textContent).toBe('example.com');
    expect(
      screen.getAllByRole('link', { name: 'Open An article' }),
    ).toHaveLength(1);
  });

  it('names the card link from its content, starting with the visible title (WCAG 2.5.3)', () => {
    const { container } = render(
      <LinkPreview href={article.url} metadata={article} images="none" />,
    );
    const anchor = parts(container, 'anchor')[0];
    const title = parts(container, 'title')[0]?.textContent ?? '';

    // No aria-label to drift from the visible text: the name is the content,
    // and the title leads it.
    expect(anchor?.hasAttribute('aria-label')).toBe(false);
    expect(anchor?.hasAttribute('aria-labelledby')).toBe(false);
    expect(anchor?.textContent?.startsWith(title)).toBe(true);
    expect(screen.getByRole('link', { name: /^An article\b/ })).toBe(anchor);
  });

  it('applies author overrides and hides images with images="none"', () => {
    const markup = renderToStaticMarkup(
      <LinkPreview
        href="https://example.com/x"
        title="Mine"
        siteName="Site"
        image="https://cdn.example.com/own.png"
        images="none"
      />,
    );

    expect(markup).toContain('<p data-postkit-part="title">Mine</p>');
    expect(markup).toContain('Site</span>');
    expect(markup).not.toContain('own.png');
    expect(markup).toContain('data-postkit-resolution="idle"');
  });

  it('shows every image in a carousel with images="carousel"', () => {
    // Server markup: the carousel's machine needs browser layout to start.
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(
      <LinkPreview href={article.url} metadata={article} images="carousel" />,
    );
    const carousel = parts(container, 'carousel')[0];

    expect(
      carousel?.querySelector('[data-postkit-component="Carousel"]'),
    ).not.toBeNull();
    expect(carousel?.querySelectorAll('img')).toHaveLength(2);
  });

  it('renders inline as a link', () => {
    expect(
      renderToStaticMarkup(
        <LinkPreview href="https://example.com/x" presentation="inline">
          Read this
        </LinkPreview>,
      ),
    ).toBe(
      '<span data-postkit-resolution="idle" data-postkit-component="LinkPreview" data-postkit-part="root" data-size="md" data-variant="subtle" data-presentation="inline">' +
        '<a href="https://example.com/x" data-postkit-part="anchor">Read this</a></span>',
    );
  });

  it('plays resolved media natively', () => {
    const { container } = render(
      <LinkPreview
        href={article.url}
        presentation="auto"
        metadata={{
          ...article,
          video: [
            { src: 'https://cdn.example.com/v.mp4', width: 640, height: 360 },
          ],
        }}
      />,
    );
    const player = parts(container, 'mediaPlayer')[0];

    expect(
      container
        .querySelector('article')
        ?.getAttribute('data-postkit-presentation'),
    ).toBe('media');
    expect(player?.querySelector('video')?.getAttribute('poster')).toBe(
      'https://cdn.example.com/a.png',
    );

    const audio = render(
      <LinkPreview
        href={article.url}
        presentation="media"
        media="audio"
        metadata={{
          ...article,
          audio: [{ src: 'https://cdn.example.com/a.mp3' }],
        }}
      />,
    );
    expect(audio.container.querySelector('audio')?.getAttribute('src')).toBe(
      'https://cdn.example.com/a.mp3',
    );
  });

  it('waits for consent before rendering an embed', async () => {
    const metadata: ResolvedLinkPreview = {
      ...article,
      images: [],
      embed: {
        type: 'video',
        src: 'https://player.example.org/e/1',
        thumbnail: { src: 'https://cdn.example.com/thumb.png' },
      },
    };
    const { container } = render(
      <LinkPreview
        href={article.url}
        presentation="embed"
        metadata={metadata}
      />,
    );
    const consent = parts(container, 'consent')[0] as HTMLElement;

    expect(container.querySelector('iframe')).toBeNull();
    expect(container.innerHTML).not.toContain('player.example.org');
    expect(consent.style.getPropertyValue('--postkit-consent-image')).toBe(
      'url("https://cdn.example.com/thumb.png")',
    );
    expect(container.querySelectorAll('button')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Load embed' }));

    await waitFor(() =>
      expect(container.querySelector('iframe')).not.toBeNull(),
    );
    const frame = container.querySelector('iframe');
    expect(frame?.getAttribute('src')).toBe('https://player.example.org/e/1');
    expect(frame?.getAttribute('title')).toBe('An article');
    expect(frame?.getAttribute('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-presentation allow-popups',
    );
    expect(parts(container, 'consent')).toHaveLength(0);
  });

  it('renders the embed at once with activation="immediate"', () => {
    const markup = renderToStaticMarkup(
      <LinkPreview
        href={article.url}
        presentation="embed"
        activation="immediate"
        iframeTitle="Player"
        metadata={{
          ...article,
          embed: { type: 'rich', src: 'https://player.example.org/e/2' },
        }}
      />,
    );

    expect(markup).toContain('src="https://player.example.org/e/2"');
    expect(markup).toContain('title="Player"');
    expect(markup).not.toContain('<button');
  });

  it('delegates a resolved social post to SocialPost when auto', () => {
    const { container } = render(
      <LinkPreview
        href="https://bsky.app/p/1"
        presentation="auto"
        unstyled
        metadata={{
          ...article,
          social: {
            service: 'bluesky',
            url: 'https://bsky.app/p/1',
            text: 'Post',
            images: [],
            video: [],
          },
        }}
      />,
    );
    const root = container.querySelector('article');

    expect(root?.getAttribute('data-postkit-component')).toBe('SocialPost');
    expect(root?.getAttribute('data-presentation')).toBe('card');
    expect(root?.hasAttribute('data-postkit-unstyled')).toBe(true);
  });

  it('resolves through resolveLink when no metadata is supplied', async () => {
    const resolveLink = vi.fn(async () => article);
    const { container, unmount } = render(
      <LinkPreview
        href={article.url}
        provider="fixture"
        resolveLink={resolveLink}
      />,
    );

    expect(
      container
        .querySelector('article')
        ?.getAttribute('data-postkit-resolution'),
    ).toBe('loading');
    await waitFor(() =>
      expect(
        container.querySelector('[data-postkit-part="title"]')?.textContent,
      ).toBe('An article'),
    );
    expect(
      container
        .querySelector('article')
        ?.getAttribute('data-postkit-resolution'),
    ).toBe('resolved');
    const [, options] = resolveLink.mock.calls[0] as unknown as [
      string,
      { provider: string; signal: AbortSignal },
    ];
    expect(options.provider).toBe('fixture');
    unmount();
    expect(options.signal.aborted).toBe(true);
  });

  it('rejects metadata that is not JSON', () => {
    expect(() =>
      renderToStaticMarkup(
        <LinkPreview href="https://example.com" metadata="nope" />,
      ),
    ).toThrow('Postkit LinkPreview metadata must contain valid JSON.');
  });
});
