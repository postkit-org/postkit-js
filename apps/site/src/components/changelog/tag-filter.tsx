import { Box } from '@chakra-ui/react';

import { SegmentedControl } from '../primitives';

/** The "All" value: no filter. Tags are lower-case words, so it can't collide. */
export const ALL_TAGS = '*';

export interface TagFilterProps {
  readonly tags: readonly string[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
}

const label = (tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1);

/**
 * The changelog's topic chips (SiteChangelog): "All", then every tag in use. On phones the
 * track scrolls sideways instead of wrapping (PhoneChangelog).
 */
export function TagFilter({ tags, value, onValueChange }: TagFilterProps) {
  return (
    <Box
      // Room for the focus ring and the 44px hit areas inside the scroller.
      marginInline="-6px"
      paddingInline="6px"
      marginBlock="-7px"
      paddingBlock="7px"
      overflowX="auto"
      css={{
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <SegmentedControl
        aria-label="Filter by topic"
        items={[
          { value: ALL_TAGS, label: 'All' },
          ...tags.map((tag) => ({ value: tag, label: label(tag) })),
        ]}
        value={value}
        onValueChange={onValueChange}
      />
    </Box>
  );
}

/**
 * Every tag in use, most-used first; ties keep the order they first appear in, newest
 * release first.
 */
export function collectTags(
  entries: readonly { readonly tags: readonly string[] }[],
): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const firstSeen = [...counts.keys()];
  return [...firstSeen].sort(
    (a, b) =>
      (counts.get(b) ?? 0) - (counts.get(a) ?? 0) ||
      firstSeen.indexOf(a) - firstSeen.indexOf(b),
  );
}
