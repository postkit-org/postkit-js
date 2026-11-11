import {
  createPostkitLink,
  createPostkitLazyMdxComponents,
  type CreatePostkitLinkOptions,
  type PostkitLinkComponent,
  type PostkitLinkProps,
} from '@postkit/chakra';
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

/**
 * The TanStack Router link for Postkit: internal links go through TanStack Router's Link, and
 * external URLs, hashes and downloads stay native anchors.
 */
export function createPostkitTanStackRouterLink(
  options: PostkitTanStackRouterLinkOptions = {},
): PostkitLinkComponent {
  const { linkProps, mapLinkProps, ...postkitLinkOptions } = options;
  return createPostkitLink<PostkitTanStackLinkProps>({
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
}

/**
 * The MDX components for TanStack Router: Postkit's prose and component views,
 * with internal links through TanStack Router's Link. `components` take final
 * precedence.
 *
 * Each component view loads the first time a page renders it
 * (`createPostkitLazyMdxComponents`), so a page only downloads the views its
 * content uses. A streaming server render waits for them, so the HTML is
 * complete, and the browser keeps that HTML in place until a view arrives.
 * For a synchronous render (`renderToStaticMarkup`), pass the eager views:
 * `createPostkitTanStackRouterComponents({ components: postkitChakraViews })`.
 */
export function createPostkitTanStackRouterComponents(
  options: PostkitTanStackRouterComponentsOptions = {},
): MDXComponents {
  const link = createPostkitTanStackRouterLink(options.link);

  return {
    ...createPostkitLazyMdxComponents({ link }),
    ...options.components,
  } as MDXComponents;
}
