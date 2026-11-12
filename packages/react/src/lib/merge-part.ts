import { mergeProps } from '@zag-js/react';

/**
 * Merges a behaviour's prop getters (Zag or Postkit machines) with a part's
 * anatomy props: handlers chain, class names join and styles merge. An empty
 * class name or style is dropped, so a part without `classNames` or
 * `slotStyles` renders no empty `class` or `style` attribute.
 *
 * @internal
 */
export function mergePostkitPartProps<Props extends object>(
  ...props: readonly (object | undefined)[]
): Props {
  const merged = mergeProps(
    ...(props.filter(Boolean) as Record<string, unknown>[]),
  ) as Record<string, unknown>;
  if (!merged['className']) delete merged['className'];
  const style = merged['style'];
  if (
    style &&
    typeof style === 'object' &&
    Object.keys(style as object).length === 0
  ) {
    delete merged['style'];
  }
  return merged as Props;
}
