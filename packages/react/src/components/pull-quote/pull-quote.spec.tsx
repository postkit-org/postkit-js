// @vitest-environment node

import { pullQuoteDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { PullQuote } from './pull-quote.js';

describe('headless PullQuote', () => {
  it('renders the anatomy with no styles or Chakra', () => {
    expect(PullQuote.definition).toBe(pullQuoteDefinition);
    expect(
      renderToStaticMarkup(
        <PullQuote quote="Keep it." attribution="Ada" cite="Notes" />,
      ),
    ).toBe(
      '<figure data-postkit-component="PullQuote" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<span data-postkit-part="mark" aria-hidden="true">“</span>' +
        '<blockquote data-postkit-part="quote">Keep it.</blockquote>' +
        '<figcaption data-postkit-part="attribution">Ada<cite data-postkit-part="cite"> — Notes</cite></figcaption>' +
        '</figure>',
    );
  });

  it('omits the caption without attribution or citation', () => {
    expect(renderToStaticMarkup(<PullQuote quote="Q" />)).not.toContain(
      'figcaption',
    );
    expect(
      renderToStaticMarkup(<PullQuote quote="Q" cite="Notes" />),
    ).toContain(
      '<figcaption data-postkit-part="attribution"><cite data-postkit-part="cite">Notes</cite></figcaption>',
    );
  });
});
