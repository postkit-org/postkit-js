import {
  cloneElement,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { PostkitAnyComponent } from './config.js';

type ElementProps = Record<string, unknown> & { readonly children?: unknown };

function swapChildren(
  children: unknown,
  slots: Readonly<Record<string, PostkitAnyComponent>>,
  wrap: (component: PostkitAnyComponent) => PostkitAnyComponent,
): unknown {
  if (Array.isArray(children)) {
    let changed = false;
    const next = children.map((child) => {
      const swapped = swapChildren(child, slots, wrap);
      if (swapped !== child) changed = true;
      return swapped;
    });
    return changed ? next : children;
  }
  if (!isValidElement(children)) return children;

  const element = children as ReactElement<ElementProps>;
  const props = element.props;
  const nested =
    props.children === undefined
      ? undefined
      : swapChildren(props.children, slots, wrap);
  const part = props['data-postkit-part'];
  const Override =
    typeof part === 'string' && Object.hasOwn(slots, part)
      ? slots[part]
      : undefined;

  if (Override) {
    return createElement(wrap(Override), {
      ...props,
      key: element.key,
      ...(nested === undefined ? {} : { children: nested }),
    });
  }
  return nested === props.children
    ? element
    : cloneElement(element, { children: nested } as Partial<ElementProps>);
}

/**
 * Replaces anatomy parts in a view's rendered tree with slot overrides
 * (03 §4 rung 5). Each element whose `data-postkit-part` names an overridden
 * slot becomes the override, which receives the element's props: the anatomy
 * attributes, `className`, styles and children.
 *
 * It walks the elements a view returns, so a part rendered inside another
 * component's own render isn't reached. Renderers pass `wrap` to adapt an
 * override, as `@postkit/chakra` does to turn its `css` into a class name.
 */
export function applyPostkitSlotOverrides(
  node: ReactNode,
  slots: Readonly<Record<string, PostkitAnyComponent>> | undefined,
  wrap: (component: PostkitAnyComponent) => PostkitAnyComponent = (component) =>
    component,
): ReactNode {
  if (!slots || Object.keys(slots).length === 0) return node;
  return swapChildren(node, slots, wrap) as ReactNode;
}
