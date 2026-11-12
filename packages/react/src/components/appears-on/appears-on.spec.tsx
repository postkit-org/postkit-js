// @vitest-environment node

import { appearsOnDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { AppearsOn } from './appears-on.js';

describe('headless AppearsOn', () => {
  it('renders a labelled list of syndication links from JSON', () => {
    expect(AppearsOn.definition).toBe(appearsOnDefinition);
    const markup = renderToStaticMarkup(
      <AppearsOn items='[{"service":"bluesky","url":"https://bsky.app/1"}]' />,
    );

    expect(markup).toContain(
      '<aside data-postkit-component="AppearsOn" data-postkit-part="root" data-size="md" data-variant="subtle" data-presentation="inline">',
    );
    expect(markup).toContain('<p data-postkit-part="label">Appears on</p>');
    expect(markup).toContain(
      '<ul data-postkit-part="list" aria-label="Appears on">',
    );
    expect(markup).toContain(
      '<li data-postkit-part="item" data-postkit-service="bluesky">',
    );
    expect(markup).toContain(
      '<a data-postkit-part="link" href="https://bsky.app/1" rel="syndication">' +
        '<span data-postkit-part="icon" aria-hidden="true">B</span><span>bluesky</span></a>',
    );
    expect(markup).not.toContain('data-postkit-part="date"');
  });

  it('uses service labels and icons, dates and unpublished statuses', () => {
    const markup = renderToStaticMarkup(
      <AppearsOn
        label="Also on"
        showDates
        presentation="badges"
        services={{ bluesky: { label: 'Bluesky', icon: <svg /> } }}
        items={[
          {
            service: 'bluesky',
            url: 'https://bsky.app/1',
            publishedAt: '2026-01-02T12:00:00Z',
            status: 'pending',
          },
          { service: 'medium', url: 'https://medium.com/1', label: 'Medium' },
        ]}
      />,
    );

    expect(markup).toContain('data-presentation="badges"');
    expect(markup).toContain(
      '<span data-postkit-part="icon"><svg></svg></span>',
    );
    expect(markup).toContain('<span>Bluesky</span>');
    expect(markup).toContain(
      '<time data-postkit-part="date" dateTime="2026-01-02T12:00:00Z">',
    );
    expect(markup).toContain('<span data-postkit-part="status">pending</span>');
    expect(markup).toContain('<span>Medium</span>');
  });

  it('rejects items that are not a JSON array', () => {
    expect(() => renderToStaticMarkup(<AppearsOn items="{" />)).toThrow(
      'Postkit AppearsOn items must contain valid JSON.',
    );
    expect(() => renderToStaticMarkup(<AppearsOn items="{}" />)).toThrow(
      'Postkit AppearsOn items must contain a JSON array.',
    );
  });
});
