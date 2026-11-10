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
import { postkitEmailTheme, postkitEmailTones } from './theme.js';

/** `green.50`, `gray.200`, `brand.500`: a palette token that never resolved. */
const tokenLike = /\b[a-z]+\.\d{2,3}\b/;

/** Every inline `style` declaration and legacy colour attribute in the HTML. */
function cssDeclarations(html: string): string[] {
  const declarations: string[] = [];
  for (const [, style] of html.matchAll(/style="([^"]*)"/g)) {
    declarations.push(
      ...style
        .split(';')
        .map((declaration) => declaration.trim())
        .filter(Boolean),
    );
  }
  for (const [attribute] of html.matchAll(/\b(?:bgcolor|color)="[^"]*"/g)) {
    declarations.push(attribute);
  }
  return declarations;
}

function everyComponent(tone: (typeof postkitEmailTones)[number]) {
  return (
    <>
      <Callout title="Titled" tone={tone}>
        Callout body.
      </Callout>
      <Aside tone={tone}>Aside body.</Aside>
      <CallToAction
        eyebrow="New"
        title="Read the guide"
        description="A practical introduction."
        primaryLabel="Read now"
        primaryHref="https://example.com/guide"
        secondaryLabel="Browse"
        secondaryHref="https://example.com/guides"
      />
      <Figure
        src="https://images.example/chart.png"
        alt="Chart"
        caption="Caption."
        credit="Studio"
        creditHref="https://example.com/studio"
      />
      <Audio
        src="https://media.example/episode.mp3"
        title="Episode"
        caption="Thirty minutes"
      />
      <Video
        src="https://media.example/demo.mp4"
        poster="https://media.example/demo.jpg"
        title="Demo"
        caption="Two minutes"
      />
    </>
  );
}

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

  it.each(postkitEmailTones)(
    'resolves every colour to a literal value for the %s tone',
    async (tone) => {
      const htmls = [
        await render(everyComponent(tone)),
        await render(
          <PostkitEmailProvider>{everyComponent(tone)}</PostkitEmailProvider>,
        ),
      ];

      for (const html of htmls) {
        const declarations = cssDeclarations(html);
        expect(declarations.length).toBeGreaterThan(0);
        expect(declarations.filter((value) => tokenLike.test(value))).toEqual(
          [],
        );
        expect(html).not.toContain('var(');
      }
    },
  );

  it('applies the light Postkit email theme by default', async () => {
    const html = await render(
      <PostkitEmailProvider>
        <Callout title="Keep the content" tone="tip">
          Tip body.
        </Callout>
      </PostkitEmailProvider>,
    );

    expect(html).toContain(
      `background-color:${postkitEmailTheme.colors.tint.tip}`,
    );
    expect(html).toContain(
      `border-left:4px solid ${postkitEmailTheme.colors.tone.tip}`,
    );
  });

  it.each(postkitEmailTones)(
    'draws the %s Callout border in its tone, not its text colour',
    async (tone) => {
      const html = await render(<Callout tone={tone}>Body.</Callout>);
      const style = /<table[^>]*style="([^"]*)"/.exec(html)?.[1] ?? '';

      expect(style).toContain(
        `border-left:4px solid ${postkitEmailTheme.colors.tone[tone]}`,
      );
      expect(style).not.toContain('border-color');
      expect(style).toContain(`color:${postkitEmailTheme.colors.fg.DEFAULT}`);
    },
  );

  it('draws neutral card borders in their border colour', async () => {
    const html = await render(
      <>
        <CallToAction title="Card" />
        <Audio src="https://media.example/a.mp3" title="Audio" />
        <Video src="https://media.example/v.mp4" title="Video" />
      </>,
    );

    expect(html.match(/border:1px solid #E2E8F0/g)).toHaveLength(3);
    expect(html).not.toMatch(/border:1px solid(;|")/);
  });

  it('lets a host theme override tone colours', async () => {
    const html = await render(
      <PostkitEmailProvider
        theme={{
          colors: {
            tone: { warning: '#a15c00' },
            tint: { warning: '#f4ebe0' },
            fg: '#1d1d1f',
          },
        }}
      >
        <Callout tone="warning">Host tones.</Callout>
        <Callout tone="note">Package tones.</Callout>
      </PostkitEmailProvider>,
    );

    expect(html).toContain('border-left:4px solid #a15c00');
    expect(html).toContain('background-color:#f4ebe0');
    expect(html).toContain('color:#1d1d1f');
    expect(html).toContain(
      `border-left:4px solid ${postkitEmailTheme.colors.tone.note}`,
    );
  });

  it('provides an explicit MDX component map for the supported subset', () => {
    expect(Object.keys(createPostkitEmailMdxComponents()).sort()).toEqual([
      'Aside',
      'Audio',
      'CallToAction',
      'Callout',
      'Figure',
      'KeyTakeaway',
      'LinkPreview',
      'ProductCard',
      'PullQuote',
      'Stat',
      'Steps',
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
