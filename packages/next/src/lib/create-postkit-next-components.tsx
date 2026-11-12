import {
  createPostkitLazyMdxComponents,
  createPostkitLink,
  type CreatePostkitLinkOptions,
  type PostkitLinkComponent,
  type PostkitLinkProps,
} from '@postkit/chakra';
import type { MDXComponents } from 'mdx/types';
import Link from 'next/link.js';
import type { ComponentProps } from 'react';

export type PostkitNextLinkProps = ComponentProps<typeof Link>;

export interface PostkitNextLinkOptions extends Omit<
  CreatePostkitLinkOptions<PostkitNextLinkProps>,
  'adapter'
> {
  readonly linkProps?: Omit<PostkitNextLinkProps, 'href'>;
  readonly mapLinkProps?: (
    props: PostkitLinkProps & { readonly href: string },
  ) => Omit<PostkitNextLinkProps, 'href'>;
}

export interface PostkitNextComponentsOptions {
  readonly components?: MDXComponents;
  readonly link?: PostkitNextLinkOptions;
}

function NextLinkAdapter(props: PostkitNextLinkProps) {
  return <Link {...props} />;
}

/**
 * The Next.js link for Postkit: internal links go through next/link, and
 * external URLs, hashes and downloads stay native anchors.
 */
export function createPostkitNextLink(
  options: PostkitNextLinkOptions = {},
): PostkitLinkComponent {
  const { linkProps, mapLinkProps, ...postkitLinkOptions } = options;
  return createPostkitLink<PostkitNextLinkProps>({
    ...postkitLinkOptions,
    adapter: {
      component: NextLinkAdapter,
      mapProps: (props) => ({
        ...props,
        ...linkProps,
        ...mapLinkProps?.(props),
        href: props.href,
      }),
    },
  });
}

/**
 * The MDX components for Next.js: Postkit's prose and component views, with
 * internal links through next/link. `components` take final precedence.
 *
 * Each component view loads the first time a page renders it
 * (`createPostkitLazyMdxComponents`), so a page only downloads the views its
 * content uses. The server render waits for them, so the HTML is complete,
 * and the browser keeps that HTML in place until a view arrives, so nothing
 * shifts. For a synchronous render (`renderToStaticMarkup`), pass the eager
 * views: `createPostkitNextComponents({ components: postkitChakraViews })`.
 */
export function createPostkitNextComponents(
  options: PostkitNextComponentsOptions = {},
): MDXComponents {
  const link = createPostkitNextLink(options.link);

  return {
    ...createPostkitLazyMdxComponents({ link }),
    ...options.components,
  } as MDXComponents;
}
