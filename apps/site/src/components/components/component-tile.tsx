import { chakra } from '@chakra-ui/react';
import type { PostkitComponentCatalogEntry } from '@postkit/chakra';
import { useEffect, useState } from 'react';

import type { ComponentPropDefaults } from '../../lib/component-prop-defaults';
import {
  componentNameToSlug,
  isInteractive,
  previewControls,
} from '../../lib/components';
import {
  ComponentPreview,
  preloadComponentPreview,
} from '../component-preview';
import { Tile } from '../primitives';

/**
 * `false` on the server and during hydration; `true` once the page is interactive and the
 * component's view has downloaded (previews are lazy views). The preview then appears whole,
 * in one go, instead of growing as its view arrives, so nothing shifts.
 */
function usePreviewReady(name: PostkitComponentCatalogEntry['name']): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    // A failed download leaves the tile without its preview.
    preloadComponentPreview(name).then(
      () => live && setReady(true),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [name]);
  return ready;
}

/**
 * A component's default state, drawn at half size inside a tile's preview panel.
 *
 * The tile is one link, and many previews contain links, buttons or forms of their own.
 * So the preview is `inert` (no focus, no clicks, not in the accessibility tree; clicks
 * fall through to the tile's link), and it mounts only after hydration: an `<a>` inside an
 * `<a>` in server HTML would be split apart by the HTML parser and break hydration. It waits
 * for its view too (`usePreviewReady`).
 */
function TilePreview({
  component,
  defaults,
}: {
  readonly component: PostkitComponentCatalogEntry;
  readonly defaults: ComponentPropDefaults;
}) {
  const hydrated = usePreviewReady(component.name);
  // The default state: the manifest's defaults for the controls (D12: variant "subtle"),
  // over whatever the preview sample sets.
  const values = Object.fromEntries(
    previewControls(component).flatMap(({ prop }) => {
      const value = defaults[prop];
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
  /** The component's manifest defaults (`componentPropDefaults`, from `getStaticProps`). */
  readonly defaults: ComponentPropDefaults;
  /** The line under the name. Defaults to the manifest description. */
  readonly description?: string;
}

/**
 * A catalog tile (02 §5 ComponentTile, SiteComponents board): the live default preview on
 * `bg.subtle`, the name and a two-line description. The whole tile is one link; interactive
 * components carry an "Interactive" tag.
 */
export function ComponentTile({
  component,
  defaults,
  description,
}: ComponentTileProps) {
  return (
    <Tile
      href={`/components/${componentNameToSlug(component.name)}`}
      label={component.name}
      description={description ?? component.description}
    >
      <TilePreview component={component} defaults={defaults} />
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
