// @vitest-environment node

import { statDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { Stat } from './stat.js';

describe('headless Stat', () => {
  it('renders a definition list with the label as its term', () => {
    expect(Stat.definition).toBe(statDefinition);
    expect(
      renderToStaticMarkup(
        <Stat value="98%" label="Completion" trend="+4%" description="D" />,
      ),
    ).toBe(
      '<dl data-postkit-component="Stat" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<dt data-postkit-part="label">Completion</dt>' +
        '<dd data-postkit-part="value">98%</dd>' +
        '<dd data-postkit-part="trend">+4%</dd>' +
        '<dd data-postkit-part="description">D</dd></dl>',
    );
  });

  it('omits the trend and description when unset', () => {
    const markup = renderToStaticMarkup(
      <Stat value="1" label="L" size="lg" variant="plain" />,
    );

    expect(markup).toContain('data-size="lg" data-variant="plain"');
    expect(markup).not.toContain('data-postkit-part="trend"');
    expect(markup).not.toContain('data-postkit-part="description"');
  });
});
