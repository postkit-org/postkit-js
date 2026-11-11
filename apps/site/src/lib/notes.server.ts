import { createPostkitRemarkPlugins } from '@postkit/chakra';
import { selectVisibleNotes } from '@postkit/content';
import { allNotesEntries } from 'content-collections';
import { serialize } from 'next-mdx-remote/serialize';

import { componentEntries, componentNameToSlug } from './components';
import type { NoteComponentLink, NoteEntry, NoteSummary } from './notes';

type GeneratedNotesEntry = (typeof allNotesEntries)[number];

/**
 * The site's footnotes (01 §5.3, §6.6): sidenotes in the margin from xl (1200px), end notes
 * from md, and notes that open under their line on phones. The end list is the plain
 * variant: a short rule over the notes. A note's `footnotes:` front matter overrides it.
 */
export const siteFootnoteDefaults = {
  placement: { base: 'inline', md: 'end', xl: 'side' },
  variant: 'plain',
} as const;

/** Words per minute for the "min read" line. */
const READING_WORDS_PER_MINUTE = 230;

/**
 * Minutes to read a note's MDX, rounded up (at least 1). MDX comments and import/export
 * lines don't count; prop strings (Steps items, a KeyTakeaway) do, since they're read.
 */
export function readingMinutes(content: string): number {
  const text = content
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/^(?:import|export)\s.*$/gm, ' ');
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(words / READING_WORDS_PER_MINUTE));
}

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
    readingMinutes: readingMinutes(entry.content),
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

interface MdastNode {
  readonly type: string;
  readonly name?: string | null;
  readonly children?: readonly MdastNode[];
}

const catalogByName = new Map<string, (typeof componentEntries)[number]>(
  componentEntries.map((component) => [component.name, component]),
);

/**
 * A remark plugin that records the Postkit components an MDX body uses, in order of first
 * use. It reads the parsed tree (after the Postkit preset turns directives into elements), so
 * a component named inside a prop string, like the CodeBlock sample, doesn't count.
 */
function collectPostkitComponents(found: string[]) {
  return () => (tree: MdastNode) => {
    const visit = (node: MdastNode) => {
      if (
        (node.type === 'mdxJsxFlowElement' ||
          node.type === 'mdxJsxTextElement') &&
        node.name &&
        catalogByName.has(node.name) &&
        !found.includes(node.name)
      ) {
        found.push(node.name);
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export async function getNote(slug: string): Promise<NoteEntry> {
  const entry = visibleNotesEntries().find(
    (candidate) => candidate.slug === slug,
  );

  if (!entry) {
    throw new TypeError(`Unknown note slug "${slug}".`);
  }

  const used: string[] = [];

  // Footnotes become Postkit's Footnote and Footnotes (03 §7.1); keep this call in step
  // with libs/content/src/lib/notes.spec.ts, which compiles every note with it. Ids are
  // prefixed per note (`fn-{slug}-1`), so pages that show several notes never collide.
  const source = await serialize(entry.content, {
    mdxOptions: {
      remarkPlugins: [
        ...createPostkitRemarkPlugins({
          postkit: {
            footnotes: {
              scope: slug,
              defaults: { ...siteFootnoteDefaults, ...entry.footnotes },
            },
          },
        }),
        collectPostkitComponents(used),
      ],
    },
  });

  const components: NoteComponentLink[] = used.flatMap((name) => {
    const component = catalogByName.get(name);
    return component
      ? [
          {
            name: component.name,
            href: `/components/${componentNameToSlug(component.name)}`,
          },
        ]
      : [];
  });

  return { ...toSummary(entry), source, components };
}
