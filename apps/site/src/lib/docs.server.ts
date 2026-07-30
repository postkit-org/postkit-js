import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { createPostkitRemarkPlugins } from '@postkit/react';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';

import type { DocsEntry, DocsEntrySummary } from './docs';

const docsDirectory = join(process.cwd(), 'content', 'docs');
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requiredString(
  data: Record<string, unknown>,
  key: 'category' | 'summary' | 'title',
  filename: string,
): string {
  const value = data[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(
      `Documentation entry "${filename}" requires a non-empty "${key}" field.`,
    );
  }
  return value.trim();
}

function parseSummary(filename: string): DocsEntrySummary {
  const slug = filename.replace(/\.md$/, '');
  if (!slugPattern.test(slug)) {
    throw new TypeError(
      `Documentation filename "${filename}" must use a lowercase URL-safe slug.`,
    );
  }

  const file = readFileSync(join(docsDirectory, filename), 'utf8');
  const { data } = matter(file);
  if (
    typeof data.order !== 'number' ||
    !Number.isInteger(data.order) ||
    data.order < 0
  ) {
    throw new TypeError(
      `Documentation entry "${filename}" requires a non-negative integer "order" field.`,
    );
  }

  return {
    slug,
    title: requiredString(data, 'title', filename),
    summary: requiredString(data, 'summary', filename),
    category: requiredString(data, 'category', filename),
    order: data.order,
  };
}

export function getDocsEntries(): DocsEntrySummary[] {
  return readdirSync(docsDirectory)
    .filter((filename) => filename.endsWith('.md'))
    .map(parseSummary)
    .sort(
      (left, right) =>
        left.order - right.order || left.title.localeCompare(right.title),
    );
}

export async function getDocsEntry(slug: string): Promise<DocsEntry> {
  if (!slugPattern.test(slug)) {
    throw new TypeError(`Invalid documentation slug "${slug}".`);
  }

  const filename = `${slug}.md`;
  const summary = parseSummary(filename);
  const file = readFileSync(join(docsDirectory, filename), 'utf8');
  const { content } = matter(file);
  const source = await serialize(content, {
    mdxOptions: {
      remarkPlugins: createPostkitRemarkPlugins(),
    },
  });

  return { ...summary, source };
}
