import { chakra, type PostkitLinkProps } from '@postkit/chakra';
import { article } from '@postkit/react/kits';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createPostkit } from './create-postkit.js';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
  }: {
    readonly to: string;
    readonly children?: React.ReactNode;
  }) => (
    <a data-tanstack-link data-to={to}>
      {children}
    </a>
  ),
}));

function renderProseLink(
  postkit: ReturnType<typeof createPostkit>,
  props: PostkitLinkProps,
): string {
  const Provider = postkit.Provider as ComponentType<Record<string, unknown>>;
  const Link = postkit.mdxComponents['a'] as ComponentType<PostkitLinkProps>;
  return renderToStaticMarkup(
    <Provider>
      <Link {...props} />
    </Provider>,
  );
}

describe('createPostkit for TanStack Router', () => {
  it('routes internal links through TanStack Router by default', () => {
    const postkit = createPostkit({ renderer: chakra, kits: [article] });

    const markup = renderProseLink(postkit, {
      href: '/articles/hello',
      children: 'Hello',
    });

    expect(markup).toContain('data-tanstack-link');
    expect(markup).toContain('data-to="/articles/hello"');
  });

  it('uses a link component as given', () => {
    function SiteLink({ href, children }: PostkitLinkProps) {
      return (
        <a data-site-link href={href}>
          {children}
        </a>
      );
    }
    const postkit = createPostkit({
      renderer: chakra,
      kits: [article],
      link: SiteLink,
    });

    const markup = renderProseLink(postkit, {
      href: '/articles/hello',
      children: 'Hello',
    });

    expect(markup).toContain('data-site-link');
    expect(markup).not.toContain('data-tanstack-link');
  });
});
