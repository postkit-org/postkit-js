import { renderToStaticMarkup } from 'react-dom/server';
import {
  createPostkitLink,
  isPostkitInternalHref,
  type PostkitLinkProps,
} from './link.js';
import { createPostkitMdxComponents } from './mdx-components.js';

describe('Postkit links', () => {
  it('recognizes portable internal destinations', () => {
    expect(isPostkitInternalHref('/articles/hello')).toBe(true);
    expect(isPostkitInternalHref('../hello')).toBe(true);
    expect(isPostkitInternalHref('?preview=true')).toBe(true);
    expect(isPostkitInternalHref('articles/hello')).toBe(true);

    expect(isPostkitInternalHref('#introduction')).toBe(false);
    expect(isPostkitInternalHref('https://example.com')).toBe(false);
    expect(isPostkitInternalHref('//cdn.example.com/file')).toBe(false);
    expect(isPostkitInternalHref('mailto:hello@example.com')).toBe(false);
  });

  it('maps internal destinations through a framework adapter', () => {
    function RouterLink({
      to,
      children,
      className,
    }: {
      readonly to: string;
      readonly children?: PostkitLinkProps['children'];
      readonly className?: string;
    }) {
      return (
        <a data-router-destination={to} className={className}>
          {children}
        </a>
      );
    }

    const Link = createPostkitLink({
      adapter: {
        component: RouterLink,
        mapProps: ({ href, children, className }) => ({
          to: href,
          children,
          className,
        }),
      },
    });

    expect(
      renderToStaticMarkup(
        <Link href="/articles/hello" className="article-link">
          Hello
        </Link>,
      ),
    ).toBe(
      '<a data-router-destination="/articles/hello" class="article-link">Hello</a>',
    );
  });

  it('leaves hashes, external links, downloads, and explicit targets native', () => {
    const RouterLink = () => <span>routed</span>;
    const Link = createPostkitLink({
      adapter: {
        component: RouterLink,
        mapProps: () => ({}),
      },
    });

    expect(renderToStaticMarkup(<Link href="#details">Details</Link>)).toBe(
      '<a href="#details">Details</a>',
    );
    expect(
      renderToStaticMarkup(
        <Link href="https://example.com/article">External</Link>,
      ),
    ).toBe('<a href="https://example.com/article">External</a>');
    expect(
      renderToStaticMarkup(
        <Link href="/article.pdf" download>
          Download
        </Link>,
      ),
    ).toBe('<a href="/article.pdf" download="">Download</a>');
    expect(
      renderToStaticMarkup(
        <Link href="/article" target="_blank">
          New window
        </Link>,
      ),
    ).toContain('<a href="/article" target="_blank">');
  });

  it('can harden external web links opened in a new tab', () => {
    const Link = createPostkitLink({ openExternalInNewTab: true });

    expect(
      renderToStaticMarkup(
        <Link href="https://example.com" rel="author">
          Example
        </Link>,
      ),
    ).toBe(
      '<a href="https://example.com" rel="author noopener noreferrer" target="_blank">Example</a>',
    );
  });

  it('lets site component overrides take final precedence in the MDX map', () => {
    const SiteLink = ({ children }: PostkitLinkProps) => (
      <a data-site-link>{children}</a>
    );
    const components = createPostkitMdxComponents({
      components: {
        a: SiteLink,
        h2: ({ children }: { readonly children?: React.ReactNode }) => (
          <h2 className="site-heading">{children}</h2>
        ),
      },
    });

    expect(components.a).toBe(SiteLink);
    expect(components.h2).toBeDefined();
    expect(components.Audio).toBeDefined();
    expect(components.AppearsOn).toBeDefined();
    expect(components.LinkPreview).toBeDefined();
    expect(components.ShareActions).toBeDefined();
    expect(components.SocialPost).toBeDefined();
  });
});
