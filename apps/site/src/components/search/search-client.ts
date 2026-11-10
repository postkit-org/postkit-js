import { createHttpSearchProvider } from '@chakra-docs/search/client';
import type { SiteSearchResponse } from '@postkit/site-search/client';

/**
 * The browser side of `/api/search` (01 §8). Created at module scope, and this module is
 * only loaded with the dialog, so nothing is requested before search first opens.
 */
const provider = createHttpSearchProvider('/api/search');

/** Recent answers, so reopening or retyping a query doesn't ask the server again. */
const cache = new Map<string, SiteSearchResponse>();
const CACHE_SIZE = 50;

export async function searchSite(
  query: string,
  collectionIds: readonly string[] | undefined,
  signal: AbortSignal,
): Promise<SiteSearchResponse> {
  const key = JSON.stringify([query, collectionIds ?? []]);
  const cached = cache.get(key);
  if (cached) return cached;

  const response = (await provider(
    { query, collectionIds },
    { signal },
  )) as SiteSearchResponse;

  cache.set(key, response);
  if (cache.size > CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return response;
}
