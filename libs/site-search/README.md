# @postkit/site-search

postkit.org's search (PK-040, handoff 01 §8): the records, the `@chakra-docs/search`
MiniSearch engine and `/api/search`'s handler. No React and no Next, so it's unit-tested
against the real content.

- `toSearchContent` + `buildSearchIndex` turn the content collections and the component
  manifest into records: one per component, docs section (`h2`, plus each page's intro),
  note and changelog entry, in the collections `components`, `docs`, `notes` and
  `changelog`. Drafts are left out unless `includeDrafts`; `upcoming` releases stay in.
  The same content always builds the same records.
- `createSiteSearch` builds the engine once (fuzzy 0.2, prefix, title-weighted fields, two
  results per page, the synonyms file) and resolves `search-featured.json`, throwing a
  `SearchFeaturedError` if an entry isn't a published page. Its `search` returns the
  featured list for an empty query, grouped results with snippets (four per group), or
  three closest-title suggestions when nothing matches.
- `createSiteSearchHandler` is the Fetch handler `/api/search` serves (chakra-docs'
  limits, 405 for anything but GET, a short `Cache-Control`).
- `@postkit/site-search/client` is the browser-safe part for the dialog: types, grouping
  and match highlighting.

Run `npm run site:typecheck` (typecheck, test and lint for the site libraries).
