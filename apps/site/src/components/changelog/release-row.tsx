import { chakra } from '@chakra-ui/react';
import NextLink from 'next/link';

import {
  changelogHref,
  formatChangelogRelease,
  type ChangelogEntrySummary,
} from '../../lib/changelog';
import { ChipList } from './chip';
import { ReleaseStatusBadge } from './release-status-badge';

export interface ReleaseRowProps {
  readonly entry: ChangelogEntrySummary;
  /** The newest released entry. */
  readonly latest: boolean;
}

/** Adds a full stop to a statement that doesn't end in punctuation: "Postkit 0.2.0." */
export function asStatement(text: string): string {
  return /[.!?…]$/.test(text) ? text : `${text}.`;
}

/**
 * One release on the changelog index (SiteChangelog): version, date and status on the left;
 * the two-tone title, summary, tags and "Read the release notes ›" on the right. The whole
 * row is the link target (the title's link is stretched over it), so the link's name stays
 * the title rather than the whole row.
 */
export function ReleaseRow({ entry, latest }: ReleaseRowProps) {
  const href = changelogHref(entry);
  const released = entry.status === 'released';

  return (
    <chakra.li
      position="relative"
      display="flex"
      flexWrap="wrap"
      gap="16px 56px"
      paddingBlock={{ base: '32px', md: '40px' }}
      borderTopWidth="1px"
      borderColor="border"
      css={{
        '&:has(a:focus-visible)': {
          outline: '2px solid',
          outlineColor: 'accent',
          outlineOffset: '4px',
          borderRadius: 'md',
        },
        '@media (hover: hover)': {
          '&:hover [data-read-more]': {
            textDecorationLine: 'underline',
            textUnderlineOffset: '3px',
          },
        },
      }}
    >
      <chakra.div flex="0 0 200px">
        <chakra.p
          margin="0"
          fontWeight="medium"
          fontSize={{ base: '34px', md: '40px' }}
          lineHeight="1"
          letterSpacing="display"
        >
          {entry.version}
        </chakra.p>
        <chakra.p
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          gap="8px"
          margin="0"
          marginTop="12px"
          fontSize="md"
          color="fg.muted"
        >
          {released ? (
            <time dateTime={entry.date}>{formatChangelogRelease(entry)}</time>
          ) : (
            formatChangelogRelease(entry)
          )}
          <ReleaseStatusBadge status={entry.status} latest={latest} />
        </chakra.p>
      </chakra.div>

      <chakra.div flex="1 1 480px" minWidth="0">
        <chakra.h2
          margin="0"
          fontWeight="medium"
          fontSize={{ base: '22px', md: 'xl' }}
          lineHeight="1.25"
          letterSpacing="-0.015em"
          css={{ textWrap: 'pretty' }}
        >
          <NextLink
            href={href}
            style={{
              color: 'inherit',
              textDecoration: 'none',
              outline: 'none',
            }}
          >
            {/* Stretches over the row so the whole row is clickable. */}
            <chakra.span
              position="absolute"
              inset="0"
              aria-hidden="true"
              zIndex="0"
            />
            {asStatement(entry.title)}{' '}
            <chakra.span color="fg.quiet">{entry.subtitle}</chakra.span>
          </NextLink>
        </chakra.h2>
        <chakra.p
          margin="0"
          marginTop="12px"
          fontSize={{ base: 'md', md: 'body' }}
          lineHeight="1.55"
          color="fg.secondary"
          maxW="62ch"
        >
          {entry.summary}
        </chakra.p>
        {entry.tags.length ? (
          <chakra.div marginTop="16px">
            <ChipList items={entry.tags} label="Topics" />
          </chakra.div>
        ) : null}
        <chakra.span
          data-read-more=""
          aria-hidden="true"
          display="block"
          marginTop="18px"
          fontSize="16px"
        >
          Read the release notes ›
        </chakra.span>
      </chakra.div>
    </chakra.li>
  );
}
