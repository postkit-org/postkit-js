import type { DocsSearchResult } from '@chakra-docs/search';

import {
  FEATURED_JUMP_TO_TAG,
  FEATURED_POPULAR_TAG,
  searchCollections,
  type SearchCollectionId,
  type SiteSearchResponse,
} from './types';

export type SearchResultGroupId = SearchCollectionId | 'jump-to' | 'popular';

export interface SearchResultGroup {
  readonly id: SearchResultGroupId;
  readonly label: string;
  readonly results: readonly DocsSearchResult[];
}

const collectionLabels: Record<SearchCollectionId, string> = {
  components: 'Components',
  docs: 'Docs',
  notes: 'Notes',
  changelog: 'Changelog',
};

/**
 * The dialog's groups, in display order. Featured responses become "Jump to" and "Popular
 * components" (PhoneSearch); typed queries become Components, Docs, Notes and Changelog,
 * up to `perGroup` each (SiteSearch). Empty groups are left out.
 */
export function groupSearchResults(
  response: Pick<SiteSearchResponse, 'kind' | 'results'>,
  perGroup = 4,
): SearchResultGroup[] {
  if (response.kind === 'featured') {
    return [
      {
        id: 'jump-to' as const,
        label: 'Jump to',
        results: response.results.filter((result) =>
          result.tags?.includes(FEATURED_JUMP_TO_TAG),
        ),
      },
      {
        id: 'popular' as const,
        label: 'Popular components',
        results: response.results.filter((result) =>
          result.tags?.includes(FEATURED_POPULAR_TAG),
        ),
      },
    ].filter((group) => group.results.length > 0);
  }

  return searchCollections
    .map((id) => ({
      id,
      label: collectionLabels[id],
      results: response.results
        .filter((result) => result.collectionId === id)
        .slice(0, perGroup),
    }))
    .filter((group) => group.results.length > 0);
}
