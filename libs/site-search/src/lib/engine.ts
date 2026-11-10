import type { DocsSearchRecord } from '@chakra-docs/core';
import type { DocsSearchQuery, DocsSearchResult } from '@chakra-docs/search';
import {
  createMiniSearchEngine,
  type DocsSuggestingSearchEngine,
} from '@chakra-docs/search/minisearch';

import {
  resolveFeatured,
  toSynonymGroups,
  type SearchFeaturedConfig,
} from './featured';
import type { SiteSearchIndex } from './records';
import { diceSimilarity, editDistance, words } from './similarity';
import { createSnippet } from './text';
import {
  isSearchCollectionId,
  searchCollections,
  type SearchCollectionId,
  type SiteSearchResponse,
  type SiteSearchSuggestion,
} from './types';

/** Up to four results per group (01 §8), so a full response is at most 16. */
export const RESULTS_PER_GROUP = 4;
export const SUGGESTION_COUNT = 3;

const FUZZY_DISTANCE = 0.2;
const FUZZY_MIN_TERM_LENGTH = 4;

/** Prefix and fuzzy matching (0.2), titles over section titles over text, two per page. */
export const siteSearchEngineOptions = {
  fuzzy: { distance: FUZZY_DISTANCE, minTermLength: FUZZY_MIN_TERM_LENGTH },
  prefix: { enabled: true, lastTermOnly: true, minTermLength: 2 },
  fields: {
    title: 10,
    sectionTitle: 6,
    aliases: 6,
    synonyms: 5,
    tags: 3,
    description: 3,
    pageTitle: 1,
    text: 1,
  },
  maxResultsPerPage: 2,
};

export interface SiteSearchOptions {
  /** `content/search-synonyms.json`. */
  readonly synonyms: Readonly<Record<string, unknown>>;
  /** `content/search-featured.json`. Resolving it throws if an entry isn't published. */
  readonly featured: SearchFeaturedConfig;
}

export interface SiteSearch {
  /** The MiniSearch engine over every record. */
  readonly engine: DocsSuggestingSearchEngine;
  /** The empty-query results, resolved and validated once. */
  readonly featured: readonly DocsSearchResult[];
  /** What `/api/search` serves: featured, grouped results with snippets, or suggestions. */
  search(query: DocsSearchQuery): SiteSearchResponse;
  /** The three closest titles, for a query that found nothing. */
  suggest(
    query: string,
    collectionIds?: readonly string[],
  ): SiteSearchSuggestion[];
}

function resolveScope(
  collectionIds: readonly string[] | undefined,
): readonly SearchCollectionId[] {
  if (!collectionIds || collectionIds.length === 0) return searchCollections;
  return searchCollections.filter((id) => collectionIds.includes(id));
}

const phrase = (value: string) => words(value).join(' ');

/** A record's words as the engine sees them, camel-cased names split too (`CodeBlock`). */
function recordWords(record: DocsSearchRecord): string {
  const source = [
    record.title,
    record.sectionTitle,
    record.description,
    record.text,
    ...(record.tags ?? []),
    ...(record.aliases ?? []),
  ]
    .filter(Boolean)
    .join(' ');
  return ` ${[
    ...words(source),
    ...words(source.replace(/([a-z\d])([A-Z])/g, '$1 $2')),
  ].join(' ')} `;
}

/**
 * The site's search, created once per server process: the engine, the featured list and the
 * closest-title suggester.
 *
 * `search` groups results Components → Docs → Notes → Changelog, up to four each, and swaps
 * each result's `description` for the query's snippet. On top of the MiniSearch engine:
 * - A synonym's target page leads its group ("accordion" → Disclosure first).
 * - A typo has to keep its first letter: MiniSearch's 0.2 fuzziness lets an 8-letter word
 *   differ by two letters, so "timeline" would otherwise find "pipeline".
 */
export function createSiteSearch(
  index: SiteSearchIndex,
  options: SiteSearchOptions,
): SiteSearch {
  const synonymGroups = toSynonymGroups(options.synonyms).map((group) =>
    group.map(phrase).filter(Boolean),
  );
  const featured = resolveFeatured(options.featured, index);
  const engine = createMiniSearchEngine(index.records, {
    ...siteSearchEngineOptions,
    synonyms: synonymGroups,
  });
  const recordsById = new Map<string, DocsSearchRecord>(
    index.records.map((record) => [record.id, record]),
  );
  const wordsById = new Map<string, string>();
  const wordsOf = (record: DocsSearchRecord) => {
    let value = wordsById.get(record.id);
    if (value === undefined) {
      value = recordWords(record);
      wordsById.set(record.id, value);
    }
    return value;
  };

  /** Whether the record really contains the query: a word, a prefix, a typo or a synonym. */
  function matchesRecord(record: DocsSearchRecord, query: string): boolean {
    const text = wordsOf(record);
    const terms = words(query);
    const normalizedQuery = terms.join(' ');

    const viaSynonym = synonymGroups.some(
      (group) =>
        group.some(
          (member) => member === normalizedQuery || terms.includes(member),
        ) && group.some((member) => text.includes(` ${member} `)),
    );
    if (viaSynonym) return true;

    return terms.some((term) => {
      if (text.includes(` ${term}`)) return true; // the word, or a word it starts
      if (term.length < FUZZY_MIN_TERM_LENGTH) return false;
      const max = Math.round(term.length * FUZZY_DISTANCE);
      return text
        .split(' ')
        .some(
          (word) =>
            word.length > 0 &&
            word[0] === term[0] &&
            editDistance(word, term, max) <= max,
        );
    });
  }

  function synonymTargets(query: string): Set<string> {
    const normalized = phrase(query);
    return new Set(
      synonymGroups
        .filter(([term]) => term === normalized)
        .flatMap(([, ...targets]) => targets),
    );
  }

  // Suggestions come from page titles, searched with looser fuzziness.
  const titleRecords = index.records
    .filter((record) => record.kind === 'page')
    .map((record): DocsSearchRecord => ({
      id: record.id,
      kind: 'page',
      pageId: record.pageId,
      collectionId: record.collectionId,
      route: record.route,
      title: record.title,
      headings: [],
      text: '',
    }));
  const titleEngine = createMiniSearchEngine(titleRecords, {
    fuzzy: { distance: 0.5, minTermLength: 3 },
    prefix: { enabled: true, lastTermOnly: false, minTermLength: 2 },
    fields: { title: 1 },
    maxResultsPerPage: 1,
  });

  function suggest(
    query: string,
    collectionIds?: readonly string[],
  ): SiteSearchSuggestion[] {
    const scope = resolveScope(collectionIds);
    const inScope = titleRecords.filter(
      (record) =>
        isSearchCollectionId(record.collectionId) &&
        scope.includes(record.collectionId),
    );
    const suggestions: SiteSearchSuggestion[] = [];
    const seen = new Set<string>();
    const add = (results: readonly { title: string; route: string }[]) => {
      for (const { title, route } of results) {
        if (suggestions.length >= SUGGESTION_COUNT) return;
        if (seen.has(route)) continue;
        seen.add(route);
        suggestions.push({ title, route });
      }
    };

    // 1. MiniSearch's autoSuggest: the closest title words, each resolved to its title.
    for (const { suggestion } of titleEngine.suggest(query, 10)) {
      add(
        titleEngine.search({
          query: suggestion,
          collectionIds: [...scope],
          limit: SUGGESTION_COUNT,
        }).results,
      );
    }

    // 2. When typo distance finds fewer than three, the names that share the most letter
    //    pairs with the query, so there are always three to try. Release titles
    //    ("0.2.0 · Portable documents…") aren't names someone mistyped, so they're skipped.
    if (suggestions.length < SUGGESTION_COUNT) {
      const target = phrase(query);
      const names = inScope.filter(
        (record) => record.collectionId !== 'changelog',
      );
      add(
        (names.length > 0 ? names : inScope)
          .map((record) => ({
            record,
            score: Math.max(
              diceSimilarity(target, phrase(record.title)),
              ...words(record.title).map((word) =>
                diceSimilarity(target, word),
              ),
            ),
          }))
          .sort(
            (left, right) =>
              right.score - left.score ||
              left.record.title.localeCompare(right.record.title),
          )
          .map(({ record }) => record),
      );
    }

    return suggestions;
  }

  function search(query: DocsSearchQuery): SiteSearchResponse {
    const text = query.query.trim();
    const scope = resolveScope(query.collectionIds);

    if (!text) {
      const results = featured.filter(
        (result) =>
          isSearchCollectionId(result.collectionId) &&
          scope.includes(result.collectionId),
      );
      return {
        query: text,
        kind: 'featured',
        results:
          query.popularLimit === undefined
            ? results
            : results.slice(0, query.popularLimit),
      };
    }

    const targets = synonymTargets(text);
    const leadsGroup = (result: DocsSearchResult) =>
      targets.has(phrase(result.title)) ? 0 : 1;
    const limit = query.limit ?? RESULTS_PER_GROUP * searchCollections.length;

    const results = scope
      .flatMap((collectionId) =>
        engine
          .search({
            query: text,
            collectionIds: [collectionId],
            // Room for results the first-letter rule drops.
            limit: RESULTS_PER_GROUP * 3,
          })
          .results.filter((result) => {
            const record = recordsById.get(result.id);
            return record !== undefined && matchesRecord(record, text);
          })
          // Stable: engine order within each half.
          .sort((left, right) => leadsGroup(left) - leadsGroup(right))
          .slice(0, RESULTS_PER_GROUP),
      )
      .slice(0, limit)
      .map((result) => {
        const record = recordsById.get(result.id);
        return record
          ? { ...result, description: createSnippet(record, text) }
          : result;
      });

    if (results.length > 0) return { query: text, kind: 'results', results };
    return {
      query: text,
      kind: 'results',
      results,
      suggestions: suggest(text, query.collectionIds),
    };
  }

  return { engine, featured, search, suggest };
}
