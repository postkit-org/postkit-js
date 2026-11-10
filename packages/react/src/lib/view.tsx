import type {
  AnyPostkitComponentDefinition,
  PostkitPropsOf,
  PostkitSlotOf,
} from '@postkit/core/components';
import type {
  CSSProperties,
  FunctionComponent,
  HTMLAttributes,
  ReactNode,
} from 'react';

import {
  postkitPartAttributes,
  resolvePostkitViewState,
  warnPostkitProps,
  type PostkitPartAttributes,
} from './anatomy.js';

/** Attributes for a headless view's root element. */
export type PostkitRootProps = HTMLAttributes<HTMLElement> & {
  readonly [attribute: `data-${string}`]: string | undefined;
};

/**
 * The props every headless view accepts besides its definition's props.
 *
 * - `classNames` adds a class to a part (Tailwind-friendly, 03 §4 rung 3).
 * - `slotStyles` adds inline styles to a part.
 * - `rootProps` passes attributes to the root; its `className` and `style`
 *   merge last.
 * - `unstyled` marks the root `data-postkit-unstyled`, so the optional
 *   `styles.css` baseline leaves the instance alone. Instance `classNames` and
 *   `slotStyles` still apply.
 */
export interface PostkitViewOwnProps<Slot extends string> {
  readonly classNames?: Partial<Readonly<Record<Slot, string>>>;
  readonly slotStyles?: Partial<Readonly<Record<Slot, CSSProperties>>>;
  readonly rootProps?: PostkitRootProps;
  readonly unstyled?: boolean;
}

/** `children` for a definition with `children: 'mdx'`. */
export type PostkitChildrenPropsOf<
  Definition extends { readonly children: string },
> = Definition['children'] extends 'mdx'
  ? { readonly children?: ReactNode }
  : unknown;

/** The default props of a headless view built from `Definition`. */
export type PostkitViewProps<Definition extends AnyPostkitComponentDefinition> =
  PostkitPropsOf<Definition> &
    PostkitChildrenPropsOf<Definition> &
    PostkitViewOwnProps<PostkitSlotOf<Definition>>;

/** Per-call options for a headless `part()`. */
export interface PostkitPartOptions {
  /** View-owned inline styles, applied before `slotStyles`. */
  readonly style?: CSSProperties;
}

/** What a headless `part()` returns: spread it onto the part's element. */
export type PostkitPartProps = PostkitPartAttributes & {
  readonly className?: string;
  readonly style?: CSSProperties;
};

/** Returns the props for one anatomy part. */
export type PostkitPartGetter<
  Slot extends string,
  Options = PostkitPartOptions,
  Result = PostkitPartProps,
> = (name: Slot, options?: Options) => Result;

/** The argument to a headless view's render function. */
export interface PostkitViewContext<
  Definition extends AnyPostkitComponentDefinition,
  Props,
> {
  readonly definition: Definition;
  /**
   * The authored props with the definition's defaults applied. Enum values
   * the definition doesn't allow fall back to the default. The view-owned
   * props (`classNames`, `slotStyles`, `rootProps`, `unstyled`) are consumed
   * by `part()` and removed.
   */
  readonly props: Omit<Props, keyof PostkitViewOwnProps<string>>;
  /** The anatomy, `classNames`, `slotStyles` and `rootProps` for one part. */
  readonly part: PostkitPartGetter<PostkitSlotOf<Definition>>;
}

/** A view built by {@link postkitView}, carrying its definition. */
export type PostkitViewComponent<
  Definition extends AnyPostkitComponentDefinition,
  Props,
> = FunctionComponent<Props> & { readonly definition: Definition };

/** Options for {@link postkitView}. */
export interface PostkitViewOptions {
  /** Defaults to the definition's name. */
  readonly displayName?: string;
}

function joinClassNames(
  ...classNames: readonly (string | undefined)[]
): string | undefined {
  return classNames.filter(Boolean).join(' ') || undefined;
}

function mergeStyles(
  ...styles: readonly (CSSProperties | undefined)[]
): CSSProperties | undefined {
  const present = styles.filter(Boolean);
  if (present.length === 0) return undefined;
  return Object.assign({}, ...present) as CSSProperties;
}

/**
 * Builds a headless React view from a definition (03 §2.3).
 *
 * The view validates its props in development, applies the definition's
 * defaults, and hands `render` a `part(name)` that returns everything a part
 * needs: the anatomy attributes (`data-postkit-component` and the
 * theme-variant state on the root, `data-postkit-part` on every part), the
 * `classNames` entry, `slotStyles` and, on the root, `rootProps`.
 *
 * ```tsx
 * export const Callout = postkitView(calloutDefinition, ({ props, part }) => (
 *   <aside {...part('root')}>…</aside>
 * ));
 * ```
 *
 * Pass `Props` to widen the view's props beyond the definition's, such as an
 * `icon` node.
 */
export function postkitView<
  const Definition extends AnyPostkitComponentDefinition,
  Props extends object = PostkitViewProps<Definition>,
>(
  definition: Definition,
  render: (context: PostkitViewContext<Definition, Props>) => ReactNode,
  options: PostkitViewOptions = {},
): PostkitViewComponent<Definition, Props> {
  function PostkitView(props: Props) {
    const { classNames, slotStyles, rootProps, unstyled, ...authored } =
      props as Props & PostkitViewOwnProps<string>;
    warnPostkitProps(definition, authored);
    const { props: resolved, state } = resolvePostkitViewState(
      definition,
      authored,
    );
    const {
      className: rootClassName,
      style: rootStyle,
      ...restRootProps
    } = rootProps ?? {};

    const part = (name: string, partOptions?: PostkitPartOptions) => {
      const isRoot = name === 'root';
      return {
        ...postkitPartAttributes(definition, name, state, { unstyled }),
        ...(isRoot ? restRootProps : undefined),
        className: joinClassNames(
          classNames?.[name],
          isRoot ? rootClassName : undefined,
        ),
        style: mergeStyles(
          partOptions?.style,
          slotStyles?.[name],
          isRoot ? rootStyle : undefined,
        ),
      } as PostkitPartProps;
    };

    return render({
      definition,
      props: resolved as PostkitViewContext<Definition, Props>['props'],
      part,
    });
  }

  PostkitView.displayName = options.displayName ?? definition.name;
  return Object.assign(PostkitView, { definition });
}
