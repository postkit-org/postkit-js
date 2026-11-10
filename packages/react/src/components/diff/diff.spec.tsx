// @vitest-environment node

import { renderToStaticMarkup } from 'react-dom/server';

import { Diff, postkitDiffLines } from './diff.js';

describe('headless Diff', () => {
  it('marks each line as an addition, deletion or context', () => {
    expect(postkitDiffLines('- a\n+ b\n c\n\n')).toEqual([
      { kind: 'deletion', marker: '−', content: ' a' },
      { kind: 'addition', marker: '+', content: ' b' },
      { kind: 'context', marker: ' ', content: ' c' },
      { kind: 'context', marker: ' ', content: ' ' },
    ]);
  });

  it('renders an untitled diff as a labelled, focusable region', () => {
    expect(renderToStaticMarkup(<Diff diff="+b" />)).toBe(
      '<div data-postkit-component="Diff" data-postkit-part="root" data-size="md" data-variant="subtle">' +
        '<pre data-postkit-part="code" tabindex="0" role="region" aria-label="Diff"><code>' +
        '<span data-postkit-part="line" data-diff="addition">' +
        '<span data-postkit-part="marker" aria-hidden="true">+</span>' +
        '<span data-postkit-part="content">b</span></span></code></pre></div>',
    );
  });

  it('labels the region with its title', () => {
    const markup = renderToStaticMarkup(<Diff diff="-a" title="a.ts" />);
    const id = /<p data-postkit-part="title" id="([^"]+)">a\.ts<\/p>/.exec(
      markup,
    )?.[1];

    expect(id).toBeTruthy();
    expect(markup).toContain(`aria-labelledby="${id}"`);
    expect(markup).toContain('data-diff="deletion"');
  });
});
