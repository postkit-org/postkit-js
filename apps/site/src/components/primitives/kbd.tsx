import { createRecipeContext, type HTMLChakraProps } from '@chakra-ui/react';

const { withContext } = createRecipeContext({ key: 'siteKbd' });

export type KbdProps = HTMLChakraProps<'kbd'>;

/** A key cap (`siteKbd` recipe): 20px tall, 6px radius, `bg.raised` with an inset hairline. */
export const Kbd = withContext<HTMLElement, KbdProps>('kbd');
