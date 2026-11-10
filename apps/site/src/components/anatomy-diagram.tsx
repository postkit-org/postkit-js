import { Box, chakra, Text } from '@chakra-ui/react';
import type { ComponentAnatomyLayer } from '@postkit/content';

import { ExplodedView } from './anatomy/exploded-view';

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
 * - With `layers`, renders the exploded diagram (skewed layers, numbered labels that isolate
 *   their layer on hover or focus, the Assemble/Explode toggle, the phone legend, reduced
 *   motion), followed by the "Every part" grid.
 * - Without `layers`, renders only the "Every part" grid of `parts`. This is the final
 *   fallback for components with no `anatomy` frontmatter.
 * - It renders no section heading: the page owns "Anatomy. Every part is yours to restyle."
 */
export function AnatomyDiagram({
  componentName,
  layers,
  parts,
}: AnatomyDiagramProps) {
  const hasLayers = Boolean(layers && layers.length > 0);
  if (!hasLayers && parts.length === 0) return null;

  const elements = new Map(
    (layers ?? []).map((layer) => [layer.part, layer.element]),
  );

  return (
    <Box data-anatomy-diagram="">
      {layers && hasLayers ? (
        <ExplodedView componentName={componentName} layers={layers} />
      ) : null}

      {parts.length > 0 ? (
        <Box
          role="group"
          aria-label={`Every part of ${componentName}`}
          marginTop={hasLayers ? '32px' : '0'}
        >
          <Text margin="0" fontSize="md" color="fg.muted">
            Every part
          </Text>
          <chakra.ul
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(min(220px, 100%), 1fr))"
            gap="8px"
            margin="12px 0 0"
            padding="0"
            listStyleType="none"
          >
            {parts.map((part) => {
              const element = elements.get(part);
              return (
                <chakra.li
                  key={part}
                  minW="0"
                  paddingBlock="12px"
                  paddingInline="14px"
                  borderRadius="md"
                  bg="bg.subtle"
                  overflowWrap="anywhere"
                >
                  <chakra.span
                    fontFamily="mono"
                    fontSize="14px"
                    fontWeight="medium"
                    color="fg"
                  >
                    {part}
                  </chakra.span>
                  {element ? (
                    <>
                      {' '}
                      <chakra.span
                        fontFamily="mono"
                        fontSize="12.5px"
                        color="fg.muted"
                      >
                        {`<${element}>`}
                      </chakra.span>
                    </>
                  ) : null}
                </chakra.li>
              );
            })}
          </chakra.ul>
        </Box>
      ) : null}
    </Box>
  );
}
