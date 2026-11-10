// @vitest-environment node

import { seriesNavigationDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { SeriesNavigation, postkitSeriesLink } from './series-navigation.js';

describe('headless SeriesNavigation', () => {
  it('renders a labelled nav with previous and next links', () => {
    expect(SeriesNavigation.definition).toBe(seriesNavigationDefinition);
    expect(
      renderToStaticMarkup(
        <SeriesNavigation
          title="Publishing"
          current={2}
          total={4}
          previous={{ title: 'Authoring', href: '/a' }}
          next='{"title":"Delivery","href":"/d"}'
        />,
      ),
    ).toBe(
      '<nav aria-label="Publishing series navigation" data-postkit-component="SeriesNavigation" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<div data-postkit-part="header"><p data-postkit-part="title">Publishing</p>' +
        '<p data-postkit-part="position">2 of 4</p></div>' +
        '<div data-postkit-part="links">' +
        '<a data-postkit-part="link" href="/a" rel="prev"><span data-postkit-part="direction">Previous</span><span data-postkit-part="linkTitle">Authoring</span></a>' +
        '<a data-postkit-part="link" href="/d" rel="next"><span data-postkit-part="direction">Next</span><span data-postkit-part="linkTitle">Delivery</span></a>' +
        '</div></nav>',
    );
  });

  it('keeps a placeholder for a missing link and hides an incomplete position', () => {
    const markup = renderToStaticMarkup(
      <SeriesNavigation title="S" current={1} previous="" />,
    );

    expect(markup).toContain(
      '<div data-postkit-part="links"><span></span><span></span></div>',
    );
    expect(markup).not.toContain('data-postkit-part="position"');
  });

  it('parses link JSON and rejects invalid JSON', () => {
    expect(postkitSeriesLink(undefined)).toBeUndefined();
    expect(postkitSeriesLink('')).toBeUndefined();
    expect(postkitSeriesLink('{"title":"T","href":"/t"}')).toEqual({
      title: 'T',
      href: '/t',
    });
    expect(() => postkitSeriesLink('{')).toThrow(
      'Postkit SeriesNavigation links must contain valid JSON.',
    );
  });
});
