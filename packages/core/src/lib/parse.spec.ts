import {
  POSTKIT_DOCUMENT_VERSION,
  PostkitParseError,
  parsePostkit,
  parsePostkitHtml,
  parsePostkitJson,
  parsePostkitMarkdown,
} from '../index.js';

describe('Postkit document parsing', () => {
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
});
