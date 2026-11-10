// @vitest-environment node

import { sponsorBlockDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { SponsorBlock } from './sponsor-block.js';

describe('headless SponsorBlock', () => {
  it('renders the disclosure and name, labelled by both', () => {
    expect(SponsorBlock.definition).toBe(sponsorBlockDefinition);
    expect(renderToStaticMarkup(<SponsorBlock name="Example" />)).toBe(
      '<aside aria-label="Sponsored by Example" data-postkit-component="SponsorBlock" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<p data-postkit-part="disclosure">Sponsored</p>' +
        '<div data-postkit-part="content"><p data-postkit-part="name">Example</p></div>' +
        '</aside>',
    );
  });

  it('renders the logo, message and sponsored action', () => {
    const markup = renderToStaticMarkup(
      <SponsorBlock
        name="Example"
        disclosure="Partner"
        logoSrc="/logo.png"
        message="Supports publishing."
        href="https://example.com"
        actionLabel="Visit"
      />,
    );

    expect(markup).toContain('aria-label="Partner by Example"');
    expect(markup).toContain(
      '<img data-postkit-part="logo" src="/logo.png" alt="Example"/>',
    );
    expect(markup).toContain(
      '<p data-postkit-part="message">Supports publishing.</p>',
    );
    expect(markup).toContain(
      '<a data-postkit-part="action" href="https://example.com" rel="sponsored">Visit</a>',
    );
  });
});
