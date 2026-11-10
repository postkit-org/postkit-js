// @vitest-environment node

import { cardGridDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { CardGrid } from './card-grid.js';

describe('headless CardGrid', () => {
  it('renders a bare card with its defaults', () => {
    expect(CardGrid.definition).toBe(cardGridDefinition);
    expect(
      renderToStaticMarkup(<CardGrid items={[{ title: 'Guide' }]} />),
    ).toBe(
      '<div data-postkit-component="CardGrid" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<div data-postkit-part="grid" style="--postkit-card-columns:2">' +
        '<article data-postkit-part="card"><div data-postkit-part="cardBody">' +
        '<p data-postkit-part="cardTitle">Guide</p></div></article></div></div>',
    );
  });

  it('renders the header, image, description, meta and link parts', () => {
    const markup = renderToStaticMarkup(
      <CardGrid
        title="Resources"
        description="Choose a guide."
        columns="3"
        items={[
          {
            title: 'Visual guide',
            description: 'Read it.',
            href: '/guide',
            image: { src: '/guide.jpg', alt: 'Guide cover' },
            meta: 'PDF',
          },
          { title: 'API', href: '/api', linkLabel: 'Open the API' },
        ]}
      />,
    );

    expect(markup).toContain(
      '<div data-postkit-part="header"><p data-postkit-part="title">Resources</p>' +
        '<p data-postkit-part="description">Choose a guide.</p></div>',
    );
    expect(markup).toContain('style="--postkit-card-columns:3"');
    expect(markup).toContain(
      '<img data-postkit-part="image" src="/guide.jpg" alt="Guide cover" loading="lazy"/>',
    );
    expect(markup).toContain(
      '<p data-postkit-part="cardDescription">Read it.</p><p data-postkit-part="meta">PDF</p>',
    );
    expect(markup).toContain(
      '<a data-postkit-part="link" href="/guide">Learn more<span aria-hidden="true"> →</span></a>',
    );
    expect(markup).toContain('>Open the API<');
  });
});
