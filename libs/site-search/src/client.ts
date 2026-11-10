// Browser-safe pieces for the search dialog (PK-041): types, grouping and highlighting.
// No MiniSearch and no records.
export {
  FEATURED_JUMP_TO_TAG,
  FEATURED_POPULAR_TAG,
  isSearchCollectionId,
  searchCollections,
  type SearchCollectionId,
  type SiteSearchResponse,
  type SiteSearchResult,
  type SiteSearchSuggestion,
} from './lib/types';
export { highlightSegments, type HighlightSegment } from './lib/highlight';
export {
  groupSearchResults,
  type SearchResultGroup,
  type SearchResultGroupId,
} from './lib/groups';
