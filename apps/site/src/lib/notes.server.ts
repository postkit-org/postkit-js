import { createPostkitRemarkPlugins } from '@postkit/chakra';
import { selectVisibleNotes } from '@postkit/content';
import { allNotesEntries } from 'content-collections';
import { serialize } from 'next-mdx-remote/serialize';

import type { NoteEntry, NoteSummary } from './notes';

type GeneratedNotesEntry = (typeof allNotesEntries)[number];

function toSummary(entry: GeneratedNotesEntry): NoteSummary {
  return {
    slug: entry.slug,
    title: entry.title,
    subtitle: entry.subtitle ?? null,
    summary: entry.summary,
    kind: entry.kind,
    date: entry.date,
    author: {
      name: entry.author.name,
      avatar: entry.author.avatar ?? null,
    },
    cover: entry.cover,
    footnotes: entry.footnotes
      ? { placement: entry.footnotes.placement }
      : null,
    status: entry.status,
  };
}

/** Notes this build may show: drafts are left out of production builds. */
function visibleNotesEntries(): GeneratedNotesEntry[] {
  return selectVisibleNotes(allNotesEntries);
}

/** Newest first. */
export function getNotes(): NoteSummary[] {
  return visibleNotesEntries()
    .map(toSummary)
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) ||
        left.title.localeCompare(right.title),
    );
}

export async function getNote(slug: string): Promise<NoteEntry> {
  const entry = visibleNotesEntries().find(
    (candidate) => candidate.slug === slug,
  );

  if (!entry) {
    throw new TypeError(`Unknown note slug "${slug}".`);
  }

  // GFM footnotes come from the preset's remark-gfm; keep this call in step
  // with libs/content/src/lib/notes.spec.ts, which compiles every note with it.
  const source = await serialize(entry.content, {
    mdxOptions: {
      remarkPlugins: createPostkitRemarkPlugins(),
    },
  });

  return { ...toSummary(entry), source };
}
