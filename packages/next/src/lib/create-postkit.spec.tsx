import { chakra, type PostkitLinkProps } from '@postkit/chakra';
import { article } from '@postkit/react/kits';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createPostkit } from './create-postkit.js';

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

describe('createPostkit for Next.js', () => {
  it('sets the link to next/link and keeps the rest of createPostkit', () => {
    const postkit = createPostkit({ renderer: chakra, kits: [article] });
    const Link = postkit.mdxComponents['a'] as ComponentType<PostkitLinkProps>;

    const markup = renderToStaticMarkup(
      <postkit.Provider>
        <Link href="/articles/hello">Hello</Link>
      </postkit.Provider>,
    );
    expect(markup).toContain('data-next-link="true"');
    expect(markup).toContain('postkit-prose__a');
    expect(postkit.definitions.map(({ name }) => name)).toContain('Callout');
  });

  it('uses a link component when given one', () => {
    const SiteLink = (props: PostkitLinkProps) => <a data-site {...props} />;
    const postkit = createPostkit({ kits: [article], link: SiteLink });
    expect(postkit.mdxComponents['a']).toBe(SiteLink);
  });
});
