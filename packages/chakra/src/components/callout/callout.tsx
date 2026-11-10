'use client';

import {
  Alert,
  Heading,
  type BoxProps,
  type RecipeVariantProps,
  type UnstyledProp,
} from '@chakra-ui/react';
import { calloutDefinition } from '@postkit/core/components';
import { postkitCalloutMarks, type CalloutTone } from '@postkit/react';
import type { ReactNode } from 'react';

import { postkitHeadingSize } from '../../lib/components/heading-size.js';
import type { PostkitSlotStyles } from '../../lib/recipes/types.js';
import {
  postkitChakraView,
  type PostkitChakraViewContext,
} from '../../lib/view.js';
import {
  postkitCalloutRecipe,
  type PostkitCalloutSlot,
} from './callout.recipe.js';

export type CalloutProps = {
  readonly title?: string;
  readonly children?: ReactNode;
  readonly icon?: ReactNode;
  /** Overrides `data-postkit-component`. `Aside` sets it for you. */
  readonly componentName?: 'Aside' | 'Callout';
  readonly rootProps?: BoxProps;
  readonly slotStyles?: PostkitSlotStyles<PostkitCalloutSlot>;
  /** A class per anatomy part, added after the recipe's class. */
  readonly classNames?: Partial<Readonly<Record<PostkitCalloutSlot, string>>>;
} & RecipeVariantProps<typeof postkitCalloutRecipe> &
  UnstyledProp;

const toneStatus = {
  note: 'info',
  tip: 'success',
  important: 'neutral',
  warning: 'warning',
  caution: 'error',
} as const satisfies Record<CalloutTone, string>;

/**
 * The Chakra Callout render, shared by `Callout` and `Aside`.
 *
 * @internal
 */
export function renderPostkitChakraCallout({
  props,
  variants,
  part,
}: Pick<
  PostkitChakraViewContext<typeof calloutDefinition, CalloutProps>,
  'part' | 'props' | 'variants'
>) {
  const tone: CalloutTone =
    typeof props.tone === 'string' && props.tone in postkitCalloutMarks
      ? props.tone
      : 'note';
  return (
    <Alert.Root
      as="aside"
      status={toneStatus[tone]}
      data-postkit-tone={tone}
      {...part('root')}
      {...(props.componentName
        ? { 'data-postkit-component': props.componentName }
        : undefined)}
    >
      <Alert.Indicator aria-hidden="true" {...part('icon')}>
        {props.icon ?? postkitCalloutMarks[tone]}
      </Alert.Indicator>
      <Alert.Content {...part('content')}>
        {props.title ? (
          <Alert.Title asChild>
            <Heading
              as="p"
              size={postkitHeadingSize(variants['size'], {
                sm: 'sm',
                md: 'md',
                lg: 'lg',
              })}
              {...part('title')}
            >
              {props.title}
            </Heading>
          </Alert.Title>
        ) : null}
        <Alert.Description {...part('body')}>
          {props.children}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

/** A highlighted note, tip, warning, or caution, styled by its Chakra recipe. */
export const Callout = postkitChakraView<
  typeof calloutDefinition,
  CalloutProps
>(calloutDefinition, postkitCalloutRecipe, renderPostkitChakraCallout);
