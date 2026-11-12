import { chakra } from '@chakra-ui/react';

export interface KitChip {
  readonly id: string;
  readonly name: string;
  readonly count: number;
}

/**
 * The kit chips (SiteComponents, PhoneComponents): in-page links to each kit with its
 * count from the manifest. They wrap on wide screens and scroll sideways on phones,
 * running to the screen edge.
 */
export function KitChips({ kits }: { readonly kits: readonly KitChip[] }) {
  return (
    <chakra.nav
      aria-label="Kits"
      display="flex"
      flexWrap={{ base: 'nowrap', md: 'wrap' }}
      gap="8px"
      overflowX={{ base: 'auto', md: 'visible' }}
      // Phones: run past the right gutter, and keep room for the focus ring.
      marginInlineEnd={{ base: 'calc(-1 * {spacing.gutter})', md: '0' }}
      paddingInlineEnd={{ base: 'gutter', md: '0' }}
      paddingBlock={{ base: '4px', md: '0' }}
      paddingInlineStart={{ base: '4px', md: '0' }}
      marginInlineStart={{ base: '-4px', md: '0' }}
      css={{
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {kits.map((kit) => (
        <chakra.a
          key={kit.id}
          href={`#${kit.id}`}
          flex="0 0 auto"
          display="inline-flex"
          alignItems="center"
          gap="8px"
          minHeight={{ base: '44px', md: '40px' }}
          paddingInline="16px"
          borderRadius="full"
          bg="bg.subtle"
          color="fg"
          fontSize="15px"
          textDecoration="none"
          whiteSpace="nowrap"
          transitionProperty="background-color"
          transitionDuration="hover"
          transitionTimingFunction="ease-out"
          css={{
            '@media (hover: hover)': {
              '&:hover:not(:active)': { bg: 'bg.hover' },
            },
            '&:active': { bg: 'bg.pressed' },
          }}
        >
          {kit.name}
          <chakra.span color="fg.muted">{kit.count}</chakra.span>
        </chakra.a>
      ))}
    </chakra.nav>
  );
}
