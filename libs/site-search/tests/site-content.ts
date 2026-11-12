import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  changelogEntrySchema,
  changelogVersionSlug,
  componentPageSchema,
  componentPageSlugToName,
  docsEntrySchema,
  notesEntrySchema,
} from '@postkit/content';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';

import type { SearchFeaturedConfig, SiteContentEntries } from '../src';

/**
 * The real site content, read from disk the way content-collections reads it (the same
 * Zod schemas), so the tests search what postkit.org searches.
 */
const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const contentRoot = join(workspaceRoot, 'libs', 'content');
const siteContentRoot = join(workspaceRoot, 'apps', 'site', 'src', 'content');

const matterOptions = {
  engines: { yaml: { parse: (source: string) => parseYaml(source.trim()) } },
};

function readCollection(directory: string, extensions: readonly string[]) {
  return readdirSync(join(contentRoot, directory))
    .filter((file) => extensions.some((extension) => file.endsWith(extension)))
    .sort()
    .map((file) => {
      const { data, content } = matter(
        readFileSync(join(contentRoot, directory, file), 'utf8'),
        matterOptions as never,
      );
      return {
        slug: file.replace(/\.(md|mdx)$/, ''),
        data: { ...(data as Record<string, unknown>), content },
      };
    });
}

interface ManifestComponent {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly directive?: string;
  readonly keywords?: readonly string[];
}

export function loadSiteContent(): SiteContentEntries {
  const manifest = JSON.parse(
    readFileSync(
      join(workspaceRoot, 'packages', 'chakra', 'component-manifest.json'),
      'utf8',
    ),
  ) as { components: Record<string, ManifestComponent> };

  return {
    components: Object.values(manifest.components),
    componentPages: readCollection('components', ['.md']).map(
      ({ slug, data }) => ({
        ...componentPageSchema.parse(data),
        component: componentPageSlugToName(slug),
      }),
    ),
    docs: readCollection('docs', ['.md']).map(({ slug, data }) => ({
      ...docsEntrySchema.parse(data),
      slug,
    })),
    notes: readCollection('notes', ['.md', '.mdx']).map(({ slug, data }) => ({
      ...notesEntrySchema.parse(data),
      slug,
    })),
    changelog: readCollection('changelog', ['.md']).map(({ data }) => {
      const entry = changelogEntrySchema.parse(data);
      return { ...entry, slug: changelogVersionSlug(entry.version) };
    }),
  };
}

export function loadSiteSearchConfig(): {
  synonyms: Record<string, unknown>;
  featured: SearchFeaturedConfig;
} {
  const read = (file: string) =>
    JSON.parse(readFileSync(join(siteContentRoot, file), 'utf8'));
  return {
    synonyms: read('search-synonyms.json'),
    featured: read('search-featured.json'),
  };
}
