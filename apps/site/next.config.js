//@ts-check

const { readdirSync, readFileSync } = require('node:fs');
const path = require('node:path');

const { withContentCollections } = require('@content-collections/next');
const { withSentryConfig } = require('@sentry/nextjs/config');
const {
  changelogEntrySchema,
  getLatestChangelogRelease,
} = require('@postkit/content');
const { parse: parseYaml } = require('yaml');

// One file per content area, so docs and changelog URL changes stay separate.
const redirectFiles = [
  require('./redirects/docs.json'),
  require('./redirects/changelog.json'),
];

/**
 * The newest released changelog version (01 §5.2), for chrome on every page (the phone menu's
 * "Latest" line). It's read here and inlined as an env value so the changelog's content never
 * ships in the client bundle. Upcoming entries never count.
 */
function readLatestReleasedVersion() {
  const directory = path.join(__dirname, '../../libs/content/changelog');
  const entries = readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(path.join(directory, file), 'utf8');
      const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(source)?.[1] ?? '';
      return changelogEntrySchema.parse({
        ...parseYaml(frontmatter),
        content: '',
      });
    });
  return getLatestChangelogRelease(entries)?.version ?? '';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['postkit.test'],
  env: {
    POSTKIT_LATEST_RELEASE: readLatestReleasedVersion(),
  },
  poweredByHeader: false,
  async redirects() {
    return redirectFiles.flatMap((file) =>
      file.redirects.map(({ source, destination, permanent }) => ({
        source,
        destination,
        permanent,
      })),
    );
  },
  reactStrictMode: true,
  transpilePackages: [
    '@postkit/next',
    '@postkit/chakra',
    '@postkit/unfurl',
    '@postkit/site-theme',
    '@postkit/site-telemetry',
  ],
};

/**
 * Sentry (01 §12). Error reporting is off until `NEXT_PUBLIC_SENTRY_DSN` is set; the tunnel
 * route only exists then. Source maps upload only when `SENTRY_AUTH_TOKEN` is set (CI);
 * without it the build skips upload and release creation quietly. Build-time telemetry to
 * Sentry is off either way.
 */
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim() || undefined;
const uploadSourceMaps = sentryAuthToken !== undefined;

/** @type {import('@sentry/nextjs/config').SentryBuildOptions} */
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: sentryAuthToken,
  silent: !uploadSourceMaps,
  telemetry: false,
  // A random path per build, so ad blockers don't drop events.
  tunnelRoute: sentryDsn ? true : undefined,
  sourcemaps: {
    disable: !uploadSourceMaps,
    // Upload them, then keep them off the public site.
    deleteSourcemapsAfterUpload: true,
  },
  release: {
    create: uploadSourceMaps,
    finalize: uploadSourceMaps,
  },
  // Pages Router: Sentry traces navigations itself; `onRouterTransitionStart` is App Router.
  suppressOnRouterTransitionStartWarning: true,
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
};

module.exports = withContentCollections(
  withSentryConfig(nextConfig, sentryBuildOptions),
);
