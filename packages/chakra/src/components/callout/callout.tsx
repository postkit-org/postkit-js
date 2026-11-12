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
  /**
   * An alias of `tone`, for content written with `type` (Prismark vaults,
   * D6). `tone` is canonical and wins when both are set.
   */
  readonly type?: CalloutTone;
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

type CalloutContext = PostkitChakraViewContext<
  typeof calloutDefinition,
  CalloutProps
>;

/**
 * What the shared Chakra Callout render takes: the view context, and
 * `mark: false` to leave out the tone mark (`Aside`, D14), whose anatomy has
 * no `icon`.
 *
 * @internal
 */
export type PostkitChakraCalloutRenderInput = Pick<
  CalloutContext,
  'props' | 'variants'
> &
  (
    | { readonly part: CalloutContext['part']; readonly mark?: true }
    | {
        readonly part: (
          name: Exclude<PostkitCalloutSlot, 'icon'>,
          options?: Parameters<CalloutContext['part']>[1],
        ) => ReturnType<CalloutContext['part']>;
        readonly mark: false;
      }
  );

/**
 * The Chakra Callout render, shared by `Callout` and `Aside` (Aside's
 * anatomy leaves out the `icon` part).
 *
 * @internal
 */
export function renderPostkitChakraCallout(
  input: PostkitChakraCalloutRenderInput,
) {
  const { props, variants, part } = input;
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
      {input.mark === false ? null : (
        <Alert.Indicator aria-hidden="true" {...input.part('icon')}>
          {props.icon ?? postkitCalloutMarks[tone]}
        </Alert.Indicator>
      )}
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
