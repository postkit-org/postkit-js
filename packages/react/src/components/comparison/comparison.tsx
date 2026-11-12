import {
  comparisonDefinition,
  type PostkitSlotOf,
} from '@postkit/core/components';
import { useId } from 'react';

import { parsePostkitJsonArray } from '../../lib/json-props.js';
import { postkitView, type PostkitViewProps } from '../../lib/view.js';

/** One compared feature: its label and one value per column. */
export interface ComparisonItem {
  readonly label: string;
  readonly values: readonly (string | number | boolean | null)[];
}

export type ComparisonSlot = PostkitSlotOf<typeof comparisonDefinition>;
export type ComparisonProps = Omit<
  PostkitViewProps<typeof comparisonDefinition>,
  'columns' | 'items'
> & {
  /** The compared option labels, or their JSON array text. */
  readonly columns: string | readonly string[];
  /** The feature rows, or their JSON array text. */
  readonly items: string | readonly ComparisonItem[];
};

/** How a comparison cell shows its value: `Yes`, `No`, the value, or `—`. */
export function postkitComparisonValue(
  value: string | number | boolean | null | undefined,
): string | number {
  return value === true ? 'Yes' : value === false ? 'No' : (value ?? '—');
}

/** An accessible feature and option comparison table: headless markup only. */
export const Comparison = postkitView<
  typeof comparisonDefinition,
  ComparisonProps
>(comparisonDefinition, ({ props, part }) => {
  const columns = parsePostkitJsonArray<string>(
    props.columns,
    'Comparison columns',
  );
  const items = parsePostkitJsonArray<ComparisonItem>(
    props.items,
    'Comparison items',
  );
  const titleId = `${useId()}-title`;
  return (
    <div {...part('root')}>
      {props.title ? (
        <p {...part('title')} id={titleId}>
          {props.title}
        </p>
      ) : null}
      {props.description ? (
        <p {...part('description')}>{props.description}</p>
      ) : null}
      {/* The table scrolls sideways on narrow screens, so keyboard users need to reach it. */}
      <div
        {...part('scroller')}
        tabIndex={0}
        role="region"
        {...(props.title
          ? { 'aria-labelledby': titleId }
          : { 'aria-label': 'Comparison' })}
      >
        <table {...part('table')}>
          <thead {...part('head')}>
            <tr>
              <th {...part('header')}>Feature</th>
              {columns.map((column) => (
                <th {...part('header')} key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr {...part('row')} key={item.label}>
                <th {...part('label')} scope="row">
                  {item.label}
                </th>
                {columns.map((_, index) => (
                  <td {...part('value')} key={index}>
                    {postkitComparisonValue(item.values[index])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
