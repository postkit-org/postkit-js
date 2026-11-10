import {
  formatPostkitFootnoteNumber,
  parsePostkitFootnotePlacement,
  postkitFootnoteBacklinkLabel,
  postkitFootnoteIds,
  postkitFootnotePlacementSteps,
  resolvePostkitFootnotePlacement,
} from '../components/index.js';
import {
  PostkitParseError,
  createPostkitDocument,
  parsePostkitHtml,
  parsePostkitJson,
  parsePostkitMarkdown,
  resolvePostkitFootnotes,
  serializePostkitHtml,
  serializePostkitJson,
  serializePostkitMarkdown,
  serializePostkitMdx,
  serializePostkitText,
  validatePostkitFootnotes,
  type PostkitNode,
} from '../index.js';

const article = `Postkit keeps the article in plain text[^plain] and lets each renderer decide how notes appear[^renderers].

Repeated references share one note[^plain].

[^renderers]: Headless, Chakra, email or web components.
[^plain]: Markdown with directives, or MDX.
`;

describe('footnote numbering and ids', () => {
  it('numbers notes by first reference, never by label', () => {
    const resolution = resolvePostkitFootnotes(parsePostkitMarkdown(article));
    expect(
      resolution.notes.map(({ identifier, index, references }) => ({
        identifier,
        index,
        references,
      })),
    ).toEqual([
      { identifier: 'plain', index: 1, references: 2 },
      { identifier: 'renderers', index: 2, references: 1 },
    ]);
    expect(resolution.problems).toEqual([]);
  });

  it('formats numbers, symbols and backlink labels', () => {
    expect(
      [1, 2, 4, 9].map((index) => formatPostkitFootnoteNumber(index)),
    ).toEqual(['1', '2', '4', '9']);
    expect(formatPostkitFootnoteNumber(4, 'lower-roman')).toBe('iv');
    expect(formatPostkitFootnoteNumber(28, 'lower-alpha')).toBe('ab');
    expect(
      [1, 2, 3, 7].map((index) => formatPostkitFootnoteNumber(index, 'symbol')),
    ).toEqual(['*', '†', '‡', '**']);
    expect(formatPostkitFootnoteNumber(3, (index) => `n${index}`)).toBe('n3');
    expect([1, 2, 27].map(postkitFootnoteBacklinkLabel)).toEqual([
      'a',
      'b',
      'aa',
    ]);
  });

  it('prefixes ids per document', () => {
    const ids = postkitFootnoteIds(1, 'One article, Four renderers!');
    expect(ids.note).toBe('fn-one-article-four-renderers-1');
    expect(ids.reference()).toBe('fnref-one-article-four-renderers-1');
    expect(ids.reference(2)).toBe('fnref-one-article-four-renderers-1-2');
    expect(ids.sidenote).toBe('sn-one-article-four-renderers-1');
    expect(postkitFootnoteIds(3).note).toBe('fn-3');
  });
});

describe('footnote validation', () => {
  it('fails a reference with no definition, with its line and column', () => {
    expect(() =>
      parsePostkitMarkdown('# Title\n\nSome text[^missing] here.\n'),
    ).toThrow(
      new PostkitParseError(
        'invalid-document',
        'Footnote [^missing] has no definition (3:10).',
      ),
    );
    expect(() =>
      parsePostkitMarkdown('Escaped \\[^missing] is text.'),
    ).not.toThrow();
    expect(
      parsePostkitMarkdown('Kept [^missing].', { missingFootnotes: 'literal' })
        .children,
    ).toEqual([
      {
        type: 'element',
        name: 'p',
        children: [{ type: 'text', value: 'Kept [^missing].' }],
      },
    ]);
  });

  it('warns about a note nobody references and leaves it out', () => {
    const document = parsePostkitMarkdown(
      'Text[^a].\n\n[^a]: Used.\n\n[^b]: Unused.',
    );
    expect(validatePostkitFootnotes(document)).toEqual([
      {
        severity: 'warning',
        code: 'unreferenced-definition',
        identifier: 'b',
        message:
          'Footnote [^b] is defined but never referenced; it is left out.',
      },
    ]);
    expect(
      serializePostkitHtml(document, { annotations: false }),
    ).not.toContain('Unused');
  });

  it('reports a reference with no definition in any document', () => {
    const document = createPostkitDocument([
      {
        type: 'element',
        name: 'p',
        children: [{ type: 'footnoteReference', identifier: 'gone' }],
      },
    ]);
    expect(validatePostkitFootnotes(document)).toMatchObject([
      { severity: 'error', code: 'missing-definition', identifier: 'gone' },
    ]);
  });
});

describe('footnote authoring', () => {
  it('reads the inline directive as a note written in place', () => {
    const document = parsePostkitMarkdown(
      'Plain text:footnote[Markdown *with* directives.] and 10:30 stays.',
    );
    expect(document.children).toEqual([
      {
        type: 'element',
        name: 'p',
        children: [
          { type: 'text', value: 'Plain text' },
          { type: 'footnoteReference', identifier: 'inline-1' },
          { type: 'text', value: ' and 10:30 stays.' },
        ],
      },
      {
        type: 'footnoteDefinition',
        identifier: 'inline-1',
        children: [
          {
            type: 'element',
            name: 'p',
            children: [
              { type: 'text', value: 'Markdown ' },
              {
                type: 'element',
                name: 'em',
                children: [{ type: 'text', value: 'with' }],
              },
              { type: 'text', value: ' directives.' },
            ],
          },
        ],
      },
    ]);
  });

  it('keeps other directives as written when a note is inline', () => {
    const document = parsePostkitMarkdown(
      'A note:footnote[Here.] beside :smile: text.\n\n::leaf{a=b}',
    );
    expect(serializePostkitText(document)).toBe(
      'A note [1] beside :smile: text.\n\n::leaf{a=b}\n\n[1] Here.\n',
    );
  });

  it('reads <Footnote> in MDX, and places the list at <Footnotes />', () => {
    const document = parsePostkitMarkdown(
      'One<Footnote>Inline **note**.</Footnote> two.\n\n<Footnotes title="References" />\n\nAfter the list.',
      { mdx: true },
    );
    const html = serializePostkitHtml(document, { annotations: false });
    expect(html.indexOf('References')).toBeLessThan(
      html.indexOf('After the list.'),
    );
    expect(html).toContain('<strong>note</strong>');
  });
});

describe('footnote output', () => {
  it('writes end notes with links, shared backlinks and per-document ids', () => {
    const html = serializePostkitHtml(parsePostkitMarkdown(article), {
      annotations: false,
      footnotes: { scope: 'post' },
    });
    expect(html).toContain(
      '<sup data-postkit-component="Footnote" data-postkit-part="root" data-marker="superscript" id="fnref-post-1"><a data-postkit-part="marker" href="#fn-post-1" role="doc-noteref" aria-label="Note 1">1</a></sup>',
    );
    expect(html).toContain('id="fnref-post-1-2"');
    expect(html).toContain(
      '<span data-postkit-part="backlink">↩ <a href="#fnref-post-1" role="doc-backlink" aria-label="Back to reference 1a">a</a> <a href="#fnref-post-1-2" role="doc-backlink" aria-label="Back to reference 1b">b</a></span>',
    );
    expect(html.match(/<li /g)).toHaveLength(2);
    expect(html.indexOf('Markdown with directives')).toBeLessThan(
      html.indexOf('Headless, Chakra'),
    );
  });

  it('writes plain text with [1] marks and a numbered list', () => {
    expect(serializePostkitText(parsePostkitMarkdown(article))).toBe(
      'Postkit keeps the article in plain text [1] and lets each renderer decide how notes appear [2].\n\n' +
        'Repeated references share one note [1].\n\n' +
        '[1] Markdown with directives, or MDX.\n[2] Headless, Chakra, email or web components.\n',
    );
  });

  it('writes email-style notes without links', () => {
    const html = serializePostkitHtml(parsePostkitMarkdown(article), {
      annotations: false,
      footnotes: { links: false },
    });
    expect(html).not.toMatch(/href="#|id="fn/);
    expect(html).toContain('<sup data-postkit-component="Footnote"');
  });

  it('takes the placed list’s numbering, marker and title', () => {
    const document = parsePostkitMarkdown(
      'A[^a] b[^b].\n\n[^a]: One.\n[^b]: Two.\n\n<Footnotes numbering="symbol" marker="bracket" title="References" />',
      { mdx: true },
    );
    const html = serializePostkitHtml(document, { annotations: false });
    expect(html).toContain('>[*]</a>');
    expect(html).toContain('>[†]</a>');
    expect(html).toContain('<span data-postkit-part="number">†</span>');
    expect(serializePostkitText(document)).toContain('[†] Two.');
  });

  it.each([false, true])(
    'round-trips through Markdown, MDX, JSON and annotated HTML (mdx=%s)',
    (mdx) => {
      const document = parsePostkitMarkdown(article, { mdx });
      const markdown = mdx
        ? serializePostkitMdx(document)
        : serializePostkitMarkdown(document);
      expect(markdown).toContain(
        '[^plain]: Markdown with directives, or MDX\\.',
      );
      expect(parsePostkitMarkdown(markdown, { mdx })).toEqual(document);
      expect(parsePostkitJson(serializePostkitJson(document))).toEqual(
        document,
      );
      const html = serializePostkitHtml(document);
      const recovered = parsePostkitHtml(html);
      expect(serializePostkitHtml(recovered)).toBe(html);
      expect(resolvePostkitFootnotes(recovered).notes).toHaveLength(2);
    },
  );

  it('reads the MDX the Markdown tooling writes back into nodes', () => {
    const document = parsePostkitMarkdown(
      'A<Footnote identifier="plain" index="1" scope="post">Copy beside.</Footnote>.\n\n<Footnotes scope="post" title="References">\n<Footnote identifier="plain" index="1" references="1">\n\nThe note.\n\n</Footnote>\n</Footnotes>',
      { mdx: true },
    );
    expect(validatePostkitFootnotes(document)).toEqual([]);
    const html = serializePostkitHtml(document, { annotations: false });
    expect(html).not.toContain('Copy beside.');
    expect(html).toContain('id="fnref-post-1"');
    expect(html).toContain('References');
    expect(html).toContain('The note.');
  });

  it('reads GFM footnote HTML', () => {
    const document = parsePostkitHtml(
      '<p>Text<sup><a href="#user-content-fn-plain" id="user-content-fnref-plain" data-footnote-ref aria-describedby="footnote-label">1</a></sup>.</p>' +
        '<section data-footnotes class="footnotes"><h2 class="sr-only" id="footnote-label">Footnotes</h2><ol><li id="user-content-fn-plain"><p>Markdown. <a href="#user-content-fnref-plain" data-footnote-backref aria-label="Back to reference 1">↩</a></p></li></ol></section>',
    );
    const nodes: PostkitNode[] = [
      {
        type: 'element',
        name: 'p',
        children: [
          { type: 'text', value: 'Text' },
          { type: 'footnoteReference', identifier: 'plain' },
          { type: 'text', value: '.' },
        ],
      },
      {
        type: 'footnoteDefinition',
        identifier: 'plain',
        children: [
          {
            type: 'element',
            name: 'p',
            children: [{ type: 'text', value: 'Markdown.' }],
          },
        ],
      },
    ];
    expect(document.children).toEqual(nodes);
  });
});

describe('responsive placement', () => {
  const site = { base: 'inline', md: 'end', xl: 'side' } as const;
  const breakpoints = { md: 768, xl: 1200 };

  it('reads placement values, including JSON from directives', () => {
    expect(parsePostkitFootnotePlacement('side')).toBe('side');
    expect(
      parsePostkitFootnotePlacement('{"base":"inline","xl":"side"}'),
    ).toEqual({ base: 'inline', xl: 'side' });
    expect(parsePostkitFootnotePlacement('margin')).toBeUndefined();
    expect(postkitFootnotePlacementSteps({ md: 'side' })).toEqual([
      ['base', 'end'],
      ['md', 'side'],
    ]);
  });

  it.each([
    [390, 'inline'],
    [1199, 'end'],
    [1440, 'side'],
  ] as const)('at %ipx the site placement is %s', (width, expected) => {
    expect(resolvePostkitFootnotePlacement(site, { width, breakpoints })).toBe(
      expected,
    );
  });

  it('falls back from side to end below sideBreakpoint or without margin', () => {
    expect(resolvePostkitFootnotePlacement('side', { width: 900 })).toBe('end');
    expect(
      resolvePostkitFootnotePlacement('side', {
        width: 900,
        sideBreakpoint: 800,
      }),
    ).toBe('side');
    expect(
      resolvePostkitFootnotePlacement('side', {
        width: 1440,
        marginFits: false,
      }),
    ).toBe('end');
  });
});
