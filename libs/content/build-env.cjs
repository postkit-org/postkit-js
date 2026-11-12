// @ts-check
'use strict';

/**
 * The content rules `apps/site/next.config.js` needs while Next or Nx loads the config.
 * Plain CommonJS with no dependencies, so it works before `@postkit/content` is built:
 * on a fresh clone, Nx loads `next.config.js` to build its project graph before it can
 * build anything. `build-env.spec.ts` keeps these in step with `src/lib/changelog.ts`
 * and `src/lib/notes.ts`.
 */

/**
 * Semver order, ascending; a prerelease sorts before its release.
 * @param {string} left
 * @param {string} right
 */
function compareVersions(left, right) {
  /** @param {string} version */
  const parse = (version) => {
    const [core = '', prerelease] = version.split(/-(.*)/s, 2);
    const [major = 0, minor = 0, patch = 0] = core.split('.').map(Number);
    return { major, minor, patch, prerelease };
  };
  const a = parse(left);
  const b = parse(right);
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === undefined) return 1;
  if (b.prerelease === undefined) return -1;
  return a.prerelease.localeCompare(b.prerelease, 'en', { numeric: true });
}

/**
 * The newest released version, or `''`. Upcoming entries never count.
 * @param {readonly { readonly version: string; readonly status?: string }[]} entries
 */
function latestReleasedVersion(entries) {
  const released = entries
    .filter((entry) => (entry.status ?? 'released') === 'released')
    .map((entry) => entry.version)
    .sort((left, right) => compareVersions(right, left));
  return released[0] ?? '';
}

/**
 * Whether a build shows any note: every note outside production, and only published notes
 * (the default status) in production.
 * @param {readonly { readonly status?: string }[]} notes
 * @param {string | undefined} [nodeEnv]
 */
function hasVisibleNotes(notes, nodeEnv = process.env['NODE_ENV']) {
  if (nodeEnv !== 'production') return notes.length > 0;
  return notes.some((note) => (note.status ?? 'published') === 'published');
}

module.exports = { compareVersions, latestReleasedVersion, hasVisibleNotes };
