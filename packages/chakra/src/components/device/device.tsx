'use client';

import {
  Box,
  Image,
  Text,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { deviceDefinition } from '@postkit/core/components';
import { usePostkitFigureNumber } from '@postkit/react';

import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import { postkitChakraView } from '../../lib/view.js';
import {
  postkitDeviceRecipe,
  type PostkitDeviceSlot,
} from './device.recipe.js';

export type DeviceProps = {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string;
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitDeviceSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitDeviceSlot, string>>>;
} & RecipeVariantProps<typeof postkitDeviceRecipe> &
  UnstyledProp;

/**
 * A screenshot in a plain device frame drawn with CSS (a rounded bezel, a
 * notch for `iphone`, a base for `mac`), styled by its Chakra recipe. The
 * notch and base are decorative; the screenshot's `alt` describes it.
 * Beneath `figures="numbered"`, its number leads the caption.
 */
export const Device = postkitChakraView<typeof deviceDefinition, DeviceProps>(
  deviceDefinition,
  postkitDeviceRecipe,
  ({ props, part }) => {
    const figure = usePostkitFigureNumber();
    const { kind, caption } = props;
    return (
      <Box as="figure" {...part('root')}>
        <Box {...part('frame')}>
          {kind === 'iphone' ? (
            <Box as="span" aria-hidden="true" {...part('notch')} />
          ) : null}
          <Box {...part('screen')}>
            <Image
              src={props.src}
              alt={props.alt}
              loading="lazy"
              decoding="async"
              {...part('image')}
            />
          </Box>
        </Box>
        {kind === 'mac' ? (
          <Box as="span" aria-hidden="true" {...part('base')} />
        ) : null}
        {caption || figure ? (
          <Box as="figcaption" {...part('figcaption')}>
            {figure ? (
              <Text as="span" {...part('number')}>
                {figure.label()}
              </Text>
            ) : null}
            {caption ? (
              <Text as="span" {...part('caption')}>
                {caption}
              </Text>
            ) : null}
          </Box>
        ) : null}
      </Box>
    );
  },
);
