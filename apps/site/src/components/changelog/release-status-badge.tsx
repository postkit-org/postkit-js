import { chakra } from '@chakra-ui/react';

import type { ChangelogStatus } from '../../lib/changelog';

export interface ReleaseStatusBadgeProps {
  readonly status: ChangelogStatus;
  /** The newest released entry (01 §5.2). Ignored for upcoming entries. */
  readonly latest?: boolean;
}

/**
 * "In development" (note tone) for an upcoming release, "Latest" (tip tone) for the newest
 * released one, nothing otherwise. Tone on its tint, as the boards draw them.
 */
export function ReleaseStatusBadge({
  status,
  latest = false,
}: ReleaseStatusBadgeProps) {
  const upcoming = status === 'upcoming';
  if (!upcoming && !latest) return null;
  const tone = upcoming ? 'note' : 'tip';

  return (
    <chakra.span
      display="inline-flex"
      alignItems="center"
      paddingBlock="2px"
      paddingInline="10px"
      borderRadius="full"
      bg={`tint.${tone}`}
      color={`tone.${tone}`}
      fontSize="sm"
      lineHeight="1.5"
      whiteSpace="nowrap"
    >
      {upcoming ? 'In development' : 'Latest'}
    </chakra.span>
  );
}
