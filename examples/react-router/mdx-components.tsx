import { createPostkitReactRouterComponents } from '@postkit/react-router';

export const mdxComponents = createPostkitReactRouterComponents({
  link: {
    linkProps: { prefetch: 'intent' },
    mapLinkProps: ({ href }) => ({
      preventScrollReset: href.startsWith('?'),
    }),
  },
});
