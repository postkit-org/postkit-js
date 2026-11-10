import { parsePostkit, parsePostkitHtml } from '@postkit/core';

import { relativeUrlsInHtml } from './validate.js';
import {
  renderFeedContent,
  stripMdxComments,
  toPostkitMdx,
} from './content-html.js';
import { parseXml } from './xml.js';

const base = {
  siteUrl: 'https://postkit.org',
  title: 'Postkit 0.2.0',
};

describe('renderFeedContent', () => {
  it('renders Markdown with Postkit directives through @postkit/core', () => {
    const html = renderFeedContent(
      `# Postkit 0.2.0

Intro with a [relative link](/docs/mdx) and an [absolute one](https://example.com/a).

:::postkit-callout{title="Review before upgrading" tone="warning"}
Upgrade related packages **together**.
:::

\`\`\`tsx
const a = 1 < 2;
\`\`\`
`,
      { ...base, format: 'markdown' },
    );

    // The repeated title is dropped; readers show the item title already.
    expect(html).not.toContain('<h1');
    expect(html).toContain('href="https://postkit.org/docs/mdx"');
    expect(html).toContain('href="https://example.com/a"');
    expect(html).toContain('data-postkit-component="Callout"');
    // The title is reader text, not only an annotation.
    expect(html).toContain(
      '<p data-postkit-part="title"><strong>Review before upgrading</strong></p>',
    );
    expect(html).toContain('<strong');
    expect(html).toContain('const a = 1 &lt; 2;');

    // The output is core's portable HTML: it reads back as the same Callout.
    const document = parsePostkitHtml(html);
    const callout = document.children.find((node) => node.type === 'component');
    expect(callout).toMatchObject({
      type: 'component',
      name: 'Callout',
      props: { title: 'Review before upgrading', tone: 'warning' },
    });
  });

  // The site compiles changelog Markdown as MDX too, so inline HTML has to be MDX-valid.
  it('keeps inline HTML safe', () => {
    const html = renderFeedContent(
      `Hello <a href="javascript:alert(1)" onclick="alert(1)">x</a> <img src="/a.png" alt="A" onerror="alert(1)" />`,
      { ...base, format: 'markdown' },
    );
    expect(html).not.toMatch(/javascript:|onclick|onerror/);
    expect(html).toContain('src="https://postkit.org/a.png"');
  });

  it('fails closed on content core cannot make safe', () => {
    expect(() =>
      renderFeedContent('Hello <script>alert(1)</script>', {
        ...base,
        format: 'markdown',
      }),
    ).toThrow();
    expect(() =>
      renderFeedContent('Hello {alert(1)}', { ...base, format: 'mdx' }),
    ).toThrow();
  });

  it('renders MDX components with children, without maintainer comments', () => {
    const html = renderFeedContent(
      `{/* TODO: a maintainer note */}

<Callout tone="tip" title="Keep the content">
  Change the renderer, not the article.
</Callout>
`,
      { ...base, format: 'mdx' },
    );
    expect(html).not.toContain('TODO');
    expect(html).toContain('Keep the content');
    expect(html).toContain('Change the renderer, not the article.');
  });

  it('renders components whose content is only in props', () => {
    const source = `Intro.

<KeyTakeaway title="In short" items='["One", "Two"]' />

<Steps items='[{"title": "Install", "description": "Add the package."}]' />

<PullQuote quote="Plain text stays." attribution="The handbook" />

<Terminal command="npm install @postkit/core" output="added 1 package" />

<CodeBlock filename="a.ts" language="ts" code="const a = 1 < 2;" />

<LinkPreview href="https://example.com/post" title="A post" description="About it." />

<Figure src="/media/a.png" alt="A chart" caption="Downloads by week." />
`;
    const html = renderFeedContent(source, { ...base, format: 'mdx' });
    for (const text of [
      '<p data-postkit-part="title"><strong>In short</strong></p>',
      '<li data-postkit-part="item">One</li>',
      '<strong>Install</strong>',
      'Add the package.',
      '<blockquote data-postkit-part="quote"><p>Plain text stays.</p></blockquote>',
      '— The handbook',
      'npm install @postkit/core',
      'added 1 package',
      '<span data-postkit-part="filename">a.ts</span>',
      '<code class="language-ts">const a = 1 &lt; 2;</code>',
      'href="https://example.com/post"',
      'About it.',
      'src="https://postkit.org/media/a.png"',
      'Downloads by week.',
    ]) {
      expect(html).toContain(text);
    }
    expect(relativeUrlsInHtml(html)).toEqual([]);
    // Well-formed: the HTML parses as XML once void elements are closed, and it
    // reads back as the same document.
    expect(() =>
      parseXml(
        `<div>${html.replace(/<(img|br|hr)([^>]*)>/g, '<$1$2/>')}</div>`,
      ),
    ).not.toThrow();
    expect(parsePostkitHtml(html)).toEqual(
      parsePostkit(toPostkitMdx(source, 'mdx'), { format: 'mdx' }),
    );
  });

  it('shows the public fallback of an AudienceBoundary', () => {
    const html = renderFeedContent(
      `<AudienceBoundary audience="members" fallback="For members.">
  Secret.
</AudienceBoundary>
`,
      { ...base, format: 'mdx' },
    );
    expect(html).toContain('For members.');
    expect(html).not.toContain('Secret.');
  });
});

describe('stripMdxComments', () => {
  it('leaves fenced code alone', () => {
    expect(
      stripMdxComments('{/* a */}\nText {/* b */}\n```jsx\n{/* c */}\n```\n'),
    ).toBe('Text \n```jsx\n{/* c */}\n```\n');
  });
});
