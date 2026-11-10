import { chakra } from '@chakra-ui/react';
import type { PostkitComponentCatalogEntry } from '@postkit/chakra';
import { useSyncExternalStore } from 'react';

import { componentPropDefault } from '../../lib/component-defaults';
import {
  componentNameToSlug,
  isInteractive,
  previewControls,
} from '../../lib/components';
import { ComponentPreview } from '../component-preview';
import { Tile } from '../primitives';

const subscribeNever = () => () => undefined;

/** `false` on the server and during hydration, `true` once the page is interactive. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

/**
 * A component's default state, drawn at half size inside a tile's preview panel.
 *
 * The tile is one link, and many previews contain links, buttons or forms of their own.
 * So the preview is `inert` (no focus, no clicks, not in the accessibility tree; clicks
 * fall through to the tile's link), and it mounts only after hydration: an `<a>` inside an
 * `<a>` in server HTML would be split apart by the HTML parser and break hydration.
 */
function TilePreview({
  component,
}: {
  readonly component: PostkitComponentCatalogEntry;
}) {
  const hydrated = useHydrated();
  // The documented defaults (D12: variant "subtle"), not the 0.2 recipes' own.
  const values = Object.fromEntries(
    previewControls(component).flatMap(({ prop }) => {
      const value = componentPropDefault(component.name, prop);
      return typeof value === 'string' ? [[prop, value]] : [];
    }),
  );

  return (
    <chakra.span
      // `inert` already hides it; this keeps it out of the link's name in every tool.
      aria-hidden="true"
      display="block"
      position="absolute"
      inset={{ base: '12px', md: '20px' }}
      overflow="hidden"
      pointerEvents="none"
    >
      {hydrated ? (
        <chakra.span
          inert
          display="block"
          position="absolute"
          top="50%"
          left="50%"
          width="200%"
          transform="translate(-50%, -50%) scale(0.5)"
          transformOrigin="center"
          textAlign="start"
        >
          <ComponentPreview name={component.name} values={values} />
        </chakra.span>
      ) : null}
    </chakra.span>
  );
}

export interface ComponentTileProps {
  readonly component: PostkitComponentCatalogEntry;
  /** The line under the name. Defaults to the manifest description. */
  readonly description?: string;
}

/**
 * A catalog tile (02 §5 ComponentTile, SiteComponents board): the live default preview on
 * `bg.subtle`, the name and a two-line description. The whole tile is one link; interactive
 * components carry an "Interactive" tag.
 */
export function ComponentTile({ component, description }: ComponentTileProps) {
  return (
    <Tile
      href={`/components/${componentNameToSlug(component.name)}`}
      label={component.name}
      description={description ?? component.description}
    >
      <TilePreview component={component} />
      {isInteractive(component) ? (
        <chakra.span
          aria-hidden="true"
          position="absolute"
          top="12px"
          right="12px"
          paddingBlock="2px"
          paddingInline="8px"
          borderRadius="full"
          bg="bg"
          color="fg.secondary"
          fontSize="12px"
          lineHeight="1.5"
        >
          Interactive
        </chakra.span>
      ) : null}
    </Tile>
  );
}
