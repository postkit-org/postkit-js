import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { createPostkitRemarkPlugins } from '@postkit/react';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';

import type { ChangelogEntry, ChangelogEntrySummary } from './changelog';

const changelogDirectory = join(process.cwd(), 'content', 'changelog');
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function requiredString(
  data: Record<string, unknown>,
  key: 'summary' | 'title' | 'version',
  filename: string,
): string {
  const value = data[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(
      `Changelog entry "${filename}" requires a non-empty "${key}" field.`,
    );
  }
  return value.trim();
}

function requiredDate(data: Record<string, unknown>, filename: string): string {
  const value = data.date;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(
      `Changelog entry "${filename}" requires a non-empty "date" field.`,
    );
  }
  return value.trim();
}

function parseSummary(filename: string): ChangelogEntrySummary {
  const slug = filename.replace(/\.md$/, '');
  if (!slugPattern.test(slug)) {
    throw new TypeError(
      `Changelog filename "${filename}" must use a lowercase URL-safe slug.`,
    );
  }

  const file = readFileSync(join(changelogDirectory, filename), 'utf8');
  const { data } = matter(file);
  const title = requiredString(data, 'title', filename);
  const version = requiredString(data, 'version', filename);
  const date = requiredDate(data, filename);
  const summary = requiredString(data, 'summary', filename);
  if (
    !datePattern.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`))
  ) {
    throw new TypeError(
      `Changelog entry "${filename}" requires a valid YYYY-MM-DD date.`,
    );
  }

  const tags = data.tags;
  if (
    tags !== undefined &&
    (!Array.isArray(tags) ||
      tags.some((tag) => typeof tag !== 'string' || tag.trim() === ''))
  ) {
    throw new TypeError(
      `Changelog entry "${filename}" must use a string array for "tags".`,
    );
  }

  return {
    slug,
    title,
    version,
    date,
    summary,
    tags: Object.freeze(
      (tags as string[] | undefined)?.map((tag) => tag.trim()) ?? [],
    ),
  };
}

export function getChangelogEntries(): ChangelogEntrySummary[] {
  return readdirSync(changelogDirectory)
    .filter((filename) => filename.endsWith('.md'))
    .map(parseSummary)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export async function getChangelogEntry(slug: string): Promise<ChangelogEntry> {
  if (!slugPattern.test(slug)) {
    throw new TypeError(`Invalid changelog slug "${slug}".`);
  }

  const filename = `${slug}.md`;
  const summary = parseSummary(filename);
  const file = readFileSync(join(changelogDirectory, filename), 'utf8');
  const { content } = matter(file);
  const source = await serialize(content, {
    mdxOptions: {
      remarkPlugins: createPostkitRemarkPlugins(),
    },
  });

  return { ...summary, source };
}
