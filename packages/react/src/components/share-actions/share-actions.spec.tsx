// @vitest-environment node

import { shareActionsDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { ShareActions } from './share-actions.js';

describe('headless ShareActions', () => {
  it('carries its definition', () => {
    expect(ShareActions.definition).toBe(shareActionsDefinition);
  });

  it('renders the default native, copy and email actions', () => {
    expect(renderToStaticMarkup(<ShareActions url="https://x.test" />)).toBe(
      '<aside data-postkit-component="ShareActions" data-postkit-part="root" data-size="md" data-variant="subtle" data-layout="buttons">' +
        '<p data-postkit-part="label">Share this post</p>' +
        '<div data-postkit-part="actions">' +
        '<button data-postkit-service="native" type="button" aria-label="Share this post: Share" data-postkit-part="action"><span aria-hidden="true" data-postkit-part="icon">S</span>Share</button>' +
        '<button data-postkit-service="copy" type="button" aria-label="Share this post: Copy link" data-postkit-part="action"><span aria-hidden="true" data-postkit-part="icon">C</span>Copy link</button>' +
        '<button data-postkit-service="email" type="button" aria-label="Share this post: Email" data-postkit-part="action"><span aria-hidden="true" data-postkit-part="icon">E</span>Email</button>' +
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
    expect(markup).toContain('aria-label="Pass it on: X"');
    expect(markup).toContain(
      '<span data-postkit-part="icon"><i>★</i></span>Studio</button>',
    );
    expect(markup).toContain(
      'aria-label="Pass it on: mystery" data-postkit-part="action"><span aria-hidden="true" data-postkit-part="icon">M</span>mystery</button>',
    );
  });
});
