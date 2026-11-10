import componentManifest from '@postkit/chakra/component-manifest.json';
import {
  buildSearchIndex,
  createSiteSearch,
  toSearchContent,
  type SearchFeaturedConfig,
  type SiteSearch,
  type SiteSearchIndex,
} from '@postkit/site-search';
import {
  allChangelogEntries,
  allComponentPages,
  allDocsEntries,
  allNotesEntries,
} from 'content-collections';

import searchFeatured from '../content/search-featured.json';
import searchSynonyms from '../content/search-synonyms.json';
import { slugifyHeading } from './headings';

/**
 * Site search's records (PK-040, 01 §8), built from the content collections and the
 * component manifest. Server only: `pages/api/search.ts` and the home page's
 * `getStaticProps` (the build-time check) import it. Drafts follow the site's visibility rule (left out of production).
 */
const includeDrafts = process.env.NODE_ENV !== 'production';

let index: SiteSearchIndex | null = null;
let siteSearch: SiteSearch | null = null;

export function getSearchIndex(): SiteSearchIndex {
  index ??= buildSearchIndex(
    toSearchContent({
      components: Object.values(componentManifest.components),
      componentPages: allComponentPages,
      docs: allDocsEntries,
      notes: allNotesEntries,
      changelog: allChangelogEntries,
    }),
    { includeDrafts, slugifyHeading },
  );
  return index;
}

/**
 * The engine, created once per server process. Throws a `SearchFeaturedError` when a
 * `search-featured.json` entry isn't a published page.
 */
export function getSiteSearch(): SiteSearch {
  siteSearch ??= createSiteSearch(getSearchIndex(), {
    synonyms: searchSynonyms,
    featured: searchFeatured as SearchFeaturedConfig,
  });
  return siteSearch;
}

/**
 * Search's build-time check (01 §8): creating the engine resolves search-featured.json and
 * throws if an entry isn't a published page. The home page's `getStaticProps` calls it, so
 * a bad entry fails `next build` (an API route alone isn't evaluated at build time).
 */
export function assertSearchReady(): void {
  getSiteSearch();
}
