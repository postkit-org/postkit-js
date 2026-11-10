import { Box, chakra, defineSlotRecipe } from '@chakra-ui/react';
import { postkitChakraView } from '@postkit/chakra';
import { postkitView } from '@postkit/react';

import { deviceDefinition } from '../component-definition/device.definition';

/** The headless view: anatomy only, styled by the site's CSS. */
export const HeadlessDevice = postkitView(
  deviceDefinition,
  ({ props, part }) => (
    <figure {...part('root')}>
      <div {...part('frame')}>
        {props.screens.map((screen) => (
          <img
            key={screen.src}
            {...part('screen')}
            src={screen.src}
            alt={screen.alt}
          />
        ))}
      </div>
      {props.caption ? (
        <figcaption {...part('caption')}>{props.caption}</figcaption>
      ) : null}
    </figure>
  ),
);

/** The Chakra recipe, slots typed from the definition's anatomy. */
export const deviceRecipe = defineSlotRecipe({
  className: 'site-device',
  slots: [...deviceDefinition.slots],
  base: {
    root: { display: 'grid', gap: '3', marginBlock: '8' },
    frame: { borderRadius: '2xl', borderWidth: '1px', overflow: 'hidden' },
    screen: { display: 'block', width: '100%' },
    caption: { color: 'fg.muted', fontSize: 'sm' },
  },
  variants: {
    frame: {
      phone: { frame: { maxWidth: '20rem', borderRadius: '3xl' } },
      laptop: { frame: { maxWidth: '48rem' } },
    },
    size: { sm: {}, md: {}, lg: {} },
    variant: { outline: {}, subtle: {}, plain: {} },
  },
  defaultVariants: { frame: 'phone', size: 'md', variant: 'subtle' },
});

/** The Chakra view: the same definition, plus the recipe. */
export const ChakraDevice = postkitChakraView(
  deviceDefinition,
  deviceRecipe,
  ({ props, part }) => (
    <Box as="figure" {...part('root')}>
      <Box {...part('frame')}>
        {props.screens.map((screen) => (
          <chakra.img
            key={screen.src}
            {...part('screen')}
            src={screen.src}
            alt={screen.alt}
          />
        ))}
      </Box>
      {props.caption ? (
        <Box as="figcaption" {...part('caption')}>
          {props.caption}
        </Box>
      ) : null}
    </Box>
  ),
  { fallback: 'recipe' },
);
