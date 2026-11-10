import type { ChakraDocsConfig } from '@chakra-docs/chakra';
import { DocsLink } from '@chakra-docs/next/link';

import { DOCS_STICKY_TOP } from '../../lib/docs-theme';

/**
 * The site's chakra-docs settings (`DocsProvider`): internal links through `next/link`,
 * the boards' labels, and the nav and TOC stuck under the header. The TOC reads each
 * heading's own `scroll-margin-top` (set by `MdxContent`) to decide the active section.
 */
export const siteDocsConfig: ChakraDocsConfig = {
  linkComponent: DocsLink,
  labels: {
    onThisPage: 'On this page',
    previousPage: 'Previous',
    nextPage: 'Next',
  },
  layout: {
    stickyTop: DOCS_STICKY_TOP,
    scrollMarginTop: DOCS_STICKY_TOP,
  },
};
