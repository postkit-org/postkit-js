import type { DocsSearchResponse, DocsSearchResult } from '@chakra-docs/search';

/** The four result groups, in the order the dialog shows them (01 §8). */
export const searchCollections = [
  'components',
  'docs',
  'notes',
  'changelog',
] as const;

export type SearchCollectionId = (typeof searchCollections)[number];

export function isSearchCollectionId(
  value: unknown,
): value is SearchCollectionId {
  return (
    typeof value === 'string' &&
    (searchCollections as readonly string[]).includes(value)
  );
}

/** Tags on the empty-query results, naming the featured group each belongs to. */
export const FEATURED_JUMP_TO_TAG = 'featured:jump-to';
export const FEATURED_POPULAR_TAG = 'featured:popular';

/** A closest-title suggestion for a query with no results (SiteSearchEmpty). */
export interface SiteSearchSuggestion {
  readonly title: string;
  readonly route: string;
}

/**
 * `/api/search`'s body: chakra-docs' `{ query, results }` plus what the boards need on top.
 * - `kind: 'featured'` for an empty query (the curated "Jump to" and "Popular components").
 * - `suggestions` when a typed query finds nothing.
 * Each result's `description` is the query's snippet, ready to highlight.
 */
export interface SiteSearchResponse extends DocsSearchResponse {
  readonly kind: 'featured' | 'results';
  readonly suggestions?: readonly SiteSearchSuggestion[];
}

export type SiteSearchResult = DocsSearchResult;
