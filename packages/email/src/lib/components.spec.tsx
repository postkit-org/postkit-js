import { render } from '@chakra-email/core';
import { describe, expect, it } from 'vitest';

import {
  Aside,
  Audio,
  Callout,
  CallToAction,
  Figure,
  Video,
} from './components.js';
import { createPostkitEmailMdxComponents } from './mdx-components.js';
import { PostkitEmailProvider } from './provider.js';

describe('@postkit/email components', () => {
  it('renders callouts with email-safe table layout and tone styles', async () => {
    const html = await render(
      <Callout title="Heads up" tone="warning">
        Review the publishing destination.
      </Callout>,
    );

    expect(html).toContain('data-postkit-component="Callout"');
    expect(html).toContain('data-postkit-tone="warning"');
    expect(html).toContain('role="presentation"');
    expect(html).toContain('Review the publishing destination.');
    expect(html).not.toContain('<script');
  });

  it('renders an untitled Aside through the shared expanded callout profile', async () => {
    const html = await render(
      <Aside tone="tip">A portable supporting note.</Aside>,
    );

    expect(html).toContain('data-postkit-component="Aside"');
    expect(html).toContain('aria-label="tip"');
    expect(html).not.toContain('font-weight:bold');
  });

  it('renders calls to action as bulletproof links without client behavior', async () => {
    const html = await render(
      <CallToAction
        title="Read the field guide"
        description="A practical introduction."
        primaryLabel="Read now"
        primaryHref="https://example.com/guide"
        secondaryLabel="Browse all guides"
        secondaryHref="https://example.com/guides"
      />,
    );

    expect(html).toContain('href="https://example.com/guide"');
    expect(html).toContain('href="https://example.com/guides"');
    expect(html).toContain('Read now');
    expect(html).not.toContain('onclick');
  });

  it('degrades audio and video into linked email fallbacks', async () => {
    const html = await render(
      <>
        <Audio
          src="https://media.example/episode.mp3"
          title="Episode one"
          caption="Thirty minutes"
        />
        <Video
          src="https://media.example/demo.mp4"
          poster="https://media.example/demo.jpg"
          title="Product demo"
        />
      </>,
    );

    expect(html).toContain('href="https://media.example/episode.mp3"');
    expect(html).toContain('href="https://media.example/demo.mp4"');
    expect(html).toContain('src="https://media.example/demo.jpg"');
    expect(html).not.toContain('<audio');
    expect(html).not.toContain('<video');
  });

  it('inherits Chakra Email URL sanitation for authored destinations', async () => {
    const html = await render(
      <Audio src="javascript:alert(1)" title="Unsafe destination" />,
    );

    expect(html).toContain('Unsafe destination');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('href=');
  });

  it('renders responsive-width figures with numeric legacy dimensions', async () => {
    const html = await render(
      <Figure
        src="https://images.example/chart.png"
        alt="Quarterly results"
        caption="Revenue increased."
        width="640px"
        height={320}
      />,
    );

    expect(html).toContain('width="640"');
    expect(html).toContain('height="320"');
    expect(html).toContain('alt="Quarterly results"');
  });

  it('accepts email theme overrides without depending on Chakra UI', async () => {
    const html = await render(
      <PostkitEmailProvider theme={{ colors: { brand: { 500: '#b91c1c' } } }}>
        <Audio src="https://media.example/episode.mp3" title="Themed episode" />
      </PostkitEmailProvider>,
    );

    expect(html).toContain('#b91c1c');
  });

  it('provides an explicit MDX component map for the supported subset', () => {
    expect(Object.keys(createPostkitEmailMdxComponents()).sort()).toEqual([
      'Aside',
      'Audio',
      'CallToAction',
      'Callout',
      'Figure',
      'Video',
    ]);
  });

  it('renders optional call-to-action content independently', async () => {
    const childrenOnly = await render(
      <CallToAction
        eyebrow="New"
        title="Child content"
        primaryLabel="Read"
        primaryHref="https://example.com/read"
      >
        Authored content.
      </CallToAction>,
    );
    const secondaryOnly = await render(
      <CallToAction
        title="Secondary action"
        secondaryLabel="Browse"
        secondaryHref="https://example.com/browse"
      />,
    );
    const minimal = await render(<CallToAction title="No actions" />);

    expect(childrenOnly).toContain('New');
    expect(childrenOnly).toContain('Authored content.');
    expect(childrenOnly).toContain('https://example.com/read');
    expect(secondaryOnly).toContain('https://example.com/browse');
    expect(secondaryOnly).not.toContain('<p');
    expect(minimal).not.toContain('<a');
  });

  it('renders linked and minimal figure variants', async () => {
    const linked = await render(
      <Figure
        src="https://images.example/linked.png"
        alt="Linked"
        href="https://example.com/chart"
        credit="Example Studio"
        creditHref="https://example.com/studio"
      />,
    );
    const plainCredit = await render(
      <Figure
        src="https://images.example/plain.png"
        alt="Plain"
        credit="Example Studio"
      />,
    );

    expect(linked).toContain('href="https://example.com/chart"');
    expect(linked).toContain('href="https://example.com/studio"');
    expect(linked).toContain('width="100%"');
    expect(linked).not.toContain('Revenue increased.');
    expect(plainCredit).toContain('Example Studio');
    expect(plainCredit).not.toContain('href="https://example.com/studio"');
  });

  it('renders media without optional captions or posters', async () => {
    const html = await render(
      <>
        <Audio src="https://media.example/audio.mp3" title="Audio only" />
        <Video src="https://media.example/video.mp4" title="Video only" />
      </>,
    );

    expect(html).toContain('Audio only');
    expect(html).toContain('Video only');
    expect(html).not.toContain('<img');
  });
});
