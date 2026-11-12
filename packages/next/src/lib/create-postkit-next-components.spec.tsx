import {
  PostkitProvider,
  postkitChakraViews,
  type PostkitLinkProps,
} from '@postkit/chakra';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { prerenderToNodeStream } from 'react-dom/static';
import { createPostkitNextComponents } from './create-postkit-next-components.js';

vi.mock('next/link.js', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    readonly href: string;
    readonly children?: React.ReactNode;
    readonly className?: string;
  }) => (
    <a href={href} className={className} data-next-link>
      {children}
    </a>
  ),
}));

function renderLink(component: unknown, props: PostkitLinkProps): string {
  const Link = component as React.ComponentType<PostkitLinkProps>;
  return renderToStaticMarkup(
    <PostkitProvider>
      <Link {...props} />
    </PostkitProvider>,
  );
}

describe('Postkit Next.js components', () => {
  it('routes internal Markdown links through next/link', () => {
    const components = createPostkitNextComponents();

    const markup = renderLink(components.a, {
      href: '/articles/hello',
      children: 'Hello',
      className: 'article-link',
    });

    expect(markup).toContain('href="/articles/hello"');
    expect(markup).toContain('postkit-prose__a');
    expect(markup).toContain('article-link');
    expect(markup).toContain('data-next-link="true"');
  });

  it('keeps external links native', () => {
    const components = createPostkitNextComponents();

    const markup = renderLink(components.a, {
      href: 'https://example.com',
      children: 'Example',
    });

    expect(markup).toContain('href="https://example.com"');
    expect(markup).toContain('data-postkit-prose-element="a"');
    expect(markup).toContain('postkit-prose__a');
  });

  it('lets application component overrides take final precedence', () => {
    const SiteLink = ({ children }: PostkitLinkProps) => (
      <a data-site-link>{children}</a>
    );
    const components = createPostkitNextComponents({
      components: {
        a: SiteLink,
      },
    });

    expect(components.a).toBe(SiteLink);
  });

  it('loads each component view on first render, with complete server HTML', async () => {
    const components = createPostkitNextComponents();
    const Callout = components['Callout'] as ComponentType<
      Record<string, unknown>
    > & { readonly preload?: () => Promise<unknown> };

    // Lazy: the map doesn't import the views.
    expect(typeof Callout.preload).toBe('function');
    expect(Callout).not.toBe(postkitChakraViews['Callout']);

    // The Pages Router waits for Suspense (`allReady`), as this render does.
    const { prelude } = await prerenderToNodeStream(
      <PostkitProvider>
        <Callout tone="tip" title="Keep the content">
          Change the renderer.
        </Callout>
      </PostkitProvider>,
    );
    let html = '';
    for await (const chunk of prelude) html += String(chunk);

    expect(html).toContain('data-postkit-component="Callout"');
    expect(html).toContain('Keep the content');
  });

  it('takes the eager views for a synchronous render', () => {
    const components = createPostkitNextComponents({
      components: postkitChakraViews,
    });
    const Callout = components['Callout'] as ComponentType<
      Record<string, unknown>
    >;

    expect(Callout).toBe(postkitChakraViews['Callout']);
    expect(
      renderToStaticMarkup(
        <PostkitProvider>
          <Callout title="Now">Body</Callout>
        </PostkitProvider>,
      ),
    ).toContain('data-postkit-component="Callout"');
  });
});
