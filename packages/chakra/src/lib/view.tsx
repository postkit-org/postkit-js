'use client';

import {
  useChakraContext,
  type BoxProps,
  type SlotRecipeConfig,
  type SystemStyleObject,
} from '@chakra-ui/react';
import type {
  AnyPostkitComponentDefinition,
  PostkitPropsOf,
  PostkitSlotOf,
} from '@postkit/core/components';
import {
  postkitPartAttributes,
  resolvePostkitViewState,
  warnPostkitProps,
  type PostkitChildrenPropsOf,
  type PostkitPartAttributes,
  type PostkitPartGetter,
  type PostkitViewComponent,
} from '@postkit/react';
import type { ReactNode } from 'react';

import {
  postkitSlotClassName,
  type PostkitSlotStyles,
  usePostkitSlotRecipe,
} from './recipes/types.js';

/**
 * The props every Chakra view accepts besides its definition's props.
 *
 * - `classNames` adds a class to a part, after the recipe's class.
 * - `slotStyles` adds Chakra styles to a part, after the recipe's.
 * - `rootProps` passes Chakra props to the root; its `className` and `css`
 *   merge last.
 * - `unstyled` drops the recipe's styles (its class names stay) and marks the
 *   root `data-postkit-unstyled`. `classNames` and `slotStyles` still apply.
 */
export interface PostkitChakraViewOwnProps<Slot extends string> {
  readonly classNames?: Partial<Readonly<Record<Slot, string>>>;
  readonly slotStyles?: PostkitSlotStyles<Slot>;
  readonly rootProps?: BoxProps;
  readonly unstyled?: boolean;
}

/** The default props of a Chakra view built from `Definition`. */
export type PostkitChakraViewProps<
  Definition extends AnyPostkitComponentDefinition,
> = PostkitPropsOf<Definition> &
  PostkitChildrenPropsOf<Definition> &
  PostkitChakraViewOwnProps<PostkitSlotOf<Definition>>;

/** Per-call options for a Chakra `part()`. */
export interface PostkitChakraPartOptions {
  /** View-owned styles, applied after the recipe's and before `slotStyles`. */
  readonly css?: SystemStyleObject;
}

/** What a Chakra `part()` returns: spread it onto the part's element. */
export type PostkitChakraPartProps = PostkitPartAttributes & {
  readonly className?: string;
  readonly css: (SystemStyleObject | undefined)[];
};

/** The argument to a Chakra view's render function. */
export interface PostkitChakraViewContext<
  Definition extends AnyPostkitComponentDefinition,
  Props,
> {
  readonly definition: Definition;
  /**
   * The authored props with defaults applied. An unset theme-variant prop
   * takes the recipe's `defaultVariants` value (so a host's
   * `createPostkitTheme` default shows in the anatomy), then the
   * definition's default.
   */
  readonly props: Omit<Props, keyof PostkitChakraViewOwnProps<string>>;
  /**
   * The theme-variant props as authored: what the recipe receives. Unset
   * values stay `undefined` so the recipe's `defaultVariants` apply, and
   * responsive values pass through.
   */
  readonly variants: Readonly<Record<string, unknown>>;
  /**
   * The anatomy attributes, the recipe class and styles, and the instance's
   * `classNames`, `slotStyles` and `rootProps` for one part.
   */
  readonly part: PostkitPartGetter<
    PostkitSlotOf<Definition>,
    PostkitChakraPartOptions,
    PostkitChakraPartProps
  >;
}

/** Options for {@link postkitChakraView}. */
export interface PostkitChakraViewOptions {
  /**
   * The Chakra slot-recipe key the host's system registers the recipe under.
   * Defaults to `postkit<Name>`, such as `postkitCallout`.
   */
  readonly recipeKey?: string;
  /** Defaults to the definition's name. */
  readonly displayName?: string;
}

/**
 * Builds a Chakra view from a definition and its slot recipe (03 §2.3).
 *
 * It has the headless `postkitView` contract (development prop validation,
 * definition defaults, and a `part(name)` that returns the same anatomy
 * attributes), plus the recipe: `part()` adds the slot's recipe class and a
 * `css` array that merges the recipe's styles, the view's own `css`,
 * `slotStyles` and, on the root, `rootProps.css`.
 *
 * The recipe comes from the host's Chakra system when it registers one under
 * `recipeKey` (so `createPostkitTheme` overrides apply), and otherwise renders
 * unstyled with the recipe's class names.
 */
export function postkitChakraView<
  const Definition extends AnyPostkitComponentDefinition,
  Props extends object = PostkitChakraViewProps<Definition>,
>(
  definition: Definition,
  recipe: SlotRecipeConfig,
  render: (context: PostkitChakraViewContext<Definition, Props>) => ReactNode,
  options: PostkitChakraViewOptions = {},
): PostkitViewComponent<Definition, Props> {
  const recipeKey = options.recipeKey ?? `postkit${definition.name}`;

  function PostkitChakraView(props: Props) {
    const { classNames, slotStyles, rootProps, unstyled, ...authored } =
      props as Props & PostkitChakraViewOwnProps<string>;
    warnPostkitProps(definition, authored);

    const slotRecipe = usePostkitSlotRecipe(recipeKey, recipe);
    const registered = useChakraContext().getSlotRecipe(recipeKey) as
      SlotRecipeConfig | undefined;
    const { props: resolved, state } = resolvePostkitViewState(
      definition,
      authored,
      { themeDefaults: registered?.defaultVariants },
    );

    const variants: Record<string, unknown> = {};
    for (const name of definition.themeVariants) {
      variants[name] = authored[name as keyof typeof authored];
    }
    const styles: PostkitSlotStyles<string> = unstyled
      ? {}
      : (slotRecipe(variants) as PostkitSlotStyles<string>);
    const {
      css: rootCss,
      className: rootClassName,
      ...restRootProps
    } = rootProps ?? {};

    const part = (name: string, partOptions?: PostkitChakraPartOptions) => {
      const isRoot = name === 'root';
      const css: (SystemStyleObject | undefined)[] = [styles[name]];
      if (partOptions && 'css' in partOptions) css.push(partOptions.css);
      css.push(slotStyles?.[name]);
      if (isRoot) css.push(rootCss as SystemStyleObject | undefined);
      return {
        ...postkitPartAttributes(definition, name, state, { unstyled }),
        ...(isRoot ? restRootProps : undefined),
        className: postkitSlotClassName(
          postkitSlotClassName(
            slotRecipe.classNameMap[name],
            classNames?.[name],
          ),
          isRoot ? rootClassName : undefined,
        ),
        css,
      } as PostkitChakraPartProps;
    };

    return render({
      definition,
      props: resolved as PostkitChakraViewContext<Definition, Props>['props'],
      variants,
      part,
    });
  }

  PostkitChakraView.displayName = options.displayName ?? definition.name;
  return Object.assign(PostkitChakraView, { definition });
}
