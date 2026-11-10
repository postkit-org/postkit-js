import { chakra, Flex } from '@chakra-ui/react';
import type { PostkitComponentCatalogEntry } from '@postkit/chakra';

import { directiveMarker, isInteractive } from '../../lib/components';

const pill = {
  paddingBlock: '4px',
  paddingInline: '12px',
  borderRadius: 'full',
  bg: 'bg.subtle',
  color: 'fg',
} as const;

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Kit, static or interactive, stability and the directive (01 §6.3), all from the manifest. */
export function ComponentBadges({
  component,
}: {
  readonly component: PostkitComponentCatalogEntry;
}) {
  return (
    <Flex
      as="ul"
      aria-label="About this component"
      marginTop="24px"
      padding="0"
      listStyleType="none"
      wrap="wrap"
      align="center"
      gap="8px"
      fontSize="14px"
    >
      <chakra.li {...pill}>{component.category}</chakra.li>
      <chakra.li {...pill}>
        {isInteractive(component) ? 'Interactive' : 'Static'}
      </chakra.li>
      <chakra.li {...pill}>
        Stability · {capitalise(component.stability)}
      </chakra.li>
      <chakra.li {...pill} fontFamily="mono" fontSize="13px">
        {directiveMarker(component)}
      </chakra.li>
    </Flex>
  );
}
