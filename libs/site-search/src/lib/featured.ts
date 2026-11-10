import type { DocsSearchResult } from '@chakra-docs/search';

import type { SiteSearchIndex } from './records';
import {
  FEATURED_JUMP_TO_TAG,
  FEATURED_POPULAR_TAG,
  isSearchCollectionId,
} from './types';

/** `content/search-featured.json`: what search shows before anything is typed (01 §8). */
export interface SearchFeaturedConfig {
  readonly jumpTo: readonly {
    readonly label: string;
    /** A site route, or `latest-release` for the newest released changelog entry. */
    readonly href: string;
    readonly group: string;
  }[];
  /** Component names, in order. */
  readonly popularComponents: readonly string[];
}

export const LATEST_RELEASE_HREF = 'latest-release';

export class SearchFeaturedError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(
      `search-featured.json has ${problems.length} entr${
        problems.length === 1 ? 'y' : 'ies'
      } that ${problems.length === 1 ? "isn't a published page" : "aren't published pages"}:\n${problems
        .map((problem) => `  - ${problem}`)
        .join('\n')}`,
    );
    this.name = 'SearchFeaturedError';
  }
}

const releaseDate = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

/**
 * The featured entries as search results, in the file's order: "Jump to", then "Popular
 * components". Every entry must resolve to a published page, or this throws a
 * `SearchFeaturedError` listing all of them, which fails the build.
 */
export function resolveFeatured(
  config: SearchFeaturedConfig,
  index: SiteSearchIndex,
): DocsSearchResult[] {
  const problems: string[] = [];
  const published = new Map(
    index.pages
      .filter((page) => page.published)
      .map((page) => [page.route, page]),
  );
  const results: DocsSearchResult[] = [];

  for (const entry of config.jumpTo) {
    if (!isSearchCollectionId(entry.group)) {
      problems.push(`"${entry.label}" has an unknown group "${entry.group}"`);
      continue;
    }

    if (entry.href === LATEST_RELEASE_HREF) {
      const latest = index.latestRelease;
      if (!latest) {
        problems.push(`"${entry.label}": there is no released changelog entry`);
        continue;
      }
      results.push({
        id: `featured:${latest.route}`,
        kind: 'page',
        collectionId: entry.group,
        route: latest.route,
        title: entry.label,
        description: `${latest.version}, ${releaseDate.format(new Date(`${latest.date}T00:00:00Z`))}.`,
        tags: [FEATURED_JUMP_TO_TAG],
      });
      continue;
    }

    const page = published.get(entry.href);
    if (!page) {
      problems.push(`"${entry.label}" → ${entry.href}`);
      continue;
    }
    if (page.collectionId !== entry.group) {
      problems.push(
        `"${entry.label}" → ${entry.href} is in ${page.collectionId}, not ${entry.group}`,
      );
      continue;
    }
    results.push({
      id: `featured:${page.route}`,
      kind: 'page',
      collectionId: page.collectionId,
      route: page.route,
      title: entry.label,
      description: page.description,
      tags: [FEATURED_JUMP_TO_TAG],
    });
  }

  for (const name of config.popularComponents) {
    const page = index.pages.find(
      (candidate) =>
        candidate.collectionId === 'components' &&
        candidate.published &&
        candidate.title === name,
    );
    if (!page) {
      problems.push(`popular component "${name}"`);
      continue;
    }
    results.push({
      id: `featured:${page.route}`,
      kind: 'page',
      collectionId: 'components',
      route: page.route,
      title: page.title,
      description: page.description,
      tags: [FEATURED_POPULAR_TAG],
    });
  }

  if (problems.length > 0) throw new SearchFeaturedError(problems);
  return results;
}

/** `content/search-synonyms.json` → the engine's synonym groups (`accordion` ↔ `Disclosure`). */
export function toSynonymGroups(
  synonyms: Readonly<Record<string, unknown>>,
): string[][] {
  return Object.entries(synonyms)
    .filter(([key]) => !key.startsWith('$'))
    .map(([term, targets]) => {
      if (
        !Array.isArray(targets) ||
        !targets.every((target) => typeof target === 'string')
      ) {
        throw new TypeError(
          `search-synonyms.json: "${term}" must list strings.`,
        );
      }
      return [term, ...targets];
    });
}

/**
 * Synonym targets that aren't a page title (a component or docs page): "every target must
 * be a real component, doc or concept" (01 §8). Returns the unknown targets.
 */
export function findUnknownSynonymTargets(
  synonyms: Readonly<Record<string, unknown>>,
  index: SiteSearchIndex,
): string[] {
  const titles = new Set(index.pages.map((page) => page.title.toLowerCase()));
  return toSynonymGroups(synonyms)
    .flatMap(([, ...targets]) => targets)
    .filter((target) => !titles.has(target.toLowerCase()));
}
