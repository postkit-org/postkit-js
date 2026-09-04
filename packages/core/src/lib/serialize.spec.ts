import {
  POSTKIT_DOCUMENT_VERSION,
  PostkitParseError,
  createPostkitDocument,
  parsePostkit,
  parsePostkitHtml,
  parsePostkitMarkdown,
  serializePostkit,
  serializePostkitHtml,
  serializePostkitJson,
  serializePostkitMarkdown,
  serializePostkitMdx,
} from '../index.js';

describe('Postkit document serialization', () => {
  it('round-trips semantic and component nodes through annotated HTML', () => {
    const document = createPostkitDocument([
      {
        type: 'element',
        name: 'article',
        children: [
          {
            type: 'element',
            name: 'h2',
            children: [{ type: 'text', value: 'Portable HTML' }],
          },
          {
            type: 'component',
            name: 'Callout',
            props: { title: 'Heads up', tone: 'warning' },
            children: [
              {
                type: 'element',
                name: 'p',
                children: [{ type: 'text', value: 'Keep the meaning.' }],
              },
            ],
          },
        ],
      },
    ]);

    const html = serializePostkitHtml(document, { documentElement: 'main' });
    expect(html).toContain('data-postkit-document=""');
    expect(html).toContain('data-postkit-component="Callout"');
    expect(parsePostkitHtml(html).children).toEqual(document.children);
  });

  it('serializes validated versioned JSON', () => {
    const document = parsePostkitMarkdown('# Article');
    const json = serializePostkitJson(document, { space: 2 });

    expect(JSON.parse(json)).toEqual(document);
    expect(parsePostkit(json, { format: 'json' })).toEqual(document);
  });

  it('serializes Markdown with GFM lists, tables, links, and code fences', () => {
    const document = parsePostkitMarkdown(`
## Article

- [x] Parsed
- [ ] Rendered

| Name | Value |
| --- | --- |
| Runtime | React |

\`\`\`ts filename=article.ts
const article = true
\`\`\`
    `);
    const markdown = serializePostkitMarkdown(document);
    const recovered = parsePostkitMarkdown(markdown);

    expect(markdown).toContain('- [x] Parsed');
    expect(markdown).toContain('| Name | Value |');
    expect(markdown).toContain('```ts filename=article.ts');
    expect(JSON.stringify(recovered)).toContain('"name":"thead"');
    expect(JSON.stringify(recovered)).toContain('"checked":true');
  });

  it('preserves JSON-compatible component props in non-executable MDX', () => {
    const document = createPostkitDocument([
      {
        type: 'component',
        name: 'Gallery',
        props: {
          title: 'Images',
          columns: 2,
          items: [{ src: '/image.jpg', alt: 'Image' }],
        },
        children: [],
      },
    ]);
    const mdx = serializePostkitMdx(document);
    const recovered = parsePostkit(mdx, { format: 'mdx' });

    expect(mdx).toContain('<Gallery data-postkit-props=');
    expect(mdx).not.toContain('={');
    expect(recovered).toEqual(document);
  });

  it('dispatches output formats and refuses executable HTML', () => {
    const document = parsePostkitMarkdown('Read [this](/article).');
    expect(serializePostkit(document, { format: 'markdown' })).toContain(
      '[this](/article)',
    );
    expect(() =>
      serializePostkitHtml(
        createPostkitDocument([
          { type: 'element', name: 'script', children: [] },
        ]),
      ),
    ).toThrow(/Unsafe HTML element/);
    expect(() =>
      serializePostkitHtml(
        createPostkitDocument([
          {
            type: 'element',
            name: 'p',
            attributes: { '"><script': 'bad' },
            children: [{ type: 'text', value: 'Safe text' }],
          },
        ]),
      ),
    ).not.toThrow();
    expect(
      serializePostkitHtml(
        createPostkitDocument([
          {
            type: 'element',
            name: 'p',
            attributes: { '"><script': 'bad' },
            children: [{ type: 'text', value: 'Safe text' }],
          },
        ]),
      ),
    ).not.toContain('<script');
  });

  it('serializes HTML options, safe attributes, and component carriers', () => {
    const document = createPostkitDocument([
      {
        type: 'element',
        name: 'DIV',
        attributes: {
          hidden: false,
          open: true,
          colSpan: 2,
          className: ['article', 'featured'],
          href: 'java\nscript:bad()',
          style: 'color:red',
          onClick: 'bad()',
        },
        children: [{ type: 'text', value: '<safe & escaped>' }],
      },
      {
        type: 'element',
        name: 'img',
        attributes: { src: 'https://example.com/image.png', alt: 'Image' },
        children: [],
      },
      {
        type: 'component',
        name: 'Callout',
        children: [{ type: 'text', value: 'Notice' }],
      },
    ]);

    const html = serializePostkitHtml(document, {
      annotations: false,
      documentElement: 'article',
      componentElement: (node) => (node.name === 'Callout' ? 'aside' : 'div'),
    });

    expect(html).toBe(
      '<article><div open colspan="2" className="article featured">&lt;safe &amp; escaped&gt;</div>' +
        '<img src="https://example.com/image.png" alt="Image"><aside>Notice</aside></article>',
    );
    expect(() =>
      serializePostkitHtml(
        createPostkitDocument([
          { type: 'component', name: 'invalid-name', children: [] },
        ]),
      ),
    ).toThrow(/Invalid Postkit component name/);
    expect(() =>
      serializePostkitHtml(document, { componentElement: () => 'script' }),
    ).toThrow(/Unsafe HTML element/);
  });

  it('serializes the complete Markdown block and inline vocabulary', () => {
    const document = createPostkitDocument([
      { type: 'text', value: 'Escaped * text' },
      {
        type: 'element',
        name: 'h3',
        children: [{ type: 'text', value: 'Heading' }],
      },
      {
        type: 'element',
        name: 'blockquote',
        children: [
          {
            type: 'element',
            name: 'p',
            children: [
              {
                type: 'element',
                name: 'strong',
                children: [{ type: 'text', value: 'Strong' }],
              },
              { type: 'text', value: ' and ' },
              {
                type: 'element',
                name: 'em',
                children: [{ type: 'text', value: 'emphasis' }],
              },
              { type: 'text', value: ' with ' },
              {
                type: 'element',
                name: 'del',
                children: [{ type: 'text', value: 'deletion' }],
              },
              { type: 'text', value: ' and ' },
              {
                type: 'element',
                name: 'code',
                children: [{ type: 'text', value: '`tick`' }],
              },
              { type: 'element', name: 'br', children: [] },
              {
                type: 'element',
                name: 'a',
                attributes: {
                  href: 'https://example.com/a)b',
                  title: 'A "title"',
                },
                children: [{ type: 'text', value: 'Link' }],
              },
              { type: 'text', value: ' ' },
              {
                type: 'element',
                name: 'img',
                attributes: {
                  src: '/image).png',
                  alt: 'Alt]',
                  title: 'Image',
                },
                children: [],
              },
            ],
          },
        ],
      },
      { type: 'element', name: 'hr', children: [] },
      {
        type: 'element',
        name: 'ol',
        attributes: { start: 4 },
        children: [
          {
            type: 'element',
            name: 'li',
            children: [
              {
                type: 'element',
                name: 'p',
                children: [{ type: 'text', value: 'First\ncontinued' }],
              },
            ],
          },
        ],
      },
      {
        type: 'element',
        name: 'pre',
        children: [{ type: 'text', value: '```nested\n' }],
      },
      {
        type: 'element',
        name: 'details',
        children: [{ type: 'text', value: 'Fallback' }],
      },
      {
        type: 'component',
        name: 'Callout',
        children: [{ type: 'text', value: 'Portable' }],
      },
    ]);

    const markdown = serializePostkitMarkdown(document);
    expect(markdown).toContain('Escaped \\* text');
    expect(markdown).toContain('### Heading');
    expect(markdown).toContain('> **Strong** and *emphasis*');
    expect(markdown).toContain('~~deletion~~');
    expect(markdown).toContain('`` `tick` ``');
    expect(markdown).toContain(
      '[Link](https://example.com/a\\)b "A \\"title\\"")',
    );
    expect(markdown).toContain('![Alt\\]](/image\\).png "Image")');
    expect(markdown).toContain('4. First');
    expect(markdown).toContain('````\n```nested');
    expect(markdown).toContain('<details');
    expect(markdown).toContain('data-postkit-component="Callout"');
    expect(serializePostkitMdx(document)).toContain('<Callout>');
    expect(serializePostkitMarkdown(createPostkitDocument())).toBe('');
  });

  it('handles sparse tables and missing inline link or image destinations', () => {
    const document = createPostkitDocument([
      {
        type: 'element',
        name: 'p',
        children: [
          {
            type: 'element',
            name: 'a',
            children: [{ type: 'text', value: 'Unlinked' }],
          },
          { type: 'element', name: 'img', children: [] },
        ],
      },
      { type: 'element', name: 'table', children: [] },
      {
        type: 'element',
        name: 'table',
        children: [
          {
            type: 'element',
            name: 'tr',
            children: [
              {
                type: 'element',
                name: 'th',
                children: [{ type: 'text', value: 'Name' }],
              },
              {
                type: 'element',
                name: 'th',
                children: [{ type: 'text', value: 'Value' }],
              },
            ],
          },
          {
            type: 'element',
            name: 'tr',
            children: [
              {
                type: 'element',
                name: 'td',
                children: [{ type: 'text', value: 'Only one' }],
              },
            ],
          },
        ],
      },
    ]);

    const markdown = serializePostkitMarkdown(document);
    expect(markdown).toContain('Unlinked');
    expect(markdown).toContain('| Name | Value |');
    expect(markdown).toContain('| Only one |  |');
  });

  it('validates documents and dispatches every output format', () => {
    const document = parsePostkitMarkdown('# Article');
    expect(serializePostkit(document, { format: 'html' })).toContain('<h1');
    expect(serializePostkit(document, { format: 'json' })).toContain(
      `"version":${POSTKIT_DOCUMENT_VERSION}`,
    );
    expect(serializePostkit(document, { format: 'mdx' })).toContain(
      '# Article',
    );
    expect(() =>
      serializePostkit(document, { format: 'rss' as never }),
    ).toThrow(/Unsupported Postkit output format/);
    expect(() =>
      serializePostkitJson({
        type: 'document',
        version: 2,
        children: [],
      } as unknown as Parameters<typeof serializePostkitJson>[0]),
    ).toThrow(PostkitParseError);
    expect(() =>
      serializePostkitMdx(
        createPostkitDocument([
          { type: 'component', name: 'invalid-name', children: [] },
        ]),
      ),
    ).toThrow(/Invalid Postkit component name/);
  });

  it('serializes inline component and semantic fallback branches', () => {
    const document = createPostkitDocument([
      {
        type: 'element',
        name: 'p',
        children: [
          { type: 'text', value: 'Before ' },
          {
            type: 'component',
            name: 'Badge',
            children: [{ type: 'text', value: 'portable' }],
          },
          { type: 'text', value: ' and ' },
          {
            type: 'element',
            name: 'mark',
            children: [{ type: 'text', value: 'highlighted' }],
          },
          { type: 'text', value: ' with ' },
          {
            type: 'element',
            name: 'code',
            children: [
              {
                type: 'element',
                name: 'strong',
                children: [{ type: 'text', value: 'ending`' }],
              },
            ],
          },
          { type: 'text', value: ' ' },
          {
            type: 'element',
            name: 'img',
            attributes: { src: '/plain.png' },
            children: [],
          },
        ],
      },
    ]);

    const markdown = serializePostkitMarkdown(document);
    const mdx = serializePostkitMdx(document);
    expect(markdown).toContain('data-postkit-component="Badge"');
    expect(mdx).toContain('<Badge>');
    expect(markdown).toContain('<mark data-postkit-node="mark"');
    expect(markdown).toContain('>highlighted</mark>');
    expect(markdown).toContain('`` ending` ``');
    expect(markdown).toContain('![](/plain.png)');
  });
});
