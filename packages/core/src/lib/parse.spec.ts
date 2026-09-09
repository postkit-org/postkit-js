import {
  POSTKIT_DOCUMENT_VERSION,
  PostkitParseError,
  parsePostkit,
  parsePostkitHtml,
  parsePostkitJson,
  parsePostkitMarkdown,
} from '../index.js';

describe('Postkit document parsing', () => {
  it('keeps Markdown phrasing inside its enclosing inline HTML', () => {
    expect(parsePostkitMarkdown('Hello <strong>bold</strong> world.')).toEqual(
      parsePostkitHtml('<p>Hello <strong>bold</strong> world.</p>'),
    );
    expect(
      parsePostkitMarkdown(
        'Hi <span>**bold** and [link][ref] and `<b>`</span>.\n\n[ref]: /read',
      ),
    ).toEqual(
      parsePostkitHtml(
        '<p>Hi <span><strong>bold</strong> and <a href="/read">link</a> and <code>&lt;b&gt;</code></span>.</p>',
      ),
    );
  });

  it('repairs unmatched inline tags and ignores comments without losing text', () => {
    expect(parsePostkitMarkdown('Hi <em>there')).toEqual(
      parsePostkitHtml('<p>Hi <em>there</em></p>'),
    );
    expect(parsePostkitMarkdown('Hi <!-- comment -->there')).toEqual(
      parsePostkitHtml('<p>Hi there</p>'),
    );
  });

  it('sanitizes the complete mixed HTML stream', () => {
    const document = parsePostkitMarkdown(
      'Before <script>bad()</script><span onclick="bad()">**safe**</span><a href="javascript:bad()">link</a> after.',
    );
    const output = JSON.stringify(document);
    expect(output).not.toContain('bad()');
    expect(output).not.toContain('onclick');
    expect(output).toContain('"name":"strong"');
    expect(output).toContain('safe');
  });

  it('keeps nested portable components while honoring the component allowlist', () => {
    const source =
      '<span>**<i data-postkit-component="Callout" data-postkit-prop-title="Notice">body</i>**</span>';
    expect(JSON.stringify(parsePostkitMarkdown(source))).toContain(
      '"type":"component","name":"Callout"',
    );
    expect(
      JSON.stringify(
        parsePostkitMarkdown(source, { allowComponent: () => false }),
      ),
    ).not.toContain('"type":"component"');
  });

  it.each([false, true])(
    'resolves reference links and images (mdx=%s)',
    (mdx) => {
      const document = parsePostkitMarkdown(
        '[**Docs**][GUIDE] ![Logo][asset]\n\n[guide]: /docs "Guide title"\n[asset]: /logo.png "Logo title"',
        { mdx },
      );
      expect(document.children).toEqual([
        {
          type: 'element',
          name: 'p',
          children: [
            {
              type: 'element',
              name: 'a',
              attributes: { href: '/docs', title: 'Guide title' },
              children: [
                {
                  type: 'element',
                  name: 'strong',
                  children: [{ type: 'text', value: 'Docs' }],
                },
              ],
            },
            { type: 'text', value: ' ' },
            {
              type: 'element',
              name: 'img',
              attributes: {
                src: '/logo.png',
                alt: 'Logo',
                title: 'Logo title',
              },
              children: [],
            },
          ],
        },
      ]);
    },
  );

  it('resolves collapsed and shortcut references with first-definition precedence', () => {
    const document = parsePostkitMarkdown(
      '[guide][] [guide] ![logo][] ![logo]\n\n> [guide]: /first\n\n[guide]: /second\n[logo]: /logo.png',
    );
    const output = JSON.stringify(document);
    expect(output.match(/"href":"\/first"/g)).toHaveLength(2);
    expect(output.match(/"src":"\/logo.png"/g)).toHaveLength(2);
    expect(output).not.toContain('/second');
  });

  it('leaves unresolved reference syntax readable', () => {
    expect(parsePostkitMarkdown('[missing] ![missing]').children).toEqual([
      {
        type: 'element',
        name: 'p',
        children: [{ type: 'text', value: '[missing] ![missing]' }],
      },
    ]);
  });

  it('normalizes safe semantic HTML and strips presentation and executable markup', () => {
    const document = parsePostkitHtml(`
      <article class="feed-theme" style="color:red">
        <h2 onclick="bad()">Hello</h2>
        <p>Read <a href="javascript:bad()">this</a> or <a href="article.html">that</a>.</p>
        <img src="https://example.com/photo.jpg" alt="Photo">
        <script>alert('bad')</script>
      </article>
    `);

    expect(document.type).toBe('document');
    expect(JSON.stringify(document)).not.toContain('feed-theme');
    expect(JSON.stringify(document)).not.toContain('javascript:');
    expect(JSON.stringify(document)).not.toContain('alert');
    expect(JSON.stringify(document)).toContain('article.html');
    expect(document.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'element', name: 'article' }),
      ]),
    );
  });

  it('recovers annotated Postkit components and literal props', () => {
    const document = parsePostkitHtml(
      '<aside data-postkit-component="Callout" data-postkit-version="1" data-postkit-prop-variant="warning"><p>Careful.</p></aside>',
    );

    expect(document.children[0]).toEqual({
      type: 'component',
      name: 'Callout',
      props: { variant: 'warning' },
      children: [
        {
          type: 'element',
          name: 'p',
          children: [{ type: 'text', value: 'Careful.' }],
        },
      ],
    });
  });

  it('treats the Postkit prose renderer as a transparent document wrapper', () => {
    const document = parsePostkitHtml(
      '<div data-postkit-component="Prose" data-postkit-prose=""><p>Article body.</p></div>',
    );

    expect(document.children).toEqual([
      {
        type: 'element',
        name: 'p',
        children: [{ type: 'text', value: 'Article body.' }],
      },
    ]);
  });

  it('parses GFM Markdown into the same semantic document model', () => {
    const document = parsePostkitMarkdown(`
## Article

- [x] Parsed
- [ ] Rendered

| Name | Value |
| --- | --- |
| Image | ![Alt](https://example.com/image.png) |
    `);

    expect(JSON.stringify(document)).toContain('"name":"h2"');
    expect(JSON.stringify(document)).toContain('"checked":true');
    expect(JSON.stringify(document)).toContain('"name":"table"');
    expect(JSON.stringify(document)).toContain('https://example.com/image.png');
  });

  it('accepts literal MDX components but rejects executable expressions', () => {
    const document = parsePostkit(
      '<Callout variant="info">\n\nHello\n\n</Callout>',
      {
        format: 'mdx',
      },
    );
    expect(document.children[0]).toEqual({
      type: 'component',
      name: 'Callout',
      props: { variant: 'info' },
      children: [
        {
          type: 'element',
          name: 'p',
          children: [{ type: 'text', value: 'Hello' }],
        },
      ],
    });

    expect(() =>
      parsePostkit('<Callout variant={value}>Hello</Callout>', {
        format: 'mdx',
      }),
    ).toThrow(PostkitParseError);
  });

  it('validates versioned Postkit JSON before returning a document', () => {
    const document = parsePostkitJson(
      JSON.stringify({
        type: 'document',
        version: POSTKIT_DOCUMENT_VERSION,
        children: [
          {
            type: 'element',
            name: 'img',
            attributes: { src: 'https://example.com/image.png', alt: 'Image' },
            children: [],
          },
        ],
      }),
    );
    expect(document.children).toHaveLength(1);
    expect(() =>
      parsePostkitJson({ type: 'document', version: 99, children: [] }),
    ).toThrow(/version 1/);
  });

  it('dispatches supported input formats and rejects invalid dispatch input', () => {
    expect(parsePostkit('<p>HTML</p>', { format: 'html' }).children[0]).toEqual(
      expect.objectContaining({ type: 'element', name: 'p' }),
    );
    expect(
      parsePostkit('**Markdown**', { format: 'markdown' }).children[0],
    ).toEqual(expect.objectContaining({ type: 'element', name: 'p' }));
    expect(() => parsePostkit({}, { format: 'html' })).toThrow(
      /HTML input must be a string/,
    );
    expect(() => parsePostkit({}, { format: 'markdown' })).toThrow(
      /Markdown and MDX input must be strings/,
    );
    expect(() =>
      parsePostkit('', {
        format: 'rss' as never,
      }),
    ).toThrow(/Unsupported Postkit input format/);
  });

  it('validates every JSON node and value boundary', () => {
    const document = parsePostkitJson({
      type: 'document',
      version: POSTKIT_DOCUMENT_VERSION,
      children: [
        { type: 'text', value: 'Intro' },
        {
          type: 'element',
          name: 'ol',
          attributes: {
            start: 2,
            reversed: true,
            tokens: ['one', 2],
          },
          children: [],
        },
        {
          type: 'component',
          name: 'Chart',
          props: {
            legend: true,
            values: [1, 2],
            options: { compact: false },
          },
          children: [],
        },
      ],
    });

    expect(document.children).toHaveLength(3);
    expect(() => parsePostkitJson('{')).toThrow(/Invalid Postkit JSON/);

    const invalidChildren = [
      null,
      { type: 'text', value: 1 },
      { type: 'element', name: '', children: [] },
      { type: 'element', name: 'p', children: 'invalid' },
      {
        type: 'element',
        name: 'p',
        attributes: { value: { nested: true } },
        children: [],
      },
      {
        type: 'element',
        name: 'p',
        attributes: { value: ['valid', false] },
        children: [],
      },
      { type: 'component', name: '', children: [] },
      {
        type: 'component',
        name: 'Chart',
        props: { value: Number.NaN },
        children: [],
      },
      { type: 'unknown', children: [] },
    ];

    for (const child of invalidChildren) {
      expect(() =>
        parsePostkitJson({
          type: 'document',
          version: POSTKIT_DOCUMENT_VERSION,
          children: [child],
        }),
      ).toThrow(PostkitParseError);
    }
  });

  it('normalizes extended Markdown and safe MDX syntax', () => {
    const document = parsePostkitMarkdown(`
# Heading

> **Strong**, *emphasized*, ~~deleted~~, and \`inline\`\\
> next line

---

3. Third
4. Fourth

[Link](https://example.com "Title") and ![Alt](image.png "Image")

<mark>HTML</mark>
    `);
    const serialized = JSON.stringify(document);

    for (const name of [
      'blockquote',
      'strong',
      'em',
      'del',
      'code',
      'br',
      'hr',
      'ol',
      'a',
      'img',
      'mark',
    ]) {
      expect(serialized).toContain(`"name":"${name}"`);
    }
    expect(serialized).toContain('"start":3');

    const mdx = parsePostkitMarkdown(
      '<section open data-postkit-hidden="ignored">Body</section>\n\n<Allowed enabled />\n\n<Denied />',
      {
        mdx: true,
        allowComponent: (name) => name === 'Allowed',
      },
    );
    const serializedMdx = JSON.stringify(mdx);
    expect(serializedMdx).toContain('"name":"section"');
    expect(serializedMdx).toContain('"open":true');
    expect(mdx.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'component',
          name: 'Allowed',
          props: { enabled: true },
        }),
      ]),
    );
    expect(serializedMdx).not.toContain('Denied');
    expect(() =>
      parsePostkitMarkdown('<Allowed {...props} />', { mdx: true }),
    ).toThrow(/spread attributes/);
    expect(() =>
      parsePostkitMarkdown('export const value = 1', { mdx: true }),
    ).toThrow(/Executable MDX expressions/);
  });

  it('applies HTML element, component, URL, and annotation policies', () => {
    const document = parsePostkitHtml(
      `
      <custom-element><b>Unwrapped</b></custom-element>
      <drop-me>Removed</drop-me>
      <safe-extra id="kept">Allowed</safe-extra>
      <a href="mailto:hello@example.com">Mail</a>
      <img src="data:text/html,bad" alt="Bad source">
      <div
        data-postkit-component="Callout"
        data-postkit-prop-count="2"
        data-postkit-prop-enabled="true"
        data-postkit-prop-empty="null"
        data-postkit-props='{"nested":{"safe":true}}'
      >Annotated</div>
      <div data-postkit-component="Blocked">Plain content</div>
    `,
      {
        unknownElements: 'drop',
        allowedElements: ['safe-extra'],
        allowComponent: (name) => name !== 'Blocked',
      },
    );
    const serialized = JSON.stringify(document);

    expect(serialized).not.toContain('Unwrapped');
    expect(serialized).not.toContain('Removed');
    expect(serialized).not.toContain('data:text/html');
    expect(serialized).toContain('safe-extra');
    expect(serialized).toContain('mailto:hello@example.com');
    expect(document.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'component',
          name: 'Callout',
          props: {
            count: 2,
            enabled: true,
            empty: null,
            nested: { safe: true },
          },
        }),
      ]),
    );
    expect(serialized).not.toContain('"name":"Blocked"');
  });

  it('preserves readable HTML fallbacks and alternate annotations safely', () => {
    const overflowingNumber = '9'.repeat(400);
    const document = parsePostkitHtml(`
      <!-- comments do not enter the portable document -->
      <unknown-wrapper>Readable fallback</unknown-wrapper>
      <a href="tel:+15551234567" rel="nofollow sponsored">Call</a>
      <a href="https://example.com/article">Secure link</a>
      <img src="/relative-image.png" alt="Relative image">
      <div data-postkit-component="Callout">No props</div>
      <div
        data-postkit-node="Nested.Card"
        data-postkit-props='{"__proto__":"ignored","constructor":"ignored","prototype":"ignored","kept":1}'
        data-postkit-prop-enabled="false"
        data-postkit-prop-huge="${overflowingNumber}"
      >Annotated</div>
      <div data-postkit-component="Callout" data-postkit-props="not-json">Malformed hint</div>
    `);

    const serialized = JSON.stringify(document);
    expect(serialized).toContain('Readable fallback');
    expect(serialized).toContain('tel:+15551234567');
    expect(serialized).toContain('nofollow');
    expect(serialized).toContain('/relative-image.png');
    expect(document.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'component',
          name: 'Callout',
          children: [{ type: 'text', value: 'No props' }],
        }),
        expect.objectContaining({
          type: 'component',
          name: 'Nested.Card',
          props: expect.objectContaining({
            enabled: false,
            kept: 1,
          }),
        }),
      ]),
    );
    expect(serialized).not.toContain('"constructor":"ignored"');
    expect(serialized).not.toContain('"prototype":"ignored"');
  });

  it('reconstructs safe Markdown and MDX fallback forms', () => {
    const markdown = parsePostkitMarkdown(`
\`\`\`
plain fence
\`\`\`

- First paragraph

  Second paragraph

| Header |
| --- |

[Reference][postkit]

[postkit]: https://example.com
    `);
    const serializedMarkdown = JSON.stringify(markdown);
    expect(serializedMarkdown).toContain('plain fence');
    expect(serializedMarkdown).toContain('"spread":true');
    expect(serializedMarkdown).toContain('"name":"table"');
    expect(serializedMarkdown).toContain('Reference');

    const mdx = parsePostkitMarkdown(
      `
<>Fragment content</>

<section data-postkit-props='{"count":2,"enabled":false,"label":"safe","nested":{"kept":true}}' />

<Allowed />

<Allowed constructor="ignored" data-postkit-props="42" />
      `,
      { mdx: true },
    );
    const serializedMdx = JSON.stringify(mdx);
    expect(serializedMdx).toContain('Fragment content');
    expect(serializedMdx).toContain('"count":2');
    expect(serializedMdx).toContain('"enabled":false');
    expect(serializedMdx).toContain('"label":"safe"');
    expect(serializedMdx).not.toContain('"nested"');
    expect(serializedMdx).not.toContain('constructor');
    expect(mdx.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'component',
          name: 'Allowed',
          children: [],
        }),
      ]),
    );
  });
});
