import { createPostkitTanStackRouterComponents } from '@postkit/tanstack-router';

export const mdxComponents = createPostkitTanStackRouterComponents({
  link: {
    linkProps: { preload: 'intent' },
    mapLinkProps: ({ href }) => {
      const match = /^\/articles\/([^/]+)$/.exec(href);

      return match
        ? {
            to: '/articles/$slug',
            params: { slug: match[1] },
          }
        : {};
    },
  },
});
