import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Build-time helpers for the legal and Made with OSS pages. Server only: call them from
 * `getStaticProps`.
 */

/** The monorepo root: the nearest folder up from the build's cwd that has `nx.json`. */
export function repoRoot(): string {
  let dir = process.cwd();
  for (;;) {
    if (existsSync(path.join(dir, 'nx.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`No nx.json above ${process.cwd()}: can't find the repo root.`);
    }
    dir = parent;
  }
}

/** Today in UTC, `YYYY-MM-DD`: the fallback when git can't say. */
function buildDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The "Last updated" date (09: "git date for Privacy and Licensing"): the committer date of
 * the newest commit that touched any of `files` (paths from the repo root), as `YYYY-MM-DD`.
 * Falls back to the build date when git isn't installed, the checkout has no history, or the
 * files aren't committed yet.
 */
export function lastUpdated(files: readonly string[]): string {
  try {
    const out = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', ...files],
      { cwd: repoRoot(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : buildDate();
  } catch {
    return buildDate();
  }
}

/** The repo's `LICENSE`, read at build time so the Licensing page always matches it. */
export function readLicense(): string {
  return readFileSync(path.join(repoRoot(), 'LICENSE'), 'utf8').trimEnd();
}

/**
 * A JSON file from the site app (`src/content/oss.json`), read at build time. The path is
 * relative to `apps/site`.
 */
export function readSiteJson<T>(file: string): T {
  return JSON.parse(
    readFileSync(path.join(repoRoot(), 'apps/site', file), 'utf8'),
  ) as T;
}

/** `2026-11-10` → "November 10, 2026". */
export function formatLegalDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}
