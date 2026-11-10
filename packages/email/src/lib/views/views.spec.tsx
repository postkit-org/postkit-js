import { render } from '@chakra-email/core';
import { postkitBuiltInDefinitions } from '@postkit/core/components';
import { describe, expect, it } from 'vitest';

import { postkitEmailViews } from '../email-views.js';
import { PostkitEmailProvider } from '../provider.js';
import { KeyTakeaway } from './key-takeaway.js';
import { LinkPreview } from './link-preview.js';
import { ProductCard } from './product-card.js';
import { PullQuote } from './pull-quote.js';
import { Stat } from './stat.js';
import { Steps } from './steps.js';

/** `gray.200`, `brand.500`: a palette token that never resolved. */
const tokenLike = /\b[a-z]+\.\d{2,3}\b/;

function styles(html: string): string[] {
  return [...html.matchAll(/style="([^"]*)"/g)].map(([, style]) => style);
}

async function email(element: React.ReactElement): Promise<string> {
  return render(<PostkitEmailProvider>{element}</PostkitEmailProvider>);
}

describe('the 0.3.0 email views', () => {
  it('render email-safe markup on the light theme', async () => {
    const html = await email(
      <>
        <KeyTakeaway eyebrow="Summary" items={['One', { text: 'Two' }]}>
          Body.
        </KeyTakeaway>
        <PullQuote quote="Quoted." attribution="Ada" cite="Notes" />
        <Steps items='[{"title":"Install","description":"npm i"},"Use"]' />
        <Stat value="42%" label="Faster" trend="+12%" description="Since 0.2" />
        <ProductCard
          title="Kit"
          href="https://example.com/kit"
          imageSrc="https://example.com/kit.png"
          price="$10"
          rating="4.4"
          badge="New"
        />
        <LinkPreview
          href="https://example.com/a"
          metadata={{
            title: 'From metadata',
            description: 'Described.',
            images: [{ url: 'https://example.com/a.png', alt: 'A' }],
          }}
        />
      </>,
    );
    for (const name of [
      'KeyTakeaway',
      'PullQuote',
      'Steps',
      'Stat',
      'ProductCard',
      'LinkPreview',
    ]) {
      expect(html).toContain(`data-postkit-component="${name}"`);
    }
    expect(html).toContain('Key takeaway');
    expect(html).toContain('<li');
    expect(html).toContain('— Ada, <cite>Notes</cite>');
    expect(html).toContain('★★★★☆');
    expect(html).toContain('From metadata');
    expect(html).toContain('src="https://example.com/a.png"');
    expect(html).not.toContain('var(');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<script');
    for (const style of styles(html)) {
      expect(style).not.toMatch(tokenLike);
    }
  });

  it('number steps in a table column, without list markers', async () => {
    const html = await email(
      <Steps items={[{ title: 'First' }, { title: 'Second' }]} />,
    );
    expect(html).toContain('role="presentation"');
    expect(html).not.toContain('<ol');
    expect(html).toMatch(/>1<\/div>[\s\S]*First[\s\S]*>2<\/div>[\s\S]*Second/);
    expect(await email(<Steps items="not json" />)).not.toContain('Steps');
  });

  it('render LinkPreview as a static card, or a link when inline', async () => {
    const card = await email(
      <LinkPreview
        href="https://www.example.com/post"
        title="A post"
        siteName="Example"
        images="none"
        image="https://example.com/x.png"
      />,
    );
    expect(card).toContain('Example · example.com');
    expect(card).not.toContain('<img');
    const inline = await email(
      <LinkPreview href="https://example.com/b" presentation="inline" />,
    );
    expect(inline).toMatch(/<a [^>]*href="https:\/\/example.com\/b"/);
    expect(inline).toContain('>example.com</a>');
    expect(inline).not.toContain('<table');
  });

  it('cover every built-in that has no declared email fallback', () => {
    for (const definition of Object.values(postkitBuiltInDefinitions)) {
      const hasView = Object.hasOwn(postkitEmailViews, definition.name);
      // A component has a view or a declared fallback, never both or neither.
      expect(
        hasView !== (definition.email !== undefined),
        `${definition.name} needs exactly one of an email view or an email fallback`,
      ).toBe(true);
    }
  });
});
