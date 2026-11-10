// @vitest-environment node

import { calloutDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Aside } from '../aside/aside.js';
import { Callout } from './callout.js';

describe('headless Callout', () => {
  it('renders the anatomy with no styles or Chakra', () => {
    expect(Callout.definition).toBe(calloutDefinition);
    expect(
      renderToStaticMarkup(
        <Callout tone="tip" title="Keep the content">
          Change the renderer.
        </Callout>,
      ),
    ).toBe(
      '<aside data-postkit-component="Callout" data-postkit-part="root" data-size="md" data-variant="subtle" data-tone="tip" data-postkit-tone="tip">' +
        '<span data-postkit-part="icon" aria-hidden="true">✓</span>' +
        '<div data-postkit-part="content">' +
        '<p data-postkit-part="title">Keep the content</p>' +
        '<div data-postkit-part="body">Change the renderer.</div>' +
        '</div></aside>',
    );
  });

  it('takes a custom icon, omits an empty title and accepts classNames', () => {
    const markup = renderToStaticMarkup(
      <Callout icon={<b>*</b>} classNames={{ icon: 'mark' }}>
        Body
      </Callout>,
    );

    expect(markup).toContain(
      '<span data-postkit-part="icon" class="mark" aria-hidden="true"><b>*</b></span>',
    );
    expect(markup).not.toContain('data-postkit-part="title"');
    expect(markup).toContain('data-tone="note"');
  });

  it('renders Aside with the same anatomy under its own name', () => {
    const markup = renderToStaticMarkup(<Aside variant="plain">Context</Aside>);

    expect(markup).toContain('data-postkit-component="Aside"');
    expect(markup).toContain('data-variant="plain"');
    expect(markup).toContain('data-postkit-part="body"');
  });
});
