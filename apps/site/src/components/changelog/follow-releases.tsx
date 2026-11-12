import { chakra } from '@chakra-ui/react';

import { TextLink } from '../legal/text-link';
import { followReleaseLinks } from './release-links';

/** "Follow releases: RSS Atom JSON Feed Email" (SiteChangelog, SiteChangelog020). */
export function FollowReleases() {
  return (
    <chakra.nav
      aria-label="Follow releases"
      display="flex"
      flexWrap="wrap"
      alignItems="center"
      gap="12px 24px"
      fontSize="md"
    >
      <chakra.span color="fg.muted">Follow releases:</chakra.span>
      {followReleaseLinks.map((link) => (
        <TextLink key={link.href} href={link.href} variant="plain">
          {link.label}
        </TextLink>
      ))}
    </chakra.nav>
  );
}
