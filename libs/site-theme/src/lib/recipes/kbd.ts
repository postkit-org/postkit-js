import { defineRecipe, type RecipeDefinition } from '@chakra-ui/react';

/**
 * Site Kbd (02 §5): 20px tall, 6px radius, `bg.raised` with the `kbd` inset hairline.
 * Registered as `siteKbd` so Chakra's own `kbd` recipe (and anything Postkit renders with it)
 * keeps its look.
 */
export const siteKbdRecipe: RecipeDefinition = defineRecipe({
  className: 'site-kbd',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: '20px',
    minWidth: '20px',
    paddingInline: '6px',
    borderRadius: '6px',
    bg: 'bg.raised',
    boxShadow: 'kbd',
    color: 'fg.muted',
    fontFamily: 'inherit',
    fontSize: '11.5px',
    fontWeight: 'regular',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
});
