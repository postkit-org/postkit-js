import { PostkitProvider, type PostkitLinkProps } from '@postkit/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPostkitTanStackRouterComponents } from './create-postkit-tanstack-router-components.js';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
    className,
  }: {
    readonly to: string;
    readonly params?: unknown;
    readonly children?: React.ReactNode;
    readonly className?: string;
  }) => (
    <a
      data-tanstack-link
      data-to={to}
      data-params={params ? JSON.stringify(params) : undefined}
      className={className}
    >
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

describe('Postkit TanStack Router components', () => {
  it('routes internal Markdown links through TanStack Router', () => {
    const components = createPostkitTanStackRouterComponents();

    const markup = renderLink(components.a, {
      href: '/articles/hello',
      children: 'Hello',
      className: 'article-link',
    });

    expect(markup).toContain('data-tanstack-link="true"');
    expect(markup).toContain('data-to="/articles/hello"');
    expect(markup).toContain('postkit-prose__a');
    expect(markup).toContain('article-link');
  });

  it('maps portable content URLs into parameterized routes', () => {
    const components = createPostkitTanStackRouterComponents({
      link: {
        mapLinkProps: ({ href }) => ({
          to: '/articles/$slug',
          params: {
            slug: href.split('/').at(-1),
          },
        }),
      },
    });

    expect(
      renderLink(components.a, {
        href: '/articles/hello',
        children: 'Hello',
      }),
    ).toContain(
      'data-to="/articles/$slug" data-params="{&quot;slug&quot;:&quot;hello&quot;}"',
    );
  });

  it('keeps external links native', () => {
    const components = createPostkitTanStackRouterComponents();

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
    const components = createPostkitTanStackRouterComponents({
      components: {
        a: SiteLink,
      },
    });

    expect(components.a).toBe(SiteLink);
  });
});
