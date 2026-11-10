import { DocsPagination } from '@chakra-docs/chakra';
import type { DocsNavItem, DocsPage } from '@chakra-docs/core';
import { useMemo } from 'react';

export interface DocsPagerProps {
  readonly nav: DocsNavItem[];
  readonly page: DocsPage;
}

/** Home leads the docs: the first page's "Previous" is Home, as on SiteDocsIntro. */
const home: DocsNavItem = { id: 'home', title: 'Home', href: '/' };

/**
 * Prev/next at the bottom of a docs page, in nav order (chakra-docs' `DocsPagination`,
 * restyled as the boards' cards in `docs-theme.ts`). "Soon" items have no page and are
 * skipped.
 */
export function DocsPager({ nav, page }: DocsPagerProps) {
  const pagerNav = useMemo(() => [home, ...nav], [nav]);
  return (
    <DocsPagination
      nav={pagerNav}
      page={page}
      slotProps={{ 'aria-label': 'Previous and next page' }}
    />
  );
}
