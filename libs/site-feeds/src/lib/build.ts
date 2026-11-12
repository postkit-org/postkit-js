import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createSiteFeed, type SiteFeedArtifacts } from './feeds.js';
import {
  loadChangelogFeedItems,
  loadNotesFeedItems,
  type LoadedFeedItem,
} from './sources.js';
import { validateAtom, validateJsonFeed, validateRss } from './validate.js';

export const DEFAULT_SITE_URL = 'https://postkit.org';

/** `NEXT_PUBLIC_SITE_URL` without a trailing slash, or production's origin (as the site reads it). */
export function resolveSiteUrl(
  value: string | undefined = process.env['NEXT_PUBLIC_SITE_URL'],
): string {
  return (value || DEFAULT_SITE_URL).replace(/\/+$/, '');
}

export type SiteFeedName = 'notes' | 'changelog';

/** Served paths (01 §3). The site's `<link rel="alternate">` tags point at these. */
export const siteFeedFiles = {
  rss: { extension: '.xml', type: 'application/rss+xml' },
  atom: { extension: '.atom', type: 'application/atom+xml' },
  json: { extension: '.json', type: 'application/feed+json' },
} as const;

export interface BuildSiteFeedsOptions {
  /** `libs/content`: holds `changelog/` and `notes/`. */
  readonly contentDirectory: string;
  readonly siteUrl: string;
  readonly nodeEnv?: string;
}

export interface BuiltSiteFeed {
  readonly name: SiteFeedName;
  readonly items: readonly LoadedFeedItem[];
  readonly artifacts: SiteFeedArtifacts;
}

/** Builds both feeds in memory and validates all six documents; throws on any problem. */
export function buildSiteFeeds(
  options: BuildSiteFeedsOptions,
): BuiltSiteFeed[] {
  const { siteUrl } = options;
  const sources = [
    {
      name: 'notes' as const,
      title: 'Postkit notes',
      description: 'Releases, guides and how people publish with Postkit.',
      items: loadNotesFeedItems(
        join(options.contentDirectory, 'notes'),
        options,
      ),
    },
    {
      name: 'changelog' as const,
      title: 'Postkit changelog',
      description:
        'Every Postkit release, and what it means for your site: new components, theming, documents, adapters and tooling.',
      items: loadChangelogFeedItems(
        join(options.contentDirectory, 'changelog'),
        options,
      ),
    },
  ];

  return sources.map((source) => {
    const artifacts = createSiteFeed(source.items, {
      title: source.title,
      description: source.description,
      homePageUrl: `${siteUrl}/${source.name}`,
      feedBaseUrl: `${siteUrl}/feeds/${source.name}`,
    });
    const problems = [
      ...validateRss(artifacts.rss).map((problem) => `RSS: ${problem}`),
      ...validateAtom(artifacts.atom).map((problem) => `Atom: ${problem}`),
      ...validateJsonFeed(artifacts.json).map((problem) => `JSON: ${problem}`),
    ];
    if (problems.length > 0) {
      throw new Error(
        `The ${source.name} feed is invalid:\n- ${problems.join('\n- ')}`,
      );
    }
    return { name: source.name, items: source.items, artifacts };
  });
}

/** Builds, validates and writes the six feed files to `outDirectory` (replacing it). */
export function writeSiteFeeds(
  options: BuildSiteFeedsOptions & { readonly outDirectory: string },
): BuiltSiteFeed[] {
  const feeds = buildSiteFeeds(options);
  rmSync(options.outDirectory, { recursive: true, force: true });
  mkdirSync(options.outDirectory, { recursive: true });
  for (const feed of feeds) {
    for (const [format, { extension }] of Object.entries(siteFeedFiles)) {
      writeFileSync(
        join(options.outDirectory, `${feed.name}${extension}`),
        feed.artifacts[format as keyof SiteFeedArtifacts],
      );
    }
  }
  return feeds;
}
