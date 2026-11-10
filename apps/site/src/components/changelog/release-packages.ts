/**
 * The packages a release touches, read from its notes: every `@postkit/<name>` the Markdown
 * mentions, in the order it first mentions them. Entry points (`@postkit/react/document`)
 * count as their package, and the `@postkit/*` wildcard is skipped. Changelog frontmatter
 * has no package field, so the notes are the source; a release that names a package is a
 * release that changed it.
 */
export function releasePackages(markdown: string): string[] {
  const seen = new Set<string>();
  for (const match of markdown.matchAll(/@postkit\/([a-z0-9][a-z0-9-]*)/g)) {
    seen.add(`@postkit/${match[1]}`);
  }
  return [...seen];
}
