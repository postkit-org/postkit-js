import { parsePostkitHtml } from '@postkit/core';

import { renderFeedContent, stripMdxComments } from './content-html.js';

const base = {
  siteUrl: 'https://postkit.org',
  url: 'https://postkit.org/changelog/0-2-0',
  title: 'Postkit 0.2.0',
  summary: 'The summary.',
};

describe('renderFeedContent', () => {
  it('renders Markdown with Postkit directives through @postkit/core', () => {
    const content = renderFeedContent(
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

    expect(content.kind).toBe('full');
    // The repeated title is dropped; readers show the item title already.
    expect(content.html).not.toContain('<h1');
    expect(content.html).toContain('href="https://postkit.org/docs/mdx"');
    expect(content.html).toContain('href="https://example.com/a"');
    expect(content.html).toContain('data-postkit-component="Callout"');
    expect(content.html).toContain('<strong');
    expect(content.html).toContain('const a = 1 &lt; 2;');

    // The output is core's portable HTML: it reads back as the same Callout.
    const document = parsePostkitHtml(content.html);
    const callout = document.children.find((node) => node.type === 'component');
    expect(callout).toMatchObject({
      type: 'component',
      name: 'Callout',
      props: { title: 'Review before upgrading', tone: 'warning' },
    });
  });

  // The site compiles changelog Markdown as MDX too, so inline HTML has to be MDX-valid.
  it('keeps inline HTML safe', () => {
    const content = renderFeedContent(
      `Hello <a href="javascript:alert(1)" onclick="alert(1)">x</a> <img src="/a.png" alt="A" onerror="alert(1)" />`,
      { ...base, format: 'markdown' },
    );
    expect(content.html).not.toMatch(/javascript:|onclick|onerror/);
    expect(content.html).toContain('src="https://postkit.org/a.png"');
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
    const content = renderFeedContent(
      `{/* TODO: a maintainer note */}

<Callout tone="tip" title="Keep the content">
  Change the renderer, not the article.
</Callout>
`,
      { ...base, format: 'mdx' },
    );
    expect(content.kind).toBe('full');
    expect(content.html).not.toContain('TODO');
    expect(content.html).toContain('Change the renderer, not the article.');
  });

  it('falls back to the summary and a link for prop-only components', () => {
    const content = renderFeedContent(
      `Intro.

<KeyTakeaway title="In short" items='["One", "Two"]' />
`,
      { ...base, format: 'mdx' },
    );
    expect(content).toEqual({
      kind: 'summary',
      html: '<p>The summary.</p><p><a href="https://postkit.org/changelog/0-2-0">Read it on postkit.org</a></p>',
      reason: expect.stringContaining('KeyTakeaway'),
    });
  });
});

describe('stripMdxComments', () => {
  it('leaves fenced code alone', () => {
    expect(
      stripMdxComments('{/* a */}\nText {/* b */}\n```jsx\n{/* c */}\n```\n'),
    ).toBe('Text \n```jsx\n{/* c */}\n```\n');
  });
});
