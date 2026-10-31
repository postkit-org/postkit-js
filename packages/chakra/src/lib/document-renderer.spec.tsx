// @vitest-environment node

import { defaultSystem } from '@chakra-ui/react';
import { parsePostkit, parsePostkitHtml } from '@postkit/core';
import { renderToStaticMarkup } from 'react-dom/server';

import { DocumentRenderer } from './document-renderer.js';
import { PostkitProvider } from './provider.js';

function render(renderer: React.ReactNode): string {
  return renderToStaticMarkup(
    <PostkitProvider system={defaultSystem}>{renderer}</PostkitProvider>,
  );
}

describe('DocumentRenderer', () => {
  it.each([
    '<p as="script" src="https://example.test/payload.js" />',
    '<div as="iframe" srcDoc="&lt;script>alert(1)&lt;/script>" />',
  ])(
    'does not allow MDX attributes to change the rendered element: %s',
    (source) => {
      const markup = render(
        <DocumentRenderer document={parsePostkit(source, { format: 'mdx' })} />,
      );
      expect(markup).not.toMatch(/<(script|iframe)\b|srcDoc=/i);
    },
  );

  it('filters polymorphism from feed annotations and preserves safe content', () => {
    const document = parsePostkitHtml(`<div data-postkit-component="Prose"
      data-postkit-props='{"as":"script","asChild":true,"src":"https://example.test/payload.js","srcDoc":"unsafe","position":"fixed","title":"Safe"}'>Readable</div>`);
    const markup = render(<DocumentRenderer document={document} />);
    expect(markup).not.toMatch(/<script\b|srcDoc=|asChild|position:fixed/i);
    expect(markup).toContain('Readable');
    expect(markup).toContain('title="Safe"');
  });

  it('allowlists JSON element attributes without losing semantic metadata', () => {
    const document = parsePostkit(
      {
        type: 'document',
        version: 1,
        children: [
          {
            type: 'element',
            name: 'a',
            attributes: {
              as: 'iframe',
              asChild: true,
              srcDoc: 'unsafe',
              HREF: 'javascript:bad()',
              href: ['javascript:bad()'],
              position: 'fixed',
              title: 'Safe',
              'aria-label': 'Article',
            },
            children: [{ type: 'text', value: 'Read' }],
          },
        ],
      },
      { format: 'json' },
    );
    const markup = render(<DocumentRenderer document={document} />);
    expect(markup).not.toMatch(/<iframe\b|srcDoc=|javascript:|position:fixed/i);
    expect(markup).toContain('title="Safe"');
    expect(markup).toContain('aria-label="Article"');
  });

  it.each(['constructor', '__proto__', 'toString'])(
    'does not invoke inherited registry members: %s',
    (name) => {
      const document = parsePostkit(
        {
          type: 'document',
          version: 1,
          children: [
            {
              type: 'component',
              name,
              children: [{ type: 'text', value: 'Fallback' }],
            },
          ],
        },
        { format: 'json' },
      );
      expect(render(<DocumentRenderer document={document} />)).toContain(
        'Fallback',
      );
    },
  );

  it('maps semantic HTML through Chakra-backed prose primitives', () => {
    const document = parsePostkitHtml(`
      <article>
        <h2>Feed title</h2>
        <p>Body copy.</p>
        <img src="https://example.com/photo.jpg" alt="Photo">
        <ol><li>First</li></ol>
      </article>
    `);
    const markup = render(<DocumentRenderer document={document} />);

    expect(markup).toContain('data-postkit-component="Prose"');
    expect(markup).toContain('data-postkit-document=""');
    expect(markup).toContain('data-postkit-node="h2"');
    expect(markup).toContain('data-postkit-prose-element="h2"');
    expect(markup).toContain('data-postkit-prose-element="img"');
    expect(markup).toContain('data-postkit-prose-element="ol"');
    expect(markup).toContain('src="https://example.com/photo.jpg"');

    const recovered = parsePostkitHtml(markup);
    expect(recovered.children).toEqual(document.children);
  });

  it('allows applications to replace generic semantic components', () => {
    const document = parsePostkitHtml(
      '<img src="https://example.com/photo.jpg" alt="Photo">',
    );
    function FeedImage({ alt }: { readonly alt?: string }) {
      return <span data-feed-image="">{alt}</span>;
    }
    const markup = render(
      <DocumentRenderer document={document} components={{ img: FeedImage }} />,
    );

    expect(markup).toContain('data-feed-image=""');
    expect(markup).toContain('Photo');
    expect(markup).not.toContain('<img');
  });

  it('renders safe annotated components and preserves reconstruction props', () => {
    const document = parsePostkit(
      '<Callout title="Heads up" tone="warning">\n\nRead this.\n\n</Callout>',
      { format: 'mdx' },
    );
    const markup = render(<DocumentRenderer document={document} />);

    expect(markup).toContain('data-postkit-component="Callout"');
    expect(markup).toContain('data-postkit-version="1"');
    expect(markup).toContain('data-postkit-props=');
    expect(markup).toContain('Heads up');
    expect(markup).toContain('Read this.');
  });

  it('unwraps unknown nodes by default without creating arbitrary DOM tags', () => {
    const document = parsePostkit(
      {
        type: 'document',
        version: 1,
        children: [
          {
            type: 'component',
            name: 'RemoteWidget',
            props: { dangerouslySetInnerHTML: { __html: '<script />' } },
            children: [{ type: 'text', value: 'Readable fallback' }],
          },
        ],
      },
      { format: 'json' },
    );
    const markup = render(<DocumentRenderer document={document} />);

    expect(markup).toContain('Readable fallback');
    expect(markup).not.toContain('RemoteWidget');
    expect(markup).not.toContain('script');
  });

  it('filters executable element props from JSON documents at render time', () => {
    const document = parsePostkit(
      {
        type: 'document',
        version: 1,
        children: [
          {
            type: 'element',
            name: 'a',
            attributes: {
              href: 'java\tscript:alert(1)',
              onClick: 'alert(1)',
            },
            children: [{ type: 'text', value: 'Read safely' }],
          },
        ],
      },
      { format: 'json' },
    );
    const markup = render(<DocumentRenderer document={document} />);

    expect(markup).toContain('Read safely');
    expect(markup).not.toContain('javascript:');
    expect(markup).not.toContain('script:alert');
    expect(markup).not.toContain('onClick');
  });
});
