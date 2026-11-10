import { chakra, useSlotRecipe } from '@chakra-ui/react';
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface SegmentedControlItem<V extends string = string> {
  value: V;
  label: ReactNode;
  /** The accessible name, for segments whose label is an icon. Also shown as a tooltip. */
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<V extends string = string> {
  items: readonly SegmentedControlItem<V>[];
  /** The selected value (controlled). */
  value?: V;
  /** The initially selected value (uncontrolled). */
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** Stretch the track to its container, as the phone boards do. */
  fullWidth?: boolean;
  /** `icon`: 30×24 icon segments on a 2px track (the footer theme switch). */
  size?: 'md' | 'icon';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
  className?: string;
}

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

/**
 * A radiogroup drawn as a segmented control (`siteSegmentedControl` recipe).
 *
 * Keyboard (the WAI-ARIA radio group pattern): Tab reaches the selected segment only;
 * the arrow keys move and select (Left/Right flip in RTL), Home and End jump to the ends,
 * and disabled segments (`aria-disabled`) are skipped.
 */
export function SegmentedControl<V extends string = string>({
  items,
  value,
  defaultValue,
  onValueChange,
  fullWidth = false,
  size = 'md',
  id,
  className,
  ...aria
}: SegmentedControlProps<V>) {
  const recipe = useSlotRecipe({ key: 'siteSegmentedControl' });
  const styles = recipe({ fullWidth, size });
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const selected = value !== undefined ? value : uncontrolled;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const enabled = items
    .map((item, index) => (item.disabled ? -1 : index))
    .filter((index) => index >= 0);
  const selectedIndex = items.findIndex((item) => item.value === selected);
  const tabStop =
    selectedIndex >= 0 && !items[selectedIndex].disabled
      ? selectedIndex
      : (enabled[0] ?? -1);

  const select = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    if (value === undefined) setUncontrolled(item.value);
    if (item.value !== selected) onValueChange?.(item.value);
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!enabled.length) return;
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const position = enabled.indexOf(index);
    let target: number | undefined;

    if (event.key === 'Home') target = enabled[0];
    else if (event.key === 'End') target = enabled[enabled.length - 1];
    else {
      const horizontal =
        event.key === 'ArrowLeft' || event.key === 'ArrowRight';
      const forward = NEXT_KEYS.has(event.key);
      if (!forward && !PREV_KEYS.has(event.key)) return;
      const step = (forward ? 1 : -1) * (rtl && horizontal ? -1 : 1);
      target = enabled[(position + step + enabled.length) % enabled.length];
    }

    event.preventDefault();
    if (target === undefined) return;
    select(target);
    refs.current[target]?.focus();
  };

  return (
    <chakra.div
      role="radiogroup"
      id={id}
      className={[recipe.classNameMap?.root, className]
        .filter(Boolean)
        .join(' ')}
      css={styles.root}
      {...aria}
    >
      {items.map((item, index) => {
        const checked = item.value === selected;
        return (
          <chakra.button
            key={item.value}
            ref={(node: HTMLButtonElement | null) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={item.ariaLabel}
            title={item.ariaLabel}
            aria-disabled={item.disabled || undefined}
            data-state={checked ? 'checked' : 'unchecked'}
            tabIndex={index === tabStop ? 0 : -1}
            className={recipe.classNameMap?.item}
            css={styles.item}
            onClick={() => select(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {item.label}
          </chakra.button>
        );
      })}
    </chakra.div>
  );
}
