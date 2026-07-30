import { createPostkitNextComponents } from '@postkit/next';
import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createPostkitNextComponents({
    components,
    link: {
      linkProps: { prefetch: false },
      mapLinkProps: ({ href }) => ({
        scroll: !href.startsWith('/reference/'),
      }),
    },
  });
}
