'use client';

import type { SystemStyleObject } from '@chakra-ui/react';
import { asideDefinition } from '@postkit/core/components';

import { postkitChakraView } from '../../lib/view.js';
import { postkitCalloutRecipe } from '../callout/callout.recipe.js';
import {
  renderPostkitChakraCallout,
  type CalloutProps,
} from '../callout/callout.js';
import { postkitFootnoteTokens as tokens } from '../footnote/footnote.recipe.js';

export type AsideProps = CalloutProps;

/**
 * Aside is the authored sidenote (D14): where footnotes are sidenotes (the
 * footnotes behaviour marks the text column `data-postkit-margin="side"`),
 * it moves into the margin column beside them, quieter and without a box.
 * Elsewhere it's a quiet block in the text column.
 */
const postkitAsideMarginCss: SystemStyleObject = {
  '[data-postkit-margin=side] > &': {
    background: 'transparent',
    borderRadius: '0',
    borderWidth: '0',
    clear: 'inline-end',
    color: 'fg.muted',
    float: 'inline-end',
    fontSize: tokens.textSize,
    marginBlockEnd: '4',
    marginBlockStart: '0.2em',
    marginInlineEnd: `calc(-1 * (${tokens.sidenoteWidth} + ${tokens.sidenoteGap}))`,
    padding: '0',
    paddingInlineStart: '3',
    width: tokens.sidenoteWidth,
    '@media print': { float: 'none', marginInlineEnd: '0', width: 'auto' },
  },
};

/**
 * A semantic article aside. It is the Callout view under its own definition,
 * styled by the Callout recipe (`postkitCallout`).
 */
export const Aside = postkitChakraView<typeof asideDefinition, AsideProps>(
  asideDefinition,
  postkitCalloutRecipe,
  ({ props, variants, part }) =>
    renderPostkitChakraCallout({
      props,
      variants,
      part: (name, options) =>
        name === 'root'
          ? part('root', {
              css: { ...options?.css, ...postkitAsideMarginCss },
            })
          : part(name, options),
    }),
  { recipeKey: 'postkitCallout' },
);
