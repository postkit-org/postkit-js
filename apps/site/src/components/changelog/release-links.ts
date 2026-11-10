import { externalLinks } from '../../lib/site-sections';

/**
 * Where to follow releases (01 §3, §10). The feeds are built at deploy time (PK-042) and the
 * subscribe page is PK-051; these are the URLs the spec fixes for them.
 */
export const followReleaseLinks = [
  { label: 'RSS', href: '/feeds/changelog.xml' },
  { label: 'Atom', href: '/feeds/changelog.atom' },
  { label: 'JSON Feed', href: '/feeds/changelog.json' },
  { label: 'Email', href: '/newsletter/subscribe' },
] as const;

/** Every tagged release on GitHub. */
export const githubReleasesUrl = `${externalLinks.github}/releases`;

/**
 * A release's GitHub page. Releases are tagged `v0.2.0`; an upcoming release has no tag
 * yet, so it links to the list.
 */
export function githubReleaseUrl(entry: {
  readonly version: string;
  readonly status: string;
}): string {
  return entry.status === 'released'
    ? `${githubReleasesUrl}/tag/v${entry.version}`
    : githubReleasesUrl;
}
