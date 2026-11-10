import { createPostkitNextComponents } from '@postkit/next';
import type { MDXComponents } from 'mdx/types';
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote';
import type { ComponentType, ReactNode } from 'react';

import { headingText, slugifyHeading } from '../../lib/headings';

/** Headings land below the sticky header (56px) with 24px to spare when jumped to. */
const HEADING_SCROLL_MARGIN = 'calc({sizes.header} + 24px)';

interface HeadingProps {
  readonly id?: string;
  readonly children?: ReactNode;
  readonly [prop: string]: unknown;
}

/**
 * Wraps a Postkit prose heading so it gets an `id` from its text (`slugifyHeading`), the
 * same id `extractHeadings` gives the TOC. An authored `id` wins.
 */
function withHeadingId(Base: ComponentType<HeadingProps>, element: string) {
  function SiteMdxHeading({ id, children, ...props }: HeadingProps) {
    const resolvedId =
      id ?? (slugifyHeading(headingText(children)) || undefined);
    return (
      <Base {...props} id={resolvedId} scrollMarginTop={HEADING_SCROLL_MARGIN}>
        {children}
      </Base>
    );
  }
  SiteMdxHeading.displayName = `SiteMdx.${element}`;
  return SiteMdxHeading;
}

const postkitComponents = createPostkitNextComponents({
  // Internal links go through next/link (Postkit's Next adapter).
  link: { linkProps: { prefetch: false } },
});

/**
 * The site's MDX component map: every Postkit component and prose element, internal links
 * through `next/link`, and `h2`/`h3`s with slug ids. Code blocks highlight through
 * `siteCodeBlockAdapter` (`lib/code-block-adapter.ts`), which `_app` hands to
 * `PostkitProvider`, so it applies here and to any `CodeBlock` on the page.
 */
export const siteMdxComponents: MDXComponents = {
  ...postkitComponents,
  h2: withHeadingId(postkitComponents.h2 as ComponentType<HeadingProps>, 'h2'),
  h3: withHeadingId(postkitComponents.h3 as ComponentType<HeadingProps>, 'h3'),
};

export interface MdxContentProps {
  /** The result of `serialize` from `next-mdx-remote/serialize` (made in `getStaticProps`). */
  readonly source: MDXRemoteSerializeResult;
  /** Per-page additions or overrides, merged over `siteMdxComponents`. */
  readonly components?: MDXComponents;
}

/**
 * The one way pages render serialized MDX. Pair it with `extractHeadings(entry.content)` on
 * the server to feed `Toc`: the ids match.
 */
export function MdxContent({ source, components }: MdxContentProps) {
  return (
    <MDXRemote
      {...source}
      components={
        components ? { ...siteMdxComponents, ...components } : siteMdxComponents
      }
    />
  );
}
