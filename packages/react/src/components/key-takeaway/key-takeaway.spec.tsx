// @vitest-environment node

import { keyTakeawayDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { KeyTakeaway } from './key-takeaway.js';

describe('headless KeyTakeaway', () => {
  it('renders the default title alone', () => {
    expect(KeyTakeaway.definition).toBe(keyTakeawayDefinition);
    expect(renderToStaticMarkup(<KeyTakeaway />)).toBe(
      '<aside data-postkit-component="KeyTakeaway" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<p data-postkit-part="title">Key takeaway</p></aside>',
    );
  });

  it('renders the eyebrow, body and items, from an array or JSON', () => {
    const markup = renderToStaticMarkup(
      <KeyTakeaway eyebrow="Summary" title="Remember" items={['One', 'Two']}>
        Body
      </KeyTakeaway>,
    );

    expect(markup).toContain(
      '<p data-postkit-part="eyebrow">Summary</p><p data-postkit-part="title">Remember</p>' +
        '<div data-postkit-part="body">Body</div>' +
        '<ul data-postkit-part="list"><li data-postkit-part="item">One</li><li data-postkit-part="item">Two</li></ul>',
    );
    expect(renderToStaticMarkup(<KeyTakeaway items='["A"]' />)).toContain(
      '<li data-postkit-part="item">A</li>',
    );
    expect(() => renderToStaticMarkup(<KeyTakeaway items="{" />)).toThrow(
      'Postkit KeyTakeaway items must contain valid JSON.',
    );
    expect(() => renderToStaticMarkup(<KeyTakeaway items="{}" />)).toThrow(
      'Postkit KeyTakeaway items must contain a JSON array.',
    );
  });
});
