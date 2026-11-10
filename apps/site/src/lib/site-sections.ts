/** The top-level sections the header nav and the phone menu mark as current. */
export type SiteSection = 'components' | 'docs' | 'notes' | 'changelog';

const sectionRoots: readonly SiteSection[] = [
  'components',
  'docs',
  'notes',
  'changelog',
];

/**
 * The section a route belongs to, from `useRouter().pathname` (e.g. `/docs/[slug]` → `docs`).
 * Home and the standalone pages (Licensing, Privacy, …) belong to none.
 */
export function sectionFromPathname(pathname: string): SiteSection | null {
  const root = pathname.split('/')[1] ?? '';
  return sectionRoots.find((section) => section === root) ?? null;
}

/** Postkit elsewhere (09 Q8: Bluesky @postkit.org, X @Postkit_). */
export const externalLinks = {
  github: 'https://github.com/postkit-org/postkit-js',
  npm: 'https://www.npmjs.com/org/postkit',
  bluesky: 'https://bsky.app/profile/postkit.org',
  x: 'https://x.com/Postkit_',
} as const;
