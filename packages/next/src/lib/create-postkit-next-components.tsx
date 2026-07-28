import {
  createPostkitLink,
  createPostkitMdxComponents,
  type CreatePostkitLinkOptions,
  type PostkitLinkProps,
} from '@postkit/react';
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

export function createPostkitNextComponents(
  options: PostkitNextComponentsOptions = {},
): MDXComponents {
  const { linkProps, mapLinkProps, ...postkitLinkOptions } = options.link ?? {};
  const link = createPostkitLink<PostkitNextLinkProps>({
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

  return {
    ...createPostkitMdxComponents({ link }),
    ...options.components,
  };
}
