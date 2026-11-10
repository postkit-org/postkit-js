import { Box, chakra, SimpleGrid, Text } from '@chakra-ui/react';
import type { ComponentAnatomyLayer } from '@postkit/content';

/**
 * Props for `AnatomyDiagram`. This contract is fixed; PK-034 implements the exploded view
 * behind it without changing these props.
 */
export interface AnatomyDiagramProps {
  /** The catalog name, `Callout`: used in labels ("Exploded view of Callout's 5 parts"). */
  readonly componentName: string;
  /**
   * The exploded view's layers, top to bottom, from the component page's `anatomy.layers`
   * frontmatter (`ComponentAnatomyLayer` from `@postkit/content`: part, element, description,
   * box). Absent or empty: only the "Every part" grid renders.
   */
  readonly layers?: readonly ComponentAnatomyLayer[];
  /** Every named part (the manifest's slots), in manifest order. Always rendered as the grid. */
  readonly parts: readonly string[];
}

/**
 * The component page's anatomy (01 §6.3, PK-034).
 *
 * Contract:
 * - With `layers`, renders the exploded diagram (skewed layers, numbered labels that isolate
 *   their layer on hover or focus, the Assemble/Explode toggle, the phone legend, reduced
 *   motion), followed by the "Every part" grid.
 * - Without `layers`, renders only the "Every part" grid of `parts`. This is the final
 *   fallback for components with no `anatomy` frontmatter.
 * - It renders no section heading: the page owns "Anatomy. Every part is yours to restyle."
 *
 * This is the stub: it renders the "Every part" grid only, whatever `layers` holds.
 */
export function AnatomyDiagram({ componentName, parts }: AnatomyDiagramProps) {
  if (parts.length === 0) return null;

  return (
    <Box
      role="group"
      aria-label={`Every part of ${componentName}`}
      data-anatomy-diagram=""
    >
      <Text margin="0 0 12px" fontSize="sm" color="fg.muted">
        Every part
      </Text>
      <SimpleGrid
        as="ul"
        minChildWidth="160px"
        gap="8px"
        margin="0"
        padding="0"
        listStyleType="none"
      >
        {parts.map((part) => (
          <chakra.li
            key={part}
            minW="0"
            paddingBlock="12px"
            paddingInline="16px"
            borderRadius="md"
            bg="bg.subtle"
            fontFamily="mono"
            fontSize="sm"
            color="fg"
            overflowWrap="anywhere"
          >
            {part}
          </chakra.li>
        ))}
      </SimpleGrid>
    </Box>
  );
}
