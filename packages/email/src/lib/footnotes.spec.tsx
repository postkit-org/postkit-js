import { render } from '@chakra-email/core';
import { describe, expect, it } from 'vitest';

import {
  Footnote,
  Footnotes,
  postkitEmailFootnoteComponents,
  postkitEmailFootnoteMark,
} from './footnotes.js';
import { PostkitEmailProvider } from './provider.js';

describe('email footnotes', () => {
  it('marks references with superscript numbers and no links', async () => {
    const html = await render(
      <PostkitEmailProvider>
        <p>
          Plain text
          <Footnote index={1} identifier="plain" placement="side">
            Copied note.
          </Footnote>{' '}
          and renderers
          <Footnote index="2" />.
        </p>
        <Footnotes placement="side">
          <Footnote index={1} references={2}>
            <p>Markdown with directives, or MDX.</p>
          </Footnote>
          <Footnote index={2}>
            <p>Headless, Chakra, email or web components.</p>
          </Footnote>
        </Footnotes>
      </PostkitEmailProvider>,
    );

    expect(html).toContain('>1</sup>');
    expect(html).toContain('>2</sup>');
    // End notes always, whatever the placement; the copy beside the mark is dropped.
    expect(html).not.toContain('Copied note.');
    expect(html).toContain('Notes');
    expect(html).toContain('Markdown with directives, or MDX.');
    expect(html).toContain('1.');
    expect(html).not.toMatch(/href="#/);
    expect(html).not.toMatch(/\bid="fn/);
  });

  it('numbers like @postkit/core and hides the title on request', async () => {
    expect(
      [1, 2, 4, 7].map((index) => postkitEmailFootnoteMark(index, 'symbol')),
    ).toEqual(['*', '†', '§', '**']);
    expect(postkitEmailFootnoteMark(4, 'lower-roman')).toBe('iv');
    expect(postkitEmailFootnoteMark(28, 'lower-alpha')).toBe('ab');

    const html = await render(
      <PostkitEmailProvider>
        <Footnotes title={false} numbering="symbol">
          <Footnote index={2}>Second.</Footnote>
        </Footnotes>
      </PostkitEmailProvider>,
    );
    expect(html).not.toContain('Notes');
    expect(html).toContain('†');
    expect(
      await render(
        <PostkitEmailProvider>
          <Footnotes />
        </PostkitEmailProvider>,
      ),
    ).not.toContain('Footnotes');
    expect(Object.keys(postkitEmailFootnoteComponents)).toEqual([
      'Footnote',
      'Footnotes',
    ]);
  });
});
