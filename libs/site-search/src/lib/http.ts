import {
  createFetchSearchHandler,
  type FetchSearchHandler,
} from '@chakra-docs/search/http';

import type { SiteSearch } from './engine';

/** Results change only on deploy: a minute in the browser, longer at the edge. */
export const SEARCH_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

/**
 * `GET /api/search?q=…&collection=…&limit=…`: chakra-docs' Fetch handler with its default
 * limits (128-character queries, five collections, at most 20 results) and 405 for any
 * other method. It logs nothing.
 */
export function createSiteSearchHandler(
  search: SiteSearch,
): FetchSearchHandler {
  return createFetchSearchHandler(search, {
    cacheControl: SEARCH_CACHE_CONTROL,
  });
}
