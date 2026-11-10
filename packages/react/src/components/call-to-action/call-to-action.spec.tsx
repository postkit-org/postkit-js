// @vitest-environment node

import { callToActionDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { CallToAction } from './call-to-action.js';

describe('headless CallToAction', () => {
  it('renders the anatomy with both actions', () => {
    expect(CallToAction.definition).toBe(callToActionDefinition);
    expect(
      renderToStaticMarkup(
        <CallToAction
          title="Try Postkit"
          eyebrow="New"
          description="Portable content."
          primaryLabel="Start"
          primaryHref="/start"
          secondaryLabel="Docs"
          secondaryHref="/docs"
          alignment="center"
        />,
      ),
    ).toBe(
      '<aside data-postkit-component="CallToAction" data-postkit-part="root" data-size="md" data-variant="subtle" data-alignment="center">' +
        '<div data-postkit-part="content">' +
        '<p data-postkit-part="eyebrow">New</p>' +
        '<h2 data-postkit-part="title">Try Postkit</h2>' +
        '<div data-postkit-part="body">Portable content.</div>' +
        '</div>' +
        '<div data-postkit-part="actions">' +
        '<a data-postkit-part="primaryAction" href="/start">Start</a>' +
        '<a data-postkit-part="secondaryAction" href="/docs">Docs</a>' +
        '</div></aside>',
    );
  });

  it('needs a label and an href for an action, and prefers children', () => {
    const markup = renderToStaticMarkup(
      <CallToAction title="T" description="Plain" primaryLabel="Start">
        <em>Rich</em>
      </CallToAction>,
    );

    expect(markup).not.toContain('data-postkit-part="actions"');
    expect(markup).not.toContain('data-postkit-part="eyebrow"');
    expect(markup).toContain(
      '<div data-postkit-part="body"><em>Rich</em></div>',
    );
    expect(markup).toContain('data-alignment="start"');
  });
});
