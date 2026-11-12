import {
  PostkitProvider,
  postkitChakraViews,
  type PostkitLinkProps,
} from '@postkit/chakra';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { prerenderToNodeStream } from 'react-dom/static';
import { MemoryRouter } from 'react-router';
import { createPostkitReactRouterComponents } from './create-postkit-react-router-components.js';

function PostkitLink({
  component,
  ...props
}: PostkitLinkProps & { readonly component: unknown }) {
  const Link = component as React.ComponentType<PostkitLinkProps>;
  return <Link {...props} />;
}

describe('Postkit React Router components', () => {
  it('routes internal Markdown links through React Router', () => {
    const components = createPostkitReactRouterComponents({
      link: {
        linkProps: {
          preventScrollReset: true,
        },
      },
    });
    const markup = renderToStaticMarkup(
      <PostkitProvider>
        <MemoryRouter>
          <PostkitLink
            component={components.a}
            href="/articles/hello"
            className="article-link"
          >
            Hello
          </PostkitLink>
        </MemoryRouter>
      </PostkitProvider>,
    );

    expect(markup).toContain('href="/articles/hello"');
    expect(markup).toContain('article-link');
    expect(markup).toContain('postkit-prose__a');
    expect(markup).toContain('data-discover="true"');
  });

  it('keeps external links native without requiring router context', () => {
    const components = createPostkitReactRouterComponents();

    const markup = renderToStaticMarkup(
      <PostkitProvider>
        <PostkitLink component={components.a} href="https://example.com">
          Example
        </PostkitLink>
      </PostkitProvider>,
    );

    expect(markup).toContain('href="https://example.com"');
    expect(markup).toContain('data-postkit-prose-element="a"');
    expect(markup).toContain('postkit-prose__a');
  });

  it('lets application component overrides take final precedence', () => {
    const SiteLink = ({ children }: PostkitLinkProps) => (
      <a data-site-link>{children}</a>
    );
    const components = createPostkitReactRouterComponents({
      components: {
        a: SiteLink,
      },
    });

    expect(components.a).toBe(SiteLink);
  });

  it('loads each component view on first render, with complete server HTML', async () => {
    const components = createPostkitReactRouterComponents();
    const Callout = components['Callout'] as ComponentType<
      Record<string, unknown>
    > & { readonly preload?: () => Promise<unknown> };

    // Lazy: the map doesn't import the views.
    expect(typeof Callout.preload).toBe('function');
    expect(Callout).not.toBe(postkitChakraViews['Callout']);

    // A streaming server render waits for the view.
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
    const components = createPostkitReactRouterComponents({
      components: postkitChakraViews,
    });
    expect(components['Callout']).toBe(postkitChakraViews['Callout']);
  });
});
