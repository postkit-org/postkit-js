// @vitest-environment node

import { defaultSystem } from '@chakra-ui/react';
import { calloutDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../../lib/postkit-provider.js';
import { createPostkitSystem } from '../../lib/create-postkit-system.js';
import { createPostkitTheme, postkitDefaultTheme } from '../../lib/theme.js';
import { Aside } from '../aside/aside.js';
import { Callout } from './callout.js';

function render(
  node: React.ReactNode,
  system = createPostkitSystem({ preset: postkitDefaultTheme }),
) {
  return renderToStaticMarkup(
    <PostkitProvider system={system}>{node}</PostkitProvider>,
  );
}

describe('Chakra Callout view', () => {
  it('carries its definition', () => {
    expect(Callout.definition).toBe(calloutDefinition);
    expect(Callout.displayName).toBe('Callout');
    expect(Aside.displayName).toBe('Aside');
  });

  it('stamps the anatomy next to the recipe classes', () => {
    const markup = render(
      <Callout title="Heads up" tone="warning" size="lg">
        Body
      </Callout>,
    );

    expect(markup).toMatch(
      /<aside[^>]*data-postkit-component="Callout"[^>]*data-postkit-part="root"[^>]*data-size="lg"[^>]*data-variant="subtle"[^>]*data-tone="warning"/,
    );
    expect(markup).toContain('data-postkit-tone="warning"');
    expect(markup).toMatch(
      /data-postkit-part="icon" class="postkit-callout__icon/,
    );
    expect(markup).toMatch(
      /<p[^>]*class="[^"]*postkit-callout__title[^"]*"[^>]*data-postkit-part="title"/,
    );
    expect(markup).toContain('chakra-alert__root');
  });

  it('adds classNames per part, before rootProps.className', () => {
    const markup = render(
      <Callout
        classNames={{ root: 'my-root', body: 'my-body' }}
        rootProps={{ className: 'host' }}
      >
        Body
      </Callout>,
    );

    expect(markup).toContain('class="postkit-callout__root my-root host');
    expect(markup).toContain('class="postkit-callout__body my-body');
  });

  it("reports the host theme's default variant in the anatomy", () => {
    const system = createPostkitSystem({
      preset: postkitDefaultTheme,
      theme: createPostkitTheme({
        callout: { defaultVariants: { variant: 'plain' } },
      }) as never,
    });

    expect(render(<Callout>Body</Callout>, system)).toContain(
      'data-variant="plain"',
    );
    expect(render(<Callout>Body</Callout>, defaultSystem)).toContain(
      'data-variant="subtle"',
    );
  });

  it('keeps a componentName override and names Aside', () => {
    expect(render(<Callout componentName="Aside">Body</Callout>)).toContain(
      'data-postkit-component="Aside"',
    );
    expect(render(<Aside>Body</Aside>)).toContain(
      'data-postkit-component="Aside"',
    );
    expect(render(<Aside>Body</Aside>)).toContain('postkit-callout__root');
  });

  it('warns once in development about an unknown tone', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Callout tone={'chakra-unknown' as never}>Body</Callout>);
    render(<Callout tone={'chakra-unknown' as never}>Body</Callout>);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain(
      'Callout: the "tone" prop must be one of',
    );
    warn.mockRestore();
  });
});
