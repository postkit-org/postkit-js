import {
  createPostkitLink,
  createPostkitLazyMdxComponents,
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

/**
 * The MDX components for React Router: Postkit's prose and component views,
 * with internal links through React Router's Link. `components` take final
 * precedence.
 *
 * Each component view loads the first time a page renders it
 * (`createPostkitLazyMdxComponents`), so a page only downloads the views its
 * content uses. A streaming server render waits for them, so the HTML is
 * complete, and the browser keeps that HTML in place until a view arrives.
 * For a synchronous render (`renderToStaticMarkup`), pass the eager views:
 * `createPostkitReactRouterComponents({ components: postkitChakraViews })`.
 */
export function createPostkitReactRouterComponents(
  options: PostkitReactRouterComponentsOptions = {},
): MDXComponents {
  const link = createPostkitReactRouterLink(options.link);

  return {
    ...createPostkitLazyMdxComponents({ link }),
    ...options.components,
  } as MDXComponents;
}
