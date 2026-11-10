// @vitest-environment node

import { defaultSystem } from '@chakra-ui/react';
import { terminalDefinition } from '@postkit/core/components';
import { renderToStaticMarkup } from 'react-dom/server';

import { PostkitProvider } from '../../lib/provider.js';
import {
  createPostkitSystem,
  createPostkitTheme,
  postkitDefaultTheme,
} from '../../lib/theme.js';
import { Terminal } from './terminal.js';

function render(
  node: React.ReactNode,
  system = createPostkitSystem({ preset: postkitDefaultTheme }),
) {
  return renderToStaticMarkup(
    <PostkitProvider system={system}>{node}</PostkitProvider>,
  );
}

describe('Chakra Terminal view', () => {
  it('carries its definition', () => {
    expect(Terminal.definition).toBe(terminalDefinition);
    expect(Terminal.displayName).toBe('Terminal');
  });

  it('stamps the anatomy next to the recipe classes', () => {
    const markup = render(
      <Terminal command="npm i" classNames={{ command: 'cmd' }} size="lg" />,
    );

    expect(markup).toMatch(
      /data-postkit-component="Terminal" data-postkit-part="root" data-size="lg" data-variant="subtle" class="postkit-terminal__root/,
    );
    expect(markup).toContain(
      'data-postkit-part="command" class="postkit-terminal__command cmd',
    );
  });

  it("keeps its own recipe's styles without a registered recipe", () => {
    // The header is a three-column grid in both the host-native and the
    // standalone recipe, so the title stays centred without the preset.
    expect(render(<Terminal command="ls" />, defaultSystem)).toContain(
      'grid-template-columns:1fr auto 1fr',
    );
    expect(
      render(<Terminal command="ls" unstyled />, defaultSystem),
    ).not.toContain('grid-template-columns');
  });

  it("reports the host theme's default variant in the anatomy", () => {
    const system = createPostkitSystem({
      preset: postkitDefaultTheme,
      theme: createPostkitTheme({
        terminal: { defaultVariants: { variant: 'plain' } },
      }) as never,
    });

    expect(render(<Terminal command="ls" />, system)).toContain(
      'data-variant="plain"',
    );
  });
});
