// @vitest-environment node

import { disclosureDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Disclosure } from './disclosure.js';

describe('headless Disclosure', () => {
  it('renders native details and summary with the anatomy', () => {
    expect(Disclosure.definition).toBe(disclosureDefinition);
    expect(
      renderToStaticMarkup(
        <Disclosure summary="What is Postkit?">Article components.</Disclosure>,
      ),
    ).toBe(
      '<details data-postkit-component="Disclosure" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<summary data-postkit-part="summary">What is Postkit?' +
        '<span data-postkit-part="indicator" aria-hidden="true">+</span></summary>' +
        '<div data-postkit-part="content">Article components.</div></details>',
    );
  });

  it('starts open when asked', () => {
    expect(
      renderToStaticMarkup(
        <Disclosure summary="Open" open variant="plain">
          Body
        </Disclosure>,
      ),
    ).toMatch(/^<details [^>]*data-variant="plain" open="">/);
  });
});
