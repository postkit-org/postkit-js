// @vitest-environment node

import { newsletterSignupDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { NewsletterSignup } from './newsletter-signup.js';

/** `useId` values vary; replace them for exact comparisons. */
const stableIds = (markup: string) => markup.replace(/«[^»]+»/g, 'id');

describe('headless NewsletterSignup', () => {
  it('carries its definition', () => {
    expect(NewsletterSignup.definition).toBe(newsletterSignupDefinition);
  });

  it('renders an unconfigured form that says so', () => {
    expect(
      stableIds(renderToStaticMarkup(<NewsletterSignup title="News" />)),
    ).toBe(
      '<aside data-postkit-configured="false" data-postkit-component="NewsletterSignup" data-postkit-part="root" data-size="md" data-variant="subtle" data-alignment="start">' +
        '<div data-postkit-part="content"><h2 data-postkit-part="title">News</h2></div>' +
        '<form data-postkit-part="form" method="post">' +
        '<label data-postkit-part="label" for="id">Email address</label>' +
        '<div data-postkit-part="fields">' +
        '<input type="email" autoComplete="email" required="" data-postkit-part="input" id="id" aria-describedby="id" name="email"/>' +
        '<button type="submit" disabled="" data-postkit-part="submit">Subscribe</button></div>' +
        '<span aria-live="polite" role="status" data-postkit-part="status" id="id">Newsletter signup is not configured.</span>' +
        '</form></aside>',
    );
  });

  it('posts to a host action with the list, hidden fields and privacy note', () => {
    const markup = renderToStaticMarkup(
      <NewsletterSignup
        title="News"
        description="Monthly."
        list="weekly"
        privacy="No spam."
        alignment="center"
        newsletter={{
          action: '/subscribe',
          method: 'get',
          hiddenFields: { source: 'blog' },
        }}
      />,
    );

    expect(markup).toContain('data-postkit-configured="true"');
    expect(markup).toContain('data-alignment="center"');
    expect(markup).toContain(
      '<div data-postkit-part="description">Monthly.</div>',
    );
    expect(markup).toContain(
      '<form data-postkit-part="form" action="/subscribe" method="get">',
    );
    expect(markup).toContain(
      '<input type="hidden" name="list" value="weekly"/><input type="hidden" name="source" value="blog"/>',
    );
    expect(markup).toContain('<p data-postkit-part="privacy">No spam.</p>');
    expect(markup).toContain(
      '<button type="submit" data-postkit-part="submit">Subscribe</button>',
    );
  });

  it('renders children in place of the description', () => {
    expect(
      renderToStaticMarkup(
        <NewsletterSignup title="News" description="Ignored.">
          <strong>Rich</strong>
        </NewsletterSignup>,
      ),
    ).toContain(
      '<div data-postkit-part="description"><strong>Rich</strong></div>',
    );
  });
});
