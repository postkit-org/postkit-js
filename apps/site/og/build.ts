import { readdirSync, readFileSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

import {
  changelogEntrySchema,
  changelogVersionSlug,
  componentPageSchema,
  contentSlugSchema,
  docsEntrySchema,
  getLatestChangelogRelease,
  notesEntrySchema,
  selectDocsEntries,
  selectVisibleNotes,
} from '@postkit/content';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';

import { componentEntries, componentNameToSlug } from '../src/lib/components';
import {
  changelogShareImage,
  componentShareImage,
  docsShareImage,
  homeShareImage,
  noteShareImage,
  type ShareImage,
} from '../src/lib/share-images';
import { SITE_URL } from '../src/lib/site-url';
import { loadShareImageFonts } from './fonts';
import { ShareImageRenderer } from './render';
import type { ShareImageAside } from './share-image';

/**
 * Builds every route's share image (05 §1, PK-061): home, every component, every published
 * docs page, every note and every changelog entry, as `public/og/{kind}/{slug}.png`. The pages
 * point at the same paths through `src/lib/share-images.ts`.
 *
 * Content is read straight from `libs/content` with the same schemas and visibility rules as
 * the site (content-collections only runs inside `next build`).
 */

interface ShareImageJob {
  readonly image: ShareImage;
  readonly aside: ShareImageAside | null;
  readonly latest: boolean;
}

function readEntries<Schema extends z.ZodType>(
  directory: string,
  extensions: readonly string[],
  schema: Schema,
): { readonly slug: string; readonly data: z.infer<Schema> }[] {
  return readdirSync(directory)
    .filter((file) => extensions.includes(extname(file)))
    .sort()
    .map((file) => {
      const source = readFileSync(join(directory, file), 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
      if (!match) throw new TypeError(`${file} has no frontmatter.`);
      const parsed = schema.safeParse({
        ...(parseYaml(match[1]) as Record<string, unknown>),
        content: source.slice(match[0].length),
      });
      if (!parsed.success) {
        throw new TypeError(
          `${join(directory, file)}: ${parsed.error.message}`,
        );
      }
      return {
        slug: contentSlugSchema.parse(file.slice(0, -extname(file).length)),
        data: parsed.data,
      };
    });
}

const imageTypes: Readonly<Record<string, string>> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/** A note cover for Satori: `null` for the gradient, a data URL for a file in `public/`. */
async function coverSource(
  cover: string,
  publicDirectory: string,
): Promise<string | null> {
  if (cover === 'gradient') return null;
  if (/^https?:\/\//.test(cover)) return cover;
  const type = imageTypes[extname(cover).toLowerCase()];
  if (!type) throw new TypeError(`Unsupported note cover "${cover}".`);
  const data = await readFile(join(publicDirectory, cover));
  return `data:${type};base64,${data.toString('base64')}`;
}

async function collectJobs(options: {
  readonly contentDirectory: string;
  readonly publicDirectory: string;
  readonly nodeEnv: string | undefined;
}): Promise<ShareImageJob[]> {
  const { contentDirectory, publicDirectory, nodeEnv } = options;
  const jobs: ShareImageJob[] = [
    { image: homeShareImage(), aside: null, latest: false },
  ];

  // Components: the manifest, with each page's tagline (01 §5.4) or else its description.
  const taglines = new Map(
    readEntries(
      join(contentDirectory, 'components'),
      ['.md'],
      componentPageSchema,
    ).map(({ slug, data }) => [slug, data.tagline]),
  );
  for (const component of componentEntries) {
    const slug = componentNameToSlug(component.name);
    jobs.push({
      image: componentShareImage({
        slug,
        name: component.name,
        tagline: taglines.get(slug) ?? component.description,
      }),
      aside: {
        type: 'component',
        name: component.name,
        directive: component.directive,
      },
      latest: false,
    });
  }

  // Docs: drafts only outside production, as on the site.
  const docs = readEntries(
    join(contentDirectory, 'docs'),
    ['.md'],
    docsEntrySchema,
  ).map(({ slug, data }) => ({ ...data, slug }));
  for (const entry of selectDocsEntries(docs, {
    includeDrafts: nodeEnv !== 'production',
  })) {
    jobs.push({ image: docsShareImage(entry), aside: null, latest: false });
  }

  // Notes: drafts only outside production.
  const notes = readEntries(
    join(contentDirectory, 'notes'),
    ['.md', '.mdx'],
    notesEntrySchema,
  ).map(({ slug, data }) => ({ ...data, slug }));
  for (const note of selectVisibleNotes(notes, nodeEnv)) {
    jobs.push({
      image: noteShareImage({
        slug: note.slug,
        title: note.title,
        subtitle: note.subtitle ?? null,
        kind: note.kind,
      }),
      aside: {
        type: 'cover',
        src: await coverSource(note.cover, publicDirectory),
      },
      latest: false,
    });
  }

  // Changelog: every entry has a page; "Latest" goes on the newest released one only.
  const changelog = readEntries(
    join(contentDirectory, 'changelog'),
    ['.md'],
    changelogEntrySchema,
  ).map(({ data }) => data);
  const latest = getLatestChangelogRelease(changelog)?.version;
  for (const entry of changelog) {
    jobs.push({
      image: changelogShareImage({
        slug: changelogVersionSlug(entry.version),
        version: entry.version,
        subtitle: entry.subtitle,
      }),
      aside: null,
      latest: entry.version === latest,
    });
  }

  return jobs;
}

export interface BuildShareImagesOptions {
  /** `libs/content`. */
  readonly contentDirectory: string;
  /** `apps/site/public`; images go to its `og/` folder, which is replaced. */
  readonly publicDirectory: string;
  /** Where the downloaded fonts are kept between builds. */
  readonly fontCacheDirectory: string;
  readonly nodeEnv: string | undefined;
  readonly log?: (line: string) => void;
}

export async function buildShareImages(
  options: BuildShareImagesOptions,
): Promise<ShareImage[]> {
  const log = options.log ?? (() => undefined);
  const outDirectory = join(options.publicDirectory, 'og');
  const jobs = await collectJobs(options);
  const fonts = await loadShareImageFonts(options.fontCacheDirectory);
  const renderer = new ShareImageRenderer(fonts, new URL(SITE_URL).host);

  await rm(outDirectory, { recursive: true, force: true });

  for (const job of jobs) {
    const { png, title } = await renderer.render(job.image, job);
    const file = join(options.publicDirectory, job.image.imagePath);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, png);
    if (title.truncated) {
      log(
        `  ${job.image.imagePath}: grey half truncated at ${title.fontSize}px`,
      );
    }
  }

  return jobs.map((job) => job.image);
}
