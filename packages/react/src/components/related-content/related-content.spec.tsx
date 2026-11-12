// @vitest-environment node

import { relatedContentDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { RelatedContent } from './related-content.js';

describe('headless RelatedContent', () => {
  it('renders a titled list of links', () => {
    expect(RelatedContent.definition).toBe(relatedContentDefinition);
    expect(
      renderToStaticMarkup(
        <RelatedContent
          items={[
            {
              title: 'Rendering',
              href: '/r',
              description: 'How.',
              meta: '5 min',
            },
          ]}
        />,
      ),
    ).toBe(
      '<aside data-postkit-component="RelatedContent" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<p data-postkit-part="title">Related content</p>' +
        '<ul data-postkit-part="list"><li data-postkit-part="item"><a data-postkit-part="link" href="/r">' +
        '<span data-postkit-part="itemTitle">Rendering</span>' +
        '<span data-postkit-part="description">How.</span>' +
        '<span data-postkit-part="meta">5 min</span>' +
        '</a></li></ul></aside>',
    );
  });

  it('parses JSON items and omits empty description and meta', () => {
    const markup = renderToStaticMarkup(
      <RelatedContent title="More" items='[{"title":"A","href":"/a"}]' />,
    );

    expect(markup).toContain('<p data-postkit-part="title">More</p>');
    expect(markup).toContain(
      '<span data-postkit-part="itemTitle">A</span></a>',
    );
  });
});
