import type { DocsFeedEntry } from '@chakra-docs/core';
import { createFeedArtifacts } from '@chakra-docs/feed';

/** One feed item, already resolved: absolute URLs and rendered HTML. */
export interface SiteFeedItem {
  /** The absolute item URL, also its id. */
  readonly url: string;
  readonly title: string;
  readonly summary: string;
  /** `YYYY-MM-DD`. */
  readonly date: string;
  readonly author: string;
  readonly tags?: readonly string[];
  /** Safe HTML for the item body (from `@postkit/core`). */
  readonly contentHtml: string;
}

export interface SiteFeedOptions {
  readonly title: string;
  readonly description: string;
  /** The page the feed mirrors (`https://postkit.org/notes`); also the feed's Atom id. */
  readonly homePageUrl: string;
  /** The feed URLs without an extension: `https://postkit.org/feeds/notes`. */
  readonly feedBaseUrl: string;
  readonly language?: string;
}

export interface SiteFeedArtifacts {
  /** RSS 2.0, served at `{feedBaseUrl}.xml`. */
  readonly rss: string;
  /** Atom, served at `{feedBaseUrl}.atom`. */
  readonly atom: string;
  /** JSON Feed 1.1, served at `{feedBaseUrl}.json`. */
  readonly json: string;
}

const CONTENT_NAMESPACE = 'http://purl.org/rss/1.0/modules/content/';

/** The same escaping `@chakra-docs/feed` applies, so we can find its output. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(value: string): string {
  return `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

/** Inserts `addition` after the one occurrence of `anchor`; throws if it isn't exactly one. */
function insertAfterOnce(source: string, anchor: string, addition: string) {
  const first = source.indexOf(anchor);
  if (first === -1 || source.indexOf(anchor, first + 1) !== -1) {
    throw new Error(
      `Expected exactly one "${anchor}" in the @chakra-docs/feed output. Its format may have changed.`,
    );
  }
  const end = first + anchor.length;
  return `${source.slice(0, end)}${addition}${source.slice(end)}`;
}

function toFeedEntry(item: SiteFeedItem): DocsFeedEntry {
  return {
    id: item.url,
    url: item.url,
    title: item.title,
    description: item.summary,
    date: item.date,
    author: item.author,
    tags: item.tags ? [...item.tags] : undefined,
  };
}

/**
 * Builds the RSS, Atom and JSON Feed documents with `@chakra-docs/feed`, then adds each item's
 * full HTML, which its `DocsFeedEntry` input has no field for: RSS gets `<content:encoded>`,
 * Atom `<content type="html">` and JSON Feed `content_html`. The summary stays in RSS
 * `<description>`, Atom `<summary>` and JSON Feed `summary`/`content_text`.
 */
export function createSiteFeed(
  items: readonly SiteFeedItem[],
  options: SiteFeedOptions,
): SiteFeedArtifacts {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.url)) throw new Error(`Duplicate feed item ${item.url}`);
    ids.add(item.url);
  }

  const entries = items.map(toFeedEntry);
  const artifacts = (extension: string) =>
    createFeedArtifacts(entries, {
      title: options.title,
      description: options.description,
      siteUrl: options.homePageUrl,
      feedUrl: `${options.feedBaseUrl}${extension}`,
      language: options.language ?? 'en',
    });
  const contentById = new Map(
    items.map((item) => [item.url, item.contentHtml]),
  );

  let rss = insertAfterOnce(
    artifacts('.xml').rss,
    '<rss version="2.0"',
    ` xmlns:content="${CONTENT_NAMESPACE}"`,
  );
  let atom = artifacts('.atom').atom;
  for (const [id, html] of contentById) {
    rss = insertAfterOnce(
      rss,
      `<guid>${escapeXml(id)}</guid>`,
      `\n      <content:encoded>${cdata(html)}</content:encoded>`,
    );
    atom = insertAfterOnce(
      atom,
      `<id>${escapeXml(id)}</id>`,
      `\n    <content type="html">${escapeXml(html)}</content>`,
    );
  }

  const jsonFeed = JSON.parse(artifacts('.json').json) as {
    items: { id: string; content_html?: string }[];
  };
  for (const item of jsonFeed.items) {
    item.content_html = contentById.get(item.id);
  }

  return {
    rss,
    atom,
    json: `${JSON.stringify(jsonFeed, null, 2)}\n`,
  };
}
