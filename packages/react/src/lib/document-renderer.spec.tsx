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
