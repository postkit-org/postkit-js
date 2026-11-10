import { chakra } from '@chakra-ui/react';
import NextLink from 'next/link';

import { changelogHref, type ChangelogEntrySummary } from '../../lib/changelog';

type PagerEntry = Pick<ChangelogEntrySummary, 'slug' | 'version' | 'subtitle'>;

export interface ReleasePagerProps {
  readonly older: PagerEntry | null;
  readonly newer: PagerEntry | null;
}

function PagerLink({
  entry,
  direction,
}: {
  entry: PagerEntry;
  direction: 'older' | 'newer';
}) {
  const newer = direction === 'newer';
  return (
    <chakra.a
      asChild
      gridColumn={{ md: newer ? '2' : '1' }}
      display="flex"
      flexDirection="column"
      gap="2px"
      paddingBlock="18px"
      paddingInline="20px"
      borderRadius="xl"
      bg="bg.subtle"
      color="fg"
      textDecoration="none"
      textAlign={newer ? 'right' : 'left'}
      transitionProperty="background-color"
      transitionDuration="hover"
      transitionTimingFunction="ease-out"
      css={{
        '@media (hover: hover)': { _hover: { bg: 'bg.hover' } },
        _active: { bg: 'bg.pressed' },
      }}
    >
      <NextLink href={changelogHref(entry)} rel={newer ? 'next' : 'prev'}>
        <chakra.span fontSize="14px" color="fg.muted">
          {newer ? 'Newer' : 'Older'}
        </chakra.span>
        <chakra.span fontSize="body">
          {newer ? null : <span aria-hidden="true">‹ </span>}
          {entry.version} · {entry.subtitle}
          {newer ? <span aria-hidden="true"> ›</span> : null}
        </chakra.span>
      </NextLink>
    </chakra.a>
  );
}

/**
 * Older and newer releases. Older sits left and Newer right; a lone Newer keeps its place
 * on the right (SiteChangelog010), a lone Older fills the row (SiteChangelog030).
 */
export function ReleasePager({ older, newer }: ReleasePagerProps) {
  if (!older && !newer) return null;
  const single = !older || !newer;
  return (
    <chakra.nav
      aria-label="Other releases"
      marginTop="72px"
      display="grid"
      gridTemplateColumns={{
        base: 'minmax(0, 1fr)',
        md: single && older ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
      }}
      gap="16px"
    >
      {older ? <PagerLink entry={older} direction="older" /> : null}
      {newer ? <PagerLink entry={newer} direction="newer" /> : null}
    </chakra.nav>
  );
}
