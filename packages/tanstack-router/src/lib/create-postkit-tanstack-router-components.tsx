import {
  createPostkitLink,
  createPostkitMdxComponents,
  type CreatePostkitLinkOptions,
  type PostkitLinkProps,
} from '@postkit/react';
import { Link, type CreateLinkProps } from '@tanstack/react-router';
import type { MDXComponents } from 'mdx/types';
import type { ComponentType } from 'react';

export type PostkitTanStackLinkProps = Omit<
  CreateLinkProps,
  'children' | 'to'
> &
  Omit<PostkitLinkProps, 'href'> & {
    readonly to: string;
  };

export interface PostkitTanStackRouterLinkOptions extends Omit<
  CreatePostkitLinkOptions<PostkitTanStackLinkProps>,
  'adapter'
> {
  readonly linkProps?: Partial<
    Omit<PostkitTanStackLinkProps, 'children' | 'to'>
  >;
  readonly mapLinkProps?: (
    props: PostkitLinkProps & { readonly href: string },
  ) => Partial<PostkitTanStackLinkProps>;
}

export interface PostkitTanStackRouterComponentsOptions {
  readonly components?: MDXComponents;
  readonly link?: PostkitTanStackRouterLinkOptions;
}

const TanStackLink = Link as unknown as ComponentType<PostkitTanStackLinkProps>;

function TanStackRouterLinkAdapter(props: PostkitTanStackLinkProps) {
  return <TanStackLink {...props} />;
}

export function createPostkitTanStackRouterComponents(
  options: PostkitTanStackRouterComponentsOptions = {},
): MDXComponents {
  const { linkProps, mapLinkProps, ...postkitLinkOptions } = options.link ?? {};
  const link = createPostkitLink<PostkitTanStackLinkProps>({
    ...postkitLinkOptions,
    adapter: {
      component: TanStackRouterLinkAdapter,
      mapProps: ({ href, ...anchorProps }) => {
        const mappedProps = mapLinkProps?.({ ...anchorProps, href });

        return {
          ...anchorProps,
          ...linkProps,
          ...mappedProps,
          to: mappedProps?.to ?? href,
        };
      },
    },
  });

  return {
    ...createPostkitMdxComponents({ link }),
    ...options.components,
  };
}
