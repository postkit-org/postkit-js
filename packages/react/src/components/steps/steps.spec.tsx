// @vitest-environment node

import { stepsDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Steps } from './steps.js';

describe('headless Steps', () => {
  it('renders an ordered list of numbered steps', () => {
    expect(Steps.definition).toBe(stepsDefinition);
    expect(
      renderToStaticMarkup(
        <Steps
          size="sm"
          items={[
            { title: 'Install', description: 'Add the package.' },
            { title: 'Render' },
          ]}
        />,
      ),
    ).toBe(
      '<ol data-postkit-component="Steps" data-postkit-part="root" data-size="sm" data-variant="subtle">' +
        '<li data-postkit-part="item"><div data-postkit-part="marker" aria-hidden="true">1</div>' +
        '<div data-postkit-part="content"><p data-postkit-part="title">Install</p>' +
        '<div data-postkit-part="description">Add the package.</div></div></li>' +
        '<li data-postkit-part="item"><div data-postkit-part="marker" aria-hidden="true">2</div>' +
        '<div data-postkit-part="content"><p data-postkit-part="title">Render</p></div></li></ol>',
    );
  });

  it('reads authored JSON items', () => {
    expect(renderToStaticMarkup(<Steps items='[{"title":"One"}]' />)).toContain(
      '<p data-postkit-part="title">One</p>',
    );
  });
});
