import {
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
});
