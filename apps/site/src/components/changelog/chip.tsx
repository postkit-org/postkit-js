import { chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export interface ChipProps {
  readonly children: ReactNode;
  /** Package names (`@postkit/core`) are set in mono, a touch smaller. */
  readonly mono?: boolean;
}

/** A small grey pill for a topic tag or a package name (SiteChangelog, SiteChangelog020). */
export function Chip({ children, mono = false }: ChipProps) {
  return (
    <chakra.span
      display="inline-block"
      paddingBlock="3px"
      paddingInline="10px"
      borderRadius="full"
      bg="bg.subtle"
      color="fg.secondary"
      fontFamily={mono ? 'mono' : undefined}
      fontSize={mono ? '12.5px' : 'sm'}
      lineHeight="1.5"
      overflowWrap="anywhere"
    >
      {children}
    </chakra.span>
  );
}

export interface ChipListProps {
  readonly items: readonly string[];
  readonly mono?: boolean;
  readonly label?: string;
}

/** A wrapping row of chips, as a list so screen readers count them. */
export function ChipList({ items, mono, label }: ChipListProps) {
  return (
    <chakra.ul
      aria-label={label}
      display="flex"
      flexWrap="wrap"
      gap="6px"
      margin="0"
      padding="0"
      listStyleType="none"
    >
      {items.map((item) => (
        <chakra.li key={item} display="flex">
          <Chip mono={mono}>{item}</Chip>
        </chakra.li>
      ))}
    </chakra.ul>
  );
}
