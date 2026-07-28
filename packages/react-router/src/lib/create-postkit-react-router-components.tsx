import {
  createPostkitLink,
  createPostkitMdxComponents,
  type CreatePostkitLinkOptions,
  type PostkitLinkProps,
} from '@postkit/react';
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

export function createPostkitReactRouterComponents(
  options: PostkitReactRouterComponentsOptions = {},
): MDXComponents {
  const { linkProps, mapLinkProps, ...postkitLinkOptions } = options.link ?? {};
  const link = createPostkitLink<LinkProps>({
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

  return {
    ...createPostkitMdxComponents({ link }),
    ...options.components,
  };
}
