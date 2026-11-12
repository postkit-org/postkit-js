import { chakra, type PostkitLinkProps } from '@postkit/chakra';
import { article } from '@postkit/react/kits';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';

import { createPostkit } from './create-postkit.js';

function renderProseLink(
  postkit: ReturnType<typeof createPostkit>,
  props: PostkitLinkProps,
): string {
  const Provider = postkit.Provider as ComponentType<Record<string, unknown>>;
  const Link = postkit.mdxComponents['a'] as ComponentType<PostkitLinkProps>;
  return renderToStaticMarkup(
    <MemoryRouter>
      <Provider>
        <Link {...props} />
      </Provider>
    </MemoryRouter>,
  );
}

describe('createPostkit for React Router', () => {
  it('routes internal links through React Router by default', () => {
    const postkit = createPostkit({
      renderer: chakra,
      kits: [article],
      link: { linkProps: { preventScrollReset: true } },
    });

    const markup = renderProseLink(postkit, {
      href: '/articles/hello',
      children: 'Hello',
    });

    expect(markup).toContain('href="/articles/hello"');
    // React Router's Link marks the anchors it renders.
    expect(markup).toContain('data-discover="true"');
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
    expect(markup).not.toContain('data-discover');
  });
});
