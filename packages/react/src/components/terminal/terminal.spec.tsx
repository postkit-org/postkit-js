// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { Terminal } from './terminal.js';

describe('headless Terminal', () => {
  it('renders the command with its default prompt and title', () => {
    expect(renderToStaticMarkup(<Terminal command="npm i" />)).toBe(
      '<div data-postkit-component="Terminal" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<div data-postkit-part="header"><div data-postkit-part="dots" aria-hidden="true">● ● ●</div>' +
        '<p data-postkit-part="title">Terminal</p><span></span></div>' +
        '<div data-postkit-part="body"><span data-postkit-part="prompt" aria-hidden="true">$</span>' +
        '<code data-postkit-part="command">npm i</code></div></div>',
    );
  });

  it('renders the output, prompt and title it is given', () => {
    const markup = renderToStaticMarkup(
      <Terminal
        command="ls"
        output="a.ts"
        prompt=">"
        title="Shell"
        variant="plain"
        classNames={{ output: 'out' }}
      />,
    );

    expect(markup).toContain('data-variant="plain"');
    expect(markup).toContain('<p data-postkit-part="title">Shell</p>');
    expect(markup).toContain('aria-hidden="true">&gt;</span>');
    expect(markup).toContain(
      '<samp data-postkit-part="output" class="out">a.ts</samp>',
    );
  });
});
