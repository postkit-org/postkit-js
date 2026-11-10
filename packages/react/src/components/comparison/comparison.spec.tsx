// @vitest-environment node

import { comparisonDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Comparison, postkitComparisonValue } from './comparison.js';

describe('headless Comparison', () => {
  it('renders a labelled, focusable table', () => {
    expect(Comparison.definition).toBe(comparisonDefinition);
    expect(
      renderToStaticMarkup(
        <Comparison
          columns={['Free', 'Pro']}
          items={[{ label: 'Previews', values: [false, true] }]}
        />,
      ),
    ).toBe(
      '<div data-postkit-component="Comparison" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<div data-postkit-part="scroller" tabindex="0" role="region" aria-label="Comparison">' +
        '<table data-postkit-part="table"><thead data-postkit-part="head"><tr>' +
        '<th data-postkit-part="header">Feature</th><th data-postkit-part="header">Free</th><th data-postkit-part="header">Pro</th>' +
        '</tr></thead><tbody><tr data-postkit-part="row">' +
        '<th data-postkit-part="label" scope="row">Previews</th>' +
        '<td data-postkit-part="value">No</td><td data-postkit-part="value">Yes</td>' +
        '</tr></tbody></table></div></div>',
    );
  });

  it('labels the table by its title and parses JSON columns and items', () => {
    const markup = renderToStaticMarkup(
      <Comparison
        title="Plans"
        description="Pick one."
        columns='["A"]'
        items='[{"label":"Seats","values":[3]}]'
      />,
    );
    const id = /<p data-postkit-part="title" id="([^"]+)">Plans<\/p>/.exec(
      markup,
    )?.[1];

    expect(id).toBeDefined();
    expect(markup).toContain(`aria-labelledby="${id}"`);
    expect(markup).toContain(
      '<p data-postkit-part="description">Pick one.</p>',
    );
    expect(markup).toContain('<td data-postkit-part="value">3</td>');
  });

  it('shows booleans as Yes or No and a missing value as a dash', () => {
    expect(postkitComparisonValue(true)).toBe('Yes');
    expect(postkitComparisonValue(false)).toBe('No');
    expect(postkitComparisonValue(null)).toBe('—');
    expect(postkitComparisonValue(undefined)).toBe('—');
    expect(postkitComparisonValue(0)).toBe(0);
  });
});
