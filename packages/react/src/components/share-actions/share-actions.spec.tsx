// @vitest-environment node

import { shareActionsDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { ShareActions } from './share-actions.js';

/** `useId` values vary; replace them for exact comparisons. */
const stableIds = (markup: string) => markup.replace(/«[^»]+»/g, 'id');

describe('headless ShareActions', () => {
  it('carries its definition', () => {
    expect(ShareActions.definition).toBe(shareActionsDefinition);
  });

  it('renders the default native, copy and email actions', () => {
    expect(
      stableIds(renderToStaticMarkup(<ShareActions url="https://x.test" />)),
    ).toBe(
      '<aside data-postkit-component="ShareActions" data-postkit-part="root" data-size="md" data-variant="subtle" data-layout="buttons">' +
        '<p data-postkit-part="label" id="id-label">Share this post</p>' +
        '<div data-postkit-part="actions" role="group" aria-labelledby="id-label">' +
        '<button data-postkit-service="native" type="button" data-postkit-part="action"><span aria-hidden="true" data-postkit-initial="S" data-postkit-part="icon"></span>Share</button>' +
        '<button data-postkit-service="copy" type="button" data-postkit-part="action"><span aria-hidden="true" data-postkit-initial="C" data-postkit-part="icon"></span>Copy link</button>' +
        '<button data-postkit-service="email" type="button" data-postkit-part="action"><span aria-hidden="true" data-postkit-initial="E" data-postkit-part="icon"></span>Email</button>' +
        '</div><p aria-live="polite" data-postkit-part="status"></p></aside>',
    );
  });

  it('labels authored services, with host icons and unknown ids', () => {
    const markup = renderToStaticMarkup(
      <ShareActions
        url="https://x.test"
        label="Pass it on"
        layout="inline"
        services='["x","studio","mystery"]'
        socialServices={{ studio: { label: 'Studio', icon: <i>★</i> } }}
      />,
    );

    expect(markup).toContain('data-layout="inline"');
    expect(markup).toContain(
      '<button data-postkit-service="x" type="button" data-postkit-part="action"><span aria-hidden="true" data-postkit-initial="X" data-postkit-part="icon"></span>X</button>',
    );
    expect(markup).toContain(
      '<span data-postkit-part="icon"><i>★</i></span>Studio</button>',
    );
    expect(markup).toContain(
      'data-postkit-part="action"><span aria-hidden="true" data-postkit-initial="M" data-postkit-part="icon"></span>mystery</button>',
    );
  });
});
