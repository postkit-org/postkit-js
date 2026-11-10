import {
  createPostkitLink,
  createPostkitMdxComponents,
  type CreatePostkitLinkOptions,
  type PostkitLinkComponent,
  type PostkitLinkProps,
} from '@postkit/chakra';
import type { MDXComponents } from 'mdx/types';
import { Link, type LinkProps } from 'react-router';

export interface PostkitReactRouterLinkOptions extends Omit<
  CreatePostkitLinkOptions<LinkProps>,
  'adapter'
> {
  readonly linkProps?: Omit<LinkProps, 'to'>;
  readonly mapLinkProps?: (
    props: PostkitLinkProps & { readonly href: string },
  ) => Omit<LinkProps, 'to'>;
}

export interface PostkitReactRouterComponentsOptions {
  readonly components?: MDXComponents;
  readonly link?: PostkitReactRouterLinkOptions;
}

function ReactRouterLinkAdapter(props: LinkProps) {
  return <Link {...props} />;
}

/**
 * The React Router link for Postkit: internal links go through React Router's Link, and
 * external URLs, hashes and downloads stay native anchors.
 */
export function createPostkitReactRouterLink(
  options: PostkitReactRouterLinkOptions = {},
): PostkitLinkComponent {
  const { linkProps, mapLinkProps, ...postkitLinkOptions } = options;
  return createPostkitLink<LinkProps>({
    ...postkitLinkOptions,
    adapter: {
      component: ReactRouterLinkAdapter,
      mapProps: ({ href, ...anchorProps }) => ({
        ...anchorProps,
        ...linkProps,
        ...mapLinkProps?.({ ...anchorProps, href }),
        to: href,
      }),
    },
  });
}

export function createPostkitReactRouterComponents(
  options: PostkitReactRouterComponentsOptions = {},
): MDXComponents {
  const link = createPostkitReactRouterLink(options.link);

  return {
    ...createPostkitMdxComponents({ link }),
    ...options.components,
  };
}
