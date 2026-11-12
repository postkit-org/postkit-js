// @vitest-environment node

import { audienceBoundaryDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { AudienceBoundary } from './audience-boundary.js';

describe('headless AudienceBoundary', () => {
  it('renders the content for an authorized viewer by default', () => {
    expect(AudienceBoundary.definition).toBe(audienceBoundaryDefinition);
    expect(
      renderToStaticMarkup(
        <AudienceBoundary audience="members">Protected.</AudienceBoundary>,
      ),
    ).toBe(
      '<div data-postkit-audience="members" data-postkit-component="AudienceBoundary" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<div data-postkit-part="content">Protected.</div></div>',
    );
  });

  it('renders the label and the fallback for an unauthorized viewer', () => {
    const markup = renderToStaticMarkup(
      <AudienceBoundary audience="members" authorized={false} showLabel="true">
        Protected.
      </AudienceBoundary>,
    );

    expect(markup).toContain(
      '<p data-postkit-part="label">Audience: members</p>',
    );
    expect(markup).toContain(
      '<div data-postkit-part="fallback">This section is available to a different audience.</div>',
    );
    expect(markup).not.toContain('Protected.');
    expect(
      renderToStaticMarkup(
        <AudienceBoundary
          audience="a"
          authorized={false}
          fallback={<b>No</b>}
        />,
      ),
    ).toContain('<div data-postkit-part="fallback"><b>No</b></div>');
  });
});
